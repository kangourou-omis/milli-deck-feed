# milli-deck-feed

Stream Deck用の非公式プラグイン「Milli Deck」が読む、ミリプロの配信情報のまとめ。

- 公開先: https://kangourou-omis.github.io/milli-deck-feed/feed.json
- 作り方: `build.mjs` が非公式ファンサイト Milli Scene のデータベース(公開の読み取り専用の値)から読んで作る
- 更新: Milli Scene が配信の状況の変化を見つけると `repository_dispatch`(update) で `publish` を動かす。保険として1時間に1回も動く。中身が変わっていなければPagesは載せ直さない
- 読む間隔: リポジトリ変数 `POLL_SEC`(既定180秒)。利用者が増えたらここを延ばすと、プラグインを配り直さずに間隔が延びる

ミリオンプロダクション公式とは関係ありません。

## 設定(リポジトリの Settings → Secrets and variables → Actions → Variables)
| 名前 | 内容 |
|---|---|
| `SUPABASE_URL` | Milli Scene の Supabase のURL |
| `SUPABASE_ANON_KEY` | 同 読み取り用の公開キー(anon) |
| `POLL_SEC` | 任意。既定180 |
