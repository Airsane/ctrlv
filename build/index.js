"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
class Ctrlv {
    constructor() {
        this.notExists = '/images/notexists.png';
        this.images = [];
        this.loadData();
        this.work();
    }
    generateCode(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }
    getImage() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = this.generateCode(4);
            const data = (yield axios_1.default.get('https://ctrlv.cz/' + code)).data;
            const $ = cheerio.load(data);
            const img = $('a.zoomCursor');
            if (img.attr('href') != this.notExists) {
                return img.attr('href');
            }
            return this.getImage();
        });
    }
    parseDate(url) {
        const splited = url.split('/');
        return `${splited[4]}.${splited[3]}.${splited[2]}`;
    }
    loadData() {
        if (!fs.existsSync('./data.json'))
            return;
        this.images = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    }
    saveData() {
        fs.writeFileSync('data.json', JSON.stringify(this.images));
    }
    work() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const id = yield this.getImage();
                const date = this.parseDate(id);
                this.images.push({ id: id, created: date });
                console.log(`Found new entry ${id} - ${date}\nTotal: ${this.images.length}`);
                this.saveData();
            }
        });
    }
}
const d = new Ctrlv();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = express_1.default();
var cors = require('cors');
app.use(cors());
app.use(express_1.default.json());
app.get("/list", (req, res) => {
    res.send(fs.readFileSync('data.json', 'utf-8'));
});
app.post('/downloadImg', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = req.body.url;
    const d = yield axios_1.default.get(url, {
        responseType: 'arraybuffer'
    })
        .then(response => Buffer.from(response.data, 'binary').toString('base64'));
    res.send(d);
    console.log(url);
}));
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'web')));
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'web', 'index.html'));
});
app.listen(3000, () => {
    console.log("ready");
});
