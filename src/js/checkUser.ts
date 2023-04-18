import axios from 'axios';
import configModule from 'config';
const config: Config = configModule.util.toObject(configModule);

const main = async (token: string): Promise<{ status: 'ok' | 'ng'; message: string }> => {
  try {
    // 対象のサーバーに所属している自分の情報を取得
    const data: any = await discordApi(`/users/@me/guilds/${config.guildId}/member`, token);
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
    } else {
      console.warn('未許可ユーザー ' + data.user.id + ' ' + data.user.username);
      return { status: 'ng', message: '許可されていません' };
    }
  } catch (error) {
    console.error('何かエラーがあった');
    console.error(error);
    return { status: 'ng', message: 'だめです' };
  }
};

const BASE_URL = 'https://discordapp.com/api';
const discordApi = async (api: string, token: string) => {
  try {
    const url = `${BASE_URL}${api}`;
    console.log(url);

    const result = await axios.get(url, {
      headers: {
        Authorization: `${token}`,
      },
    });
    if (result.status >= 400) throw new Error('status code error' + result.status);
    return result.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default main;
