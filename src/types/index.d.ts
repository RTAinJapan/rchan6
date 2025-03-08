type Config = {
  clientId: string;
  scope: string;
  allowRoles: string[];

  /**
   * 操作対象のサーバID
   * @description サーバ名のところ右クリックしたらメニューが出てきて取得できる
   */
  guildId: string;
  /**
   * DiscordのAPIトークン
   */
  discordToken: string;
  /**
   * 待ち受けポート
   */
  port: number;
};
type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer P> ? P : never;
