# 無料フレンド対戦の導入手順

対象: 漢字 de クラッシュキーボード v0.4.0 以降  
構成: GitHub Pages + Cloudflare Workers + Durable Objects  
想定人数: 2〜8人、ルームコード制、アカウント不要

## 0. この構成でできること

- 6文字のルームコードを発行
- 2〜8人が同じルームへ参加
- 全員が準備完了後、ホストが開始
- 同一シード・同一辞書バージョンで同じ問題列を生成
- 30秒モード／10語モード
- 相手のスコア、進行、HP、キー破損状態を小窓表示
- 通信が少し遅れても、本人の入力とタイマーは停止しない
- 全員終了後、サーバーが順位を配信
- ホスト操作で同じメンバーの再戦

対戦相手を直接妨害する機能、自由チャット、公開マッチングは含みません。

## 1. なぜCloudflareを使うか

ゲーム本体はGitHub Pagesに置いたまま、ルーム管理だけをCloudflareへ分離します。

```text
GitHub Pages
  ├─ HTML / CSS / JavaScript
  ├─ 漢字辞書
  └─ 各プレイヤーのゲーム進行

Cloudflare Worker
  ├─ ルーム作成・参加API
  └─ WebSocketの入口

Durable Object（ルームごとに1個）
  ├─ 参加者
  ├─ 共通シード・開始時刻
  ├─ 進行状況
  └─ 最終順位
```

Durable Objectsは、同じルームに属する複数のWebSocketを一か所で管理できます。本実装はWebSocket Hibernation APIを使うため、通信のない時間はオブジェクトを休止できます。

## 2. 先に理解しておく制限

### カジュアル対戦版である

v0.4.0では、サーバーはスコアや正解数が後戻りしないこと、値が異常に大きくないことなどを確認します。しかし、キー入力を一打ずつ再計算してはいません。

したがって、フレンド同士の対戦には使えますが、賞金大会、公式世界ランキング、不特定多数との競技にはまだ不十分です。

公開マッチングを作る段階では、入力イベントログをサーバーで再生し、正答・摩耗・スコアを再計算してください。

### 無料枠は無制限ではない

無料枠でも小規模なフレンド対戦は始められますが、利用量が増えたらCloudflareダッシュボードで必ず確認してください。料金・無料枠は将来変更される可能性があります。

### GitHub PagesだけではWebSocketルームを作れない

GitHub Pagesは静的ファイル配信です。オンライン対戦には、今回追加したCloudflare側のコードを別途デプロイする必要があります。

## 3. 必要なもの

- Cloudflareアカウント
- GitHubアカウント
- Node.js 20以上を推奨
- npm
- ターミナル
- 現在のゲームリポジトリ

Node.jsの確認:

```bash
node -v
npm -v
```

バージョンが表示されなければ、Node.js公式サイトからLTS版をインストールしてください。

## 4. ファイル構成

今回の差し替え後、主な追加ファイルは次のとおりです。

```text
online.js
online-config.js
docs/
  ONLINE_MULTIPLAYER_SETUP.md
cloudflare-worker/
  package.json
  tsconfig.json
  wrangler.jsonc
  worker-configuration.d.ts
  src/
    index.ts
  test/
    smoke.mjs
```

## 5. Cloudflareへログイン

ターミナルでリポジトリ直下へ移動し、対戦サーバーのフォルダを開きます。

```bash
cd kanji-de-crash-keyboard/cloudflare-worker
```

依存パッケージをインストールします。

```bash
npm install
```

Cloudflareへログインします。

```bash
npx wrangler login
```

ブラウザが開いたら、使用するCloudflareアカウントを選び、権限を許可します。

ログイン確認:

```bash
npx wrangler whoami
```

アカウント名が表示されれば成功です。

## 6. 許可するサイトを設定

`cloudflare-worker/wrangler.jsonc` を開きます。

初期値にはローカル開発用URLと、このリポジトリのGitHub Pagesのオリジンを入れています。

```jsonc
"vars": {
  "ALLOWED_ORIGINS": "http://localhost:8000,http://127.0.0.1:8000,https://yuzora-yu.github.io",
  "ROOM_TTL_MINUTES": "180"
}
```

独自ドメインを使う場合は、カンマ区切りで追加します。

```jsonc
"ALLOWED_ORIGINS": "http://localhost:8000,https://yuzora-yu.github.io,https://game.example.jp"
```

### 重要

- URL末尾の `/` は付けません。
- GitHub Pagesが `https://yuzora-yu.github.io/kanji-de-crash-keyboard/` でも、Originは `https://yuzora-yu.github.io` です。
- `*` にするとどのサイトからもルームAPIを呼べるため、公開時は推奨しません。

