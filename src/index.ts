import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import express from 'express';
import path from "path";
import {Client, Intents, MessageAttachment, TextChannel} from "discord.js";

class Ctrlv {
    private notExists = '/images/notexists.png';
    private images: Data[] = [];
    private client: Client

    constructor() {
        this.loadData();
        this.work();
        this.client = new Client<boolean>({
            intents: [Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            messageCacheLifetime: 180,
        })
        this.client.login(process.env.TOKEN);

    }

    private generateCode(length: number) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    private async sendImage(urld:string){
        const d = (await axios.get('https://ctrlv.cz'+urld, {
            responseType: 'arraybuffer'
        })).data
        const split = urld.split('/');
        const name = split[split.length-1];
        const channel = <TextChannel>this.client.channels.cache.get('924399098939994196')!;
        const attachment = new MessageAttachment(d,name);
        const message = await channel.send({files:[attachment]});
        let url = "";
        message.attachments.map((attachment)=>{
            url = attachment.url;
        })
        return url;
    }

    private async getImage(): Promise<string> {
        const code = this.generateCode(4);
        const data = (await axios.get('https://ctrlv.cz/' + code)).data;
        const $ = cheerio.load(data);
        const img = $('a.zoomCursor');
        if (img.attr('href') != this.notExists) {
            return img.attr('href')!;
        }
        return this.getImage();
    }

    private parseDate(url: string): string {
        const splited = url.split('/');
        return `${splited[4]}.${splited[3]}.${splited[2]}`;
    }


    private loadData() {
        if (!fs.existsSync('./data.json'))
            return;
        this.images = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    }

    private saveData() {
        fs.writeFileSync('data.json', JSON.stringify(this.images));
    }

    private async work() {
        while (true) {
            const id = await this.getImage()
            const date = this.parseDate(id);
            const url = await this.sendImage(id);
            this.images.push({id: id, created: date,url:url});
            console.log(`Found new entry ${id} - ${date}\nTotal: ${this.images.length}`);
            this.saveData();
        }
    }

}


const d = new Ctrlv();

export interface Data {
    id: string;
    created: string;
    url:string;
}

const app = express();
var cors = require('cors')
app.use(cors())
app.use(express.json());

app.get("/list", (req, res) => {
    res.send(fs.readFileSync('data.json', 'utf-8'))
})

app.use(express.static(path.join(__dirname, '..', 'web')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
})

app.listen(3000, () => {
    console.log("ready")
});