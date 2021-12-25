import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

class Ctrlv {
    private notExists = '/images/notexists.png';
    private images: Data[] = [];

    constructor() {
        this.loadData();
        this.work();
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

    private async work(){
        while (true){
            const id = await this.getImage()
            const date = this.parseDate(id);
            this.images.push({id:id,created:date});
            console.log(`Found new entry ${id} - ${date}\nTotal: ${this.images.length}`);
            this.saveData();
        }
    }

}



const d = new Ctrlv();

export interface Data {
    id: string;
    created: string;
}

import express from 'express';
import path from "path";
const app = express();
var cors = require('cors')
app.use(cors())
app.use(express.json());

app.get("/list",(req,res)=>{
    res.send(fs.readFileSync('data.json', 'utf-8'))
})

app.post('/downloadImg',async (req,res)=>{
    const url = req.body.url;
    const d = await axios.get(url, {
            responseType: 'arraybuffer'
        })
        .then(response => Buffer.from(response.data, 'binary').toString('base64'))
    res.send(d);
})

app.use(express.static(path.join(__dirname,'..','web')));


app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','web','index.html'));
})

app.listen(3000,()=>{
    console.log("ready")
});