`ROOM_TTL_MINUTES` は、操作が続いているルームの有効期限です。初期値は180分です。

## 7. 型チェック

Cloudflare用の型を更新します。

```bash
npm run types
```

TypeScriptを確認します。

```bash
npm run check
```

エラーが出なければ次へ進みます。

## 8. ローカルで対戦サーバーを起動

```bash
npm run dev
```

通常は次のようなローカルURLが表示されます。

```text
http://localhost:8787
```

別のターミナルで接続確認します。

```bash
curl http://localhost:8787/health
```

次のようなJSONが返れば成功です。

```json
{"ok":true,"service":"kanji-crash-match-server","serverTime":1234567890000}
```

### 自動スモークテスト

対戦サーバーを起動したまま、別ターミナルで実行します。

```bash
npm run smoke
```

このテストは次を自動確認します。

1. ルーム作成
2. 2人目の参加
3. 2本のWebSocket接続
4. 両者の準備完了
5. ホストによる開始
6. 進行状況の送信
7. 両者の終了
8. 順位配信

## 9. ローカルのゲーム画面と接続

リポジトリ直下の `online-config.js` を一時的に編集します。

```javascript
window.KCK_ONLINE_CONFIG = Object.freeze({
  serverUrl: "http://localhost:8787",
  dictionaryVersion: "words-2026-07-27-v034",
  gameVersion: "0.4.0"
});
```

次に、リポジトリ直下で静的サーバーを起動します。

```bash
python -m http.server 8000
```

または:

```bash
python3 -m http.server 8000
```

ブラウザで開きます。

```text
http://localhost:8000
```

確認手順:

1. 1つ目のブラウザで「対戦」→「フレンド対戦」
2. 表示名、モード、難易度、最大人数を設定
3. 「ルーム作成」
4. 別ブラウザ、シークレットウィンドウ、または別端末を開く
5. ルームコードを入力して参加
6. 2人とも「準備完了」
7. ホストが「対戦開始」
8. 両画面で同じカウントダウンと同じ最初の3語が出ることを確認
9. 終了後、同じ順位が表示されることを確認

同じブラウザの通常タブ同士は `sessionStorage` が複製される場合があります。確実に別プレイヤーとして試すには、通常ウィンドウとシークレットウィンドウを使ってください。

## 10. Cloudflareへ本番デプロイ

ローカル確認後、`cloudflare-worker` フォルダで実行します。

```bash
npm run deploy
```

初回デプロイでは、WorkerとSQLite-backed Durable Objectクラスが作成されます。

成功すると、次のようなURLが表示されます。

```text
https://kanji-crash-match-server.<あなたのサブドメイン>.workers.dev
```

このURLを控えてください。

接続確認:

```bash
curl https://kanji-crash-match-server.<あなたのサブドメイン>.workers.dev/health
```

## 11. ゲーム本体へ本番URLを設定

リポジトリ直下の `online-config.js` を編集します。

```javascript
window.KCK_ONLINE_CONFIG = Object.freeze({
  serverUrl: "https://kanji-crash-match-server.<あなたのサブドメイン>.workers.dev",
  dictionaryVersion: "words-2026-07-27-v034",
  gameVersion: "0.4.0"
});
```

`serverUrl` の末尾に `/` は付けないでください。

## 12. GitHubへアップロード

今回の差し替えZIPの中身を、リポジトリ直下へ上書きします。

主な変更対象:

```text
index.html
game.js
styles.css
online.js
online-config.js
README.md
CHANGELOG.md
docs/
cloudflare-worker/
```

Gitで行う場合:

```bash
git add .
git commit -m "Add free friend matchmaking with Cloudflare Durable Objects"
git push origin main
```

GitHub Pagesの反映後、公開URLからフレンド対戦を試します。

## 13. 本番確認チェックリスト

### ルーム

- [ ] ルームコードが6文字で発行される
- [ ] 招待URLからコードが自動入力される
- [ ] 2〜8人が参加できる
- [ ] 同じ名前で参加すると末尾に番号が付く
- [ ] ホストだけが開始できる
- [ ] 全員準備完了になるまで開始できない

### 同期

- [ ] 同じ問題番号で同じ3語が出る
- [ ] 30秒モードがほぼ同時に開始・終了する
- [ ] 10語モードは各自の速度で進む
- [ ] 相手のスコアとミニキーボードが更新される
- [ ] 一時的な通信遅延で本人の入力が止まらない

### 終了

- [ ] 全員終了後に順位が表示される
- [ ] スコア、正解数、破損回数、タイムが表示される
- [ ] ホストが再戦準備へ戻せる
- [ ] 退出後、不要な再接続が起きない

### スマートフォン・配信

