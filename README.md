# Rちゃん6号

DiscordでDMを送る。要Node.js

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

```shell
npm install
```

## 下準備 3 設定ファイル作る

- 環境変数に以下を設定

```
DISCORD_CLIENT_ID=Discord ApplicationのOAuth2のClient ID
DISCORD_SCOPE=guilds.members.read%20guilds%20identify
DISCORD_ALLOW_ROLES=操作を許可するロールのID。複数ある場合はカンマ区切り
DISCORD_GUILD_ID=操作対象のサーバID
DISCORD_TOKEN=Discord botの認証トークン
PORT=待ち受けポート番号
```

## ビルド

- ソースのビルド

```shell
npm run build
```

## サーバー側実行

- 起動したらあとはブラウザからアクセスする

```shell
npm run start
```

### docker composeで起動

```shell
docker compose up
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
