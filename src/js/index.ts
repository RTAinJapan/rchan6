import express from 'express';
import { parse } from 'csv-parse/sync';
import configModule from 'config';
import fs from 'fs-extra';
const config: Config = configModule.util.toObject(configModule);

type ExpressFunc = Parameters<typeof app.get>[1];
type ExpressRequest = Parameters<ExpressFunc>[0];
type ExpressResponse = Parameters<ExpressFunc>[1];

import checkUser from './checkUser';
import createqr from './createqr';
import sendqr from './sendqr';

const app = express();
app.use(express.json());
app.use(express.static('public'));

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
let tokenList: {
  token: string;
  expire: number;
  result: PromiseType<ReturnType<typeof checkUser>>;
}[] = [];

/** 認証情報をチェック */
const checkUserInnerInner = async (req: ExpressRequest): ReturnType<typeof checkUser> => {
  const authHeader = req.get('Authorization') as string;

  const exist = tokenList.find((item) => item.token === authHeader);
  if (!exist) {
    //
  } else if (exist.expire < new Date().getTime()) {
    // 期限切れ
    tokenList = tokenList.filter((item) => item.token === authHeader);
  } else if (exist.expire > new Date().getTime()) {
    console.log('トークン認証 キャッシュ再利用');
    return exist.result;
  }

  console.log('トークン認証 所属チェック処理');
  const info = await checkUser(authHeader);
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

const createSampleInner = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    if ((await checkUserInnerInner(req)).status !== 'ok') {
      res.sendStatus(401);
    }

    const isAll = req.query.isall === 'true';
    const message: string = req.body.message;
    const sendToListCsv: string = req.body.sendToList;
    const sendToList: string[] = parse(sendToListCsv);
    sendToList.shift(); // 1行目はヘッダーなので

    // console.log(isAll);
    // console.log(message);
    // console.log(sendToList);
    // console.log(sendToList.length);

    const resList: {
      discordtag: string;
      message: string;
      qr: string | null;
    }[] = [];

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
      const qrpath = await createqr(code);
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
  } catch (e) {
    console.error(e);
    res.send({ status: 'ng' });
  }
};

/** DiscordDMを送る */
const sendDMInner = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    if ((await checkUserInnerInner(req)).status !== 'ok') {
      res.sendStatus(401);
    }

    const message: string = req.body.message;
    const sendToListCsv: string = req.body.sendToList;
    const sendToList: string[] = parse(sendToListCsv);
    sendToList.shift(); // 1行目はヘッダーなので

    const sendList: {
      discordId: string;
      message: string;
      code: string;
      filepath: string;
    }[] = [];

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
      const qrpath = await createqr(code);
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
    const result = await sendqr(sendList);

    // 要求元に返却
    res.send(result);
  } catch (e) {
    console.error(e);
    res.send({ status: 'ng', data: (e as any).message });
  }
};

/** pngファイルをbase64化する */
const png2b64 = (filepath: string) => {
  if (!fs.existsSync(filepath)) return null;
  const file = fs.readFileSync(filepath);
  const b64 = file.toString('base64');
  return `data:image/png;base64,${b64}`;
};
