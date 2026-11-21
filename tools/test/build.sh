python3 - <<'PY'
s=open('../../src/index.html').read()
s=s.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/','/node_modules/three/')
s=s.replace('https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.6/','/node_modules/three-mesh-bvh/')
s=s.replace('https://cdn.jsdelivr.net/npm/three-gpu-pathtracer@0.0.23/','/node_modules/three-gpu-pathtracer/')
s=s.replace('<link rel="preconnect" href="https://fonts.googleapis.com">','').replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">','')
open('test.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+s+'</body></html>')
PY
