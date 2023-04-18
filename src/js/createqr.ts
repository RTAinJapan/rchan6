import fs from 'fs-extra';
import QRCode from 'qrcode';

/** QRの画像を生成 */
const createQr = async (code: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const basedir = `data/qr`;
    if (!fs.existsSync(basedir)) {
      fs.mkdirpSync(basedir);
    }

    // QR作成
    const qrpath = `${basedir}/${code}.png`;
    const text = code;
    const option: QRCode.QRCodeToFileOptions = {
      type: 'png', //未指定ならpng
      errorCorrectionLevel: 'H',
    };

    QRCode.toFile(qrpath, text, option, function (err) {
      if (err) {
        console.log(`${code} でエラー`);
        reject(err);
      } else {
        console.log(`QR created ${qrpath}`);
        resolve(qrpath);
      }
    });
    // console.log('完了');
  });
};

export default createQr;
