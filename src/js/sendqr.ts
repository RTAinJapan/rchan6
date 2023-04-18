import Discord from 'discord.js';
import fs from 'fs-extra';
import configModule from 'config';
const config: Config = configModule.util.toObject(configModule);
const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

const main = async (list: { message: string; discordId: string; code: string; filepath: string }[]) => {
  let status: 'ok' | 'ng' = 'ok';
  const result: string[] = [];
  try {
    //  Discordのトークン取得
    const token = config.discordToken ? config.discordToken : process.env.NODE_ENV_DISCORD_TOKEN;
    if (!token) throw new Error('Discord認証トークンが指定されていません。');

    // Discordログイン
    /** DiscordのClientオブジェクト */
    const client = new Discord.Client({
      intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers],
    });
    await client.login(token);
    if (!client.user) throw new Error('ログインに失敗しました。');

    // 何か裏でいろいろしてるので準備完了を待つ
    await (async () => {
      return new Promise<void>((resolve, reject) => {
        client.once('ready', () => {
          console.log('Ready!');
          resolve();
        });
      });
    })();

    // 操作対象のサーバ取得
    const guild = await client.guilds.fetch(config.guildId);
    if (!guild) throw new Error('操作対象のサーバ情報を取得できません。');
    console.log(`サーバ名: ${guild.name}`);

    // オフライン勢も含めてサーバの全メンバーを取得する
    await guild.members.fetch();
    const guildFullMembers = guild.members.cache;

    // 付与対象に絞り込み
    const targetMember = guildFullMembers.filter((member) => {
      return list.map((item) => item.discordId).includes(member.id);
    });

    // 操作対象として指定されているのにサーバにいない人をチェック
    for (const member of list.map((item) => item.discordId)) {
      if (!targetMember.get(member)) {
        const msg = `サーバにいない： ${member}`;
        console.warn(msg);
        result.push(msg);
        status = 'ng';
      }
    }

    // リストに合致したメンバーにDM送信
    for (const memberTmp of targetMember) {
      const member = memberTmp[1];
      console.log(`"${member.id}", "${member.user.tag}"`);
      const userData = list.find((item) => item.discordId === member.id);
      if (!userData) {
        console.warn('データ不整合');
        result.push(`${member.user.tag}がサーバに見つからなかった`);
        continue;
      }

      const qrfilename = `data/qr/${userData.code}.png`;
      if (!fs.existsSync(qrfilename)) {
        console.warn('QRコードの画像ファイルが無い');
        result.push(`${member.user.tag}のQR画像が生成できなかった`);
        continue;
      }

      const message = userData.message;

      const dmchannel = await member.createDM();
      const sendObj = {
        content: message,
        files: [qrfilename],
      };

      try {
        const result2 = await dmchannel.send(sendObj);
        console.log(JSON.stringify(result2));
        result.push(`${member.user.tag}への送信成功`);
      } catch (e) {
        const msg = `${member.user.tag}への送信失敗. ` + (e as any).message;
        console.error(msg);
        result.push(msg);
        status = 'ng';
      }
      // rate limit?
      await sleep(200);
    }

    // ログアウト
    client.destroy();
  } catch (error) {
    console.error('何かエラーがあった');
    console.error(error);
    result.push(`致命的なエラーが発生` + JSON.stringify(error));
    status = 'ng';
  }
  return { status: status, data: result };
};

export default main;