- [ ] 対戦小窓がゲーム画面を押しつぶさない
- [ ] 1366×768で縦スクロールが発生しない
- [ ] 8人表示でも名前と順位が識別できる
- [ ] OBSでゲーム画面だけを取り込んでも状況が分かる

## 14. 無料枠を守る運用

本実装は通信量を抑えるため、相手の画面そのものや入力文字列を送りません。

- 進行状況: 約600ミリ秒ごと
- サーバー側の過剰更新防止: 180ミリ秒未満の進行送信を無視
- 送信内容: 数値、状態、26キーの段階
- ルーム保存: 約1.5秒に1回以下へ抑制
- WebSocket Hibernation: 通信のない時間は休止可能
- ルーム: 最終操作から初期値180分で削除

最初はフレンド対戦だけで公開し、Cloudflare Dashboardの以下を定期確認してください。

- Workers & Pages → 対象Worker → Metrics
- Durable Objects → Requests
- Durable Objects → Duration
- Errors

利用者が急増した場合は、進行送信間隔を800〜1000ミリ秒へ伸ばしてもゲーム性への影響は小さいです。

## 15. よくあるエラー

### 「対戦サーバーURLが未設定」

`online-config.js` の `serverUrl` が空です。WorkerのURLを設定してください。

### 「このOriginからの接続は許可されていません」

`wrangler.jsonc` の `ALLOWED_ORIGINS` に、ゲームを公開しているサイトのOriginがありません。追加後、再デプロイしてください。

```bash
npm run deploy
```

### `/health` は動くがWebSocketに接続できない

- Worker URLの `https` を `online-config.js` に設定しているか
- ブラウザ開発者ツールのNetwork → WSを確認
- GitHub PagesのOriginが許可されているか
- Workerを独自プロキシの後ろへ置いている場合、WebSocketが許可されているか

### 全員準備完了なのに開始できない

切断状態の参加者は開始対象に含めません。ロビー一覧で `OFFLINE` が付いていないか確認してください。

### 問題が一致しない

次を確認してください。

- 全端末のGitHub Pagesが最新版か
- `dictionaryVersion` が全員で同じか
- ブラウザキャッシュに古い `data/words.js` が残っていないか
- `gameVersion` が一致しているか

辞書更新時は `online-config.js` の `dictionaryVersion` も変更してください。

### 対戦中にページを再読み込みした

v0.4.0では、開始から5秒を超えた対戦への完全復帰は未対応です。通信切断からのWebSocket再接続には対応しますが、ページ再読み込み後の途中復帰は今後の課題です。

## 16. セキュリティと不正対策

### 今回実装済み

- ルームコードから直接ゲーム状態を書き換えられない
- プレイヤーごとのランダムトークン
- WebSocket接続時のID・トークン確認
- 接続元Origin制限
- 表示名の制御文字除去・16文字制限
- ルーム人数2〜8人
- メッセージサイズ制限
- 進行更新頻度制限
- 数値範囲の制限
- スコア、正解数、ミス数、破損回数の巻き戻し禁止
- ルーム自動削除
- 自由チャットなし

### 今後必要

公開マッチングや公式ランキングでは、次を追加します。

- 入力イベントログの連番
- サーバーによる正答再計算
- サーバーによるキー摩耗・復活再計算
- スコア完全再計算
- 異常な入力間隔の検知
- 参加時の辞書・ルールバージョン一致確認
- 辞書・ルールバージョン固定
- 切断復帰時のチェックポイント
- IP・ルーム作成レート制限
- 通報・ブロック

## 17. 更新時の注意

ゲームルールや辞書を変更した場合は、`online-config.js` のバージョンを更新します。

```javascript
window.KCK_ONLINE_CONFIG = Object.freeze({
  serverUrl: "https://...workers.dev",
  dictionaryVersion: "words-2026-08-01-v035",
  gameVersion: "0.4.1"
});
```

ルール互換性のない変更では `gameVersion` を上げます。語句だけを変更した場合も `dictionaryVersion` を上げます。

将来的には、サーバー側で参加者全員のバージョン一致を確認し、不一致端末を対戦開始前に弾く処理を追加してください。

## 18. 次の推奨アップデート

優先順は次のとおりです。

1. 実端末2〜8台での負荷・UIテスト
2. ページ再読み込み後の途中復帰
3. ルーム作成の簡易レート制限
4. 操作ログ保存と終了時検証
5. 対戦結果画像のSNS共有
6. 観戦専用URL
7. 公開クイックマッチ

公開マッチングへ進む前に、フレンドコード戦で「相手小窓を見る余裕があるか」「8人表示が配信で読めるか」「待つ戦術が対戦でも成立するか」を優先して検証してください。
