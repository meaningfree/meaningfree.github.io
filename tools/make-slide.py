"""slide.html（Artifact 用の断片）から、公開用のスタンドアロンな
index.html を作る。

    python3 tools/make-slide.py slide/index.html
"""
import os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
body = open(os.path.join(HERE, "src", "slide.html"), encoding="utf-8").read()
HEAD = '''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="数字タイルをすべらせてそろえるスライドパズル。3×3・4×4・5×5。">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#E8F2F0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1C1A" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="スライドパズル">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2064%2064%27%3E%3Crect%20width=%2764%27%20height=%2764%27%20rx=%2714%27%20fill=%27%230F3D38%27/%3E%3Crect%20x=%278%27%20y=%278%27%20width=%2720%27%20height=%2720%27%20rx=%274%27%20fill=%27%232FA89B%27/%3E%3Crect%20x=%2736%27%20y=%278%27%20width=%2720%27%20height=%2720%27%20rx=%274%27%20fill=%27%232FA89B%27/%3E%3Crect%20x=%278%27%20y=%2736%27%20width=%2720%27%20height=%2720%27%20rx=%274%27%20fill=%27%232FA89B%27/%3E%3Crect%20x=%2736%27%20y=%2736%27%20width=%2720%27%20height=%2720%27%20rx=%274%27%20fill=%27%23C5DDD8%27%20opacity=%27.5%27/%3E%3C/svg%3E">
'''
i = body.index("</style>") + len("</style>")
out = HEAD + body[:i] + "\n</head>\n<body>" + body[i:] + "\n</body>\n</html>\n"
assert out.count("</head>") == 1 and out.count("<body>") == 1 and out.count("<title>") == 1
os.makedirs(os.path.dirname(os.path.abspath(sys.argv[1])) or ".", exist_ok=True)
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(len(out), "bytes ->", sys.argv[1])
