"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const qrcode_1 = tslib_1.__importDefault(require("qrcode"));
/** QRの画像を生成 */
const createQr = async (code) => {
    return new Promise((resolve, reject) => {
        const basedir = `data/qr`;
        if (!fs_extra_1.default.existsSync(basedir)) {
            fs_extra_1.default.mkdirpSync(basedir);
        }
        // QR作成
        const qrpath = `${basedir}/${code}.png`;
        const text = code;
        const option = {
            type: 'png',
            errorCorrectionLevel: 'H',
        };
        qrcode_1.default.toFile(qrpath, text, option, function (err) {
            if (err) {
                console.log(`${code} でエラー`);
                reject(err);
            }
            else {
                console.log(`QR created ${qrpath}`);
                resolve(qrpath);
            }
        });
        // console.log('完了');
    });
};
exports.default = createQr;
