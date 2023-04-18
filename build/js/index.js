"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const sync_1 = require("csv-parse/sync");
const config_1 = tslib_1.__importDefault(require("config"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const config = config_1.default.util.toObject(config_1.default);
const checkUser_1 = tslib_1.__importDefault(require("./checkUser"));
const createqr_1 = tslib_1.__importDefault(require("./createqr"));
const sendqr_1 = tslib_1.__importDefault(require("./sendqr"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
app.get('/', (req, res) => {
    // staticでpublic配下が送られる
});
app.get('/getLoginUrl', (req, res) => {
    console.log('GET /getLoginUrl');
    const discordState = Math.random() * 100000000;
    const url = `https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=${config.clientId}&state=${discordState}&scope=${config.scope}`;
    res.send(JSON.stringify({ url }));
});
app.post('/checkUser', (req, res) => {
    console.log(`POST /checkUser`);
    checkUserInner(req, res);
});
app.post('/createSample', (req, res) => {
    console.log(`POST /createSample`);
    createSampleInner(req, res);
});
app.post('/sendDM', (req, res) => {
    console.log(`POST /sendDM`);
    sendDMInner(req, res);
});
app.listen(config.port, () => {
    console.log(`Start server. port: ${config.port}`);
});
/** 認証したトークンのリスト。何度もDiscordに投げるとrate limitに引っかかるので自前でキャッシュしておく */
let tokenList = [];
/** 認証情報をチェック */
const checkUserInnerInner = async (req) => {
    const authHeader = req.get('Authorization');
    const exist = tokenList.find((item) => item.token === authHeader);
    if (!exist) {
        //
    }
    else if (exist.expire < new Date().getTime()) {
        // 期限切れ
        tokenList = tokenList.filter((item) => item.token === authHeader);
    }
    else if (exist.expire > new Date().getTime()) {
        console.log('トークン認証 キャッシュ再利用');
        return exist.result;
    }
    console.log('トークン認証 所属チェック処理');
    const info = await (0, checkUser_1.default)(authHeader);
    const date = new Date();
    date.setDate(date.getDate() + 1); // ほんとの期限はいつなんだ・・・
    tokenList.push({
        token: authHeader,
        expire: date.getTime(),
        result: info,
    });
    return info;
};
const checkUserInner = async (req, res) => {
    console.log('checkUser');
    const info = await checkUserInnerInner(req);
    const response = {
        type: 'checkUser',
        data: info,
    };
    res.send(JSON.stringify(response));
};
const createSampleInner = async (req, res) => {
    try {
        if ((await checkUserInnerInner(req)).status !== 'ok') {
            res.sendStatus(401);
        }
        const isAll = req.query.isall === 'true';
        const message = req.body.message;
        const sendToListCsv = req.body.sendToList;
        const sendToList = (0, sync_1.parse)(sendToListCsv);
        sendToList.shift(); // 1行目はヘッダーなので
        // console.log(isAll);
        // console.log(message);
        // console.log(sendToList);
        // console.log(sendToList.length);
        const resList = [];
        for (const item of sendToList) {
            if (item.length !== 5) {
                console.warn('データの列数がおかしい. data=' + JSON.stringify(item));
                continue;
            }
            const username = item[0];
            const discordtag = item[1];
            const discordId = item[2];
            const judge = item[3];
            const code = item[4];
            // メッセージにコードを埋め込み
            const messageWithCode = message.replace('{code}', code);
            // QR生成
            const qrpath = await (0, createqr_1.default)(code);
            const b64 = png2b64(qrpath);
            resList.push({
                discordtag,
                message: messageWithCode,
                qr: b64,
            });
            if (!isAll) {
                // console.log('単一要素だけ出力');
                break;
            }
        }
        const response = {
            status: 'ok',
            data: resList,
        };
        res.send(response);
    }
    catch (e) {
        console.error(e);
        res.send({ status: 'ng' });
    }
};
/** DiscordDMを送る */
const sendDMInner = async (req, res) => {
    try {
        if ((await checkUserInnerInner(req)).status !== 'ok') {
            res.sendStatus(401);
        }
        const message = req.body.message;
        const sendToListCsv = req.body.sendToList;
        const sendToList = (0, sync_1.parse)(sendToListCsv);
        sendToList.shift(); // 1行目はヘッダーなので
        const sendList = [];
        for (const item of sendToList) {
            if (item.length !== 5) {
                console.warn('データの列数がおかしい. data=' + JSON.stringify(item));
                continue;
            }
            // const username = item[0];
            // const discordtag = item[1];
            const discordId = item[2];
            // const judge = item[3];
            const code = item[4];
            // メッセージにコードを埋め込み
            const messageWithCode = message.replace('{code}', code);
            // QR生成
            const qrpath = await (0, createqr_1.default)(code);
            if (!qrpath) {
                throw new Error('QR画像が生成できなかった code=' + code);
            }
            sendList.push({
                discordId,
                message: messageWithCode,
                code: code,
                filepath: qrpath,
            });
        }
        // DMを送る
        const result = await (0, sendqr_1.default)(sendList);
        // 要求元に返却
        res.send(result);
    }
    catch (e) {
        console.error(e);
        res.send({ status: 'ng', data: e.message });
    }
};
/** pngファイルをbase64化する */
const png2b64 = (filepath) => {
    if (!fs_extra_1.default.existsSync(filepath))
        return null;
    const file = fs_extra_1.default.readFileSync(filepath);
    const b64 = file.toString('base64');
    return `data:image/png;base64,${b64}`;
};
