# meaningfree.github.io

つくったものの置き場。<https://meaningfree.github.io/>

## 中身

| パス | 公開 URL |
|---|---|
| `index.html` | <https://meaningfree.github.io/> |
| `wordle/index.html` | <https://meaningfree.github.io/wordle/> |
| `matchstick/index.html` | <https://meaningfree.github.io/matchstick/> |
| `sukima/index.html` | <https://meaningfree.github.io/sukima/> |

## むげんワードル

5もじのことばを6かいで当てるゲーム。かなモードと英語モードがあり、
何回でも遊べます。進行状況と成績は端末のローカルに保存されます。

かなモードの出題は清音のみの5もじの名詞133語。濁点・半濁点・小さい文字を
使わないので、キーボードの1キーが1文字にそのまま対応します。

### ファイル

- `src/wordle.html` — 生成元。claude.ai の Artifact に貼る断片形式（`<head>`/`<body>` なし）
- `wordle/index.html` — 公開用。`src/wordle.html` から生成したスタンドアロン版
- `tools/make-standalone.py` — 変換スクリプト

`src/wordle.html` を編集したら、公開版を作り直す:

```sh
python3 tools/make-standalone.py wordle/index.html
```

## マッチぼうパズル

マッチ棒を決められた本数だけ「うごかす・たす・とる」して式を正しくする、子ども向けのパズル。

- 全28問・4ステージ。どの問題も答えは1つだけ（ソルバーで確認済み）
- ＋ − ＝ のマッチ棒も動かせる（例: 5−7＝2 → 5＝7−2）
- 何もない場所に数字を作る問題もある（例: 4＋9＝0 → 1＋9＝10）
- 問題の種類は色とアイコンで区別（うごかす＝青、たす＝緑、とる＝オレンジ）
- 問題の順番はステージ内でシャッフル

### ファイル

- `src/matchstick.html` — 生成元（Artifact 用の断片形式）
- `matchstick/index.html` — 公開用のスタンドアロン版
- `tools/make-matchstick.py` — 変換スクリプト

`src/matchstick.html` を編集したら、公開版を作り直す:

```sh
python3 tools/make-matchstick.py matchstick/index.html
```

## すきまブロック

木の壁に入った1列のすきま（ときどき横にずれる）に、落ちてくるピースをはめるパズル。
縦穴に I ピースを落とすと3〜4段まとめて消え、次の穴が出てくる。

- 1レベルは数枚の壁（Level 3-1, 3-2 …）。最後の壁まで消すとクリア
- 壁は毎回自動生成。縦穴は I ピース、横ずれの所は L/J や横向き I で埋まる形にしてあり、
  NEXT の順にはめれば必ず消える（ライン消去込みで自動検証済み）
- レベルが上がると壁の数が増え、落下が速くなる
- 「ヒント」で今のピースをはめる場所が光る
- 操作: キーボード（← → 移動、スペース 回転、↓ 速く落とす、Z 逆回転、H ヒント）/
  スマホは盤面タップで回転・左右になぞって移動、ボタン

### ファイル

- `src/sukima.html` — 生成元（Artifact 用の断片形式）
- `sukima/index.html` — 公開用のスタンドアロン版
- `tools/make-sukima.py` — 変換スクリプト

`src/sukima.html` を編集したら、公開版を作り直す:

```sh
python3 tools/make-sukima.py sukima/index.html
```

## GitHub Pages

ユーザーサイトなので、main ブランチのルートがそのまま
`https://meaningfree.github.io/` として配信される。
`.nojekyll` を置いて Jekyll の処理は無効にしてある。
