# Rちゃん6号

Discord DMで何かのコードを送るよ
要Node.js

## 下準備 1

- Discordアプリケーションを作成
  - https://discord.com/developers/applications
- OAuth2タブを開いて以下を実施
  - Redirectsを設定
    - デプロイ先にあわせる
    - 例： `http://localhost/login/discord/index.html`
    - 例： `http://example.com/login/discord/index.html`
  - CLIENT IDをメモする
- Botタブを開いて以下を実施
  - Build-A-Botで「Add Bot」をクリックしてBot作成
  - TOKENを生成してメモする
  - `SERVER MEMBERS INTENT` をオンにする
- Discord botをサーバに登録
  - OAuth2 -> URL Generatorで以下をチェック
    - bot
    - Manage Roles
  - 生成されたURLでアクセスし、操作対象のサーバに招待する  

## 下準備 2 パッケージインストール
- yarn入れてない人は`npm install`

```shell
yarn
```

## 下準備 3 設定ファイル作る

`config/default.json`に以下を適宜設定

```json
{
  "clientId": "Discord ApplicationのOAuth2のClient ID",
  "scope": "guilds.members.read%20guilds%20identify",
  "allowRoles": ["操作を許可するロールのID"],
  "guildId": "操作対象のサーバID",
  "discordToken": "Discord botの認証トークン。Configに無ければ環境変数 NODE_ENV_DISCORD_TOKEN を使用する",
  "port": 待ち受けポート番号
}
```

## サーバー側実行
- 起動したらあとはブラウザからアクセスする
```
yarn start
```

### docker composeで起動

必要なのは以下だけ。待ち受けポートは各環境に応じて修正。

```
config/default.json
docker-compose.yml
```

## クライアントの使い方
### データの用意
- 以下の形式のCSVファイルを用意する。UTF-8形式。

```csv
名前,Discord,DiscordID,選考,code
Rちゃん,rchan,1234567890123,VALIDATED,901234567890123456
スライムちゃんslimechan,2234567890123,VALIDATED,909934567890123456
```

- 本文を用意する。codeが入る部分は `{code}` とする。

```
コードを送付するよ

添付画像が表示できない場合は以下のURLにアクセスしてね
https://rtain.jp/code/?data={code}
```

### クライアント操作
1. ブラウザから、`docker-compose.yml` に定義したportにアクセスする。
2. Discord認証でログインする
3. 「送信先のCSVファイル」からCSVファイルを選択
4. 本文を入力
5. 「DMメッセージのサンプルを確認」をクリック
6. 問題なければ、「DM送信実行」をクリック

## ビルド
- ソースのビルド

```
yarn build
```

- Docker用のビルド
  - 事前にpackage.jsonのユーザ名をいい感じにしておくこと

```
yarn docker:build
yarn docker:push
```
