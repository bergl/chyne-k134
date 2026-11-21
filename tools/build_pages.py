#!/usr/bin/env python3
"""Build the GitHub Pages page (index.html in the repository root) from src/index.html.

src/index.html is the app exactly as it is published as a claude.ai artifact: a page fragment that starts at <title>
and has no <html>/<head>/<body> of its own. This script wraps it into a complete, installable web page
(viewport, description, theme colours, web-app manifest and icons).

usage: python3 tools/build_pages.py [output directory, default: the repository root]
"""
import os, sys
root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else root)
src = open(os.path.join(root, 'src', 'index.html'), encoding='utf-8').read()
cut = src.index('</style>') + len('</style>')            # everything up to the end of the style sheet belongs in <head>
head_part, body_part = src[:cut], src[cut:]
HEAD = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Interactive 3D model of house K-134 in Chýně and its garden, for planning a sauna, pool and planting.">
<meta name="theme-color" content="#eef1ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141816" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="K-134 Garden">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
'''
page = '<!doctype html>\n<html lang="en">\n<head>\n' + HEAD + head_part.strip() + '\n</head>\n<body>\n' + body_part.strip() + '\n</body>\n</html>\n'
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page)
print('wrote', os.path.join(out, 'index.html'), len(page.encode('utf-8')), 'bytes')
