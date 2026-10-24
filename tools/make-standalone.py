"""wordle.html（Artifact 用の断片）から、どこにでも置けるスタンドアロンな
index.html を作る。

    python3 tools/make-standalone.py out/index.html
"""
import os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
body = open(os.path.join(HERE, "wordle.html"), encoding="utf-8").read()
HEAD = '''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="無限に遊べる日本語と英語のワードル。">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EDEFF4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101218" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="むげんワードル">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2064%2064%27%3E%3Crect%20width=%2764%27%20height=%2764%27%20rx=%2714%27%20fill=%27%232C4B8C%27/%3E%3Crect%20x=%278%27%20y=%2726%27%20width=%2712%27%20height=%2712%27%20rx=%272%27%20fill=%27%23fff%27/%3E%3Crect%20x=%2726%27%20y=%2726%27%20width=%2712%27%20height=%2712%27%20rx=%272%27%20fill=%27%23E0A52F%27/%3E%3Crect%20x=%2744%27%20y=%2726%27%20width=%2712%27%20height=%2712%27%20rx=%272%27%20fill=%27%23fff%27%20opacity=%27.45%27/%3E%3C/svg%3E">
'''
i = body.index("</style>") + len("</style>")
out = HEAD + body[:i] + "\n</head>\n<body>" + body[i:] + "\n</body>\n</html>\n"
assert out.count("</head>") == 1 and out.count("<body>") == 1 and out.count("<title>") == 1
assert "__JP__" not in out
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(len(out), "bytes ->", sys.argv[1])
