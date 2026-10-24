# meaningfree.github.io

つくったものの置き場。<https://meaningfree.github.io/>

## 中身

| パス | 公開 URL |
|---|---|
| `index.html` | <https://meaningfree.github.io/> |
| `wordle/index.html` | <https://meaningfree.github.io/wordle/> |

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

## GitHub Pages

ユーザーサイトなので、main ブランチのルートがそのまま
`https://meaningfree.github.io/` として配信される。
`.nojekyll` を置いて Jekyll の処理は無効にしてある。
