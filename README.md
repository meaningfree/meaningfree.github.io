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

木のブロックで埋まった盤面のすきまに、落ちてくるテトリス型のピースをはめるパズル。
横一列がそろうと消え、もとからあった段をぜんぶ消すとクリア。

- 盤面は毎回自動生成。木で埋めた盤面から、出現位置から届く形でピースを1つずつくり抜いて作る。
  NEXT の順にはめれば必ず埋まる（ライン消去込みで自動検証済み）
- レベルが上がるとピース数が増え、落下が速くなる
- 「ヒント」で今のピースをはめる場所が光る
- 操作: ボタン / 盤面タップで回転・ドラッグで移動・下にはじくと落下 / キーボード（← → ↓、↑/X 回転、Z 逆回転、Space 落下、H ヒント）

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
