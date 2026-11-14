"""sudoku.html（Artifact 用の断片）から、公開用のスタンドアロンな
index.html を作る。

    python3 tools/make-sudoku.py sudoku/index.html
"""
import os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
body = open(os.path.join(HERE, "src", "sudoku.html"), encoding="utf-8").read()
HEAD = '''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="むげん数独。何問でも遊べるランダム生成の数独パズル。かんたん・ふつう・むずかしい。">
'''
i = body.index("</style>") + len("</style>")
out = HEAD + body[:i] + "\n</head>\n<body>" + body[i:] + "\n</body>\n</html>\n"
assert out.count("</head>") == 1 and out.count("<body>") == 1 and out.count("<title>") == 1
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(len(out), "bytes ->", sys.argv[1])
