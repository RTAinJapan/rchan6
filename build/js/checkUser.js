"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const config_1 = tslib_1.__importDefault(require("config"));
const config = config_1.default.util.toObject(config_1.default);
const main = async (token) => {
    try {
        // 対象のサーバーに所属している自分の情報を取得
        const data = await discordApi(`/users/@me/guilds/${config.guildId}/member`, token);
        // console.log(data);
        // 許可対象のロールが振られてるかチェック
        let isAllowed = false;
        for (const role of data.roles) {
            if (config.allowRoles.includes(role)) {
                isAllowed = true;
            }
        }
        if (isAllowed) {
            return { status: 'ok', message: `${data.user.username}` };
        }
        else {
            console.warn('未許可ユーザー ' + data.user.id + ' ' + data.user.username);
            return { status: 'ng', message: '許可されていません' };
        }
    }
    catch (error) {
        console.error('何かエラーがあった');
        console.error(error);
        return { status: 'ng', message: 'だめです' };
    }
};
const BASE_URL = 'https://discordapp.com/api';
const discordApi = async (api, token) => {
    try {
        const url = `${BASE_URL}${api}`;
        console.log(url);
        const result = await axios_1.default.get(url, {
            headers: {
                Authorization: `${token}`,
            },
        });
        if (result.status >= 400)
            throw new Error('status code error' + result.status);
        return result.data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
};
exports.default = main;
