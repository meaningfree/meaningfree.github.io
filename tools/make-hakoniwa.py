"""hakoniwa.html（Artifact 用の断片）から、公開用のスタンドアロンな
index.html を作る。

    python3 tools/make-hakoniwa.py hakoniwa/index.html
"""
import os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
body = open(os.path.join(HERE, "src", "hakoniwa.html"), encoding="utf-8").read()
HEAD = '''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0f2e">
<meta name="description" content="ドット絵でつくる、スマホで遊べるまちづくりシミュレーション。">
'''
# Artifact の外枠が足していた、ノッチ・ホームバー分の余白と box-sizing
EXTRA = '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box}*,*::before,*::after{box-sizing:inherit}</style>'
i = body.index("</style>") + len("</style>")
out = HEAD + body[:i] + "\n" + EXTRA + "\n</head>\n<body>" + body[i:] + "\n</body>\n</html>\n"
assert out.count("</head>") == 1 and out.count("<body>") == 1 and out.count("<title>") == 1
open(sys.argv[1], "w", encoding="utf-8").write(out)
