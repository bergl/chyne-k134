#!/bin/bash
# rebuild test.html (+ instrumentation, debug hooks, deterministic-animation switch) from the source; also test_dbg.html
cd "$(dirname "$0")"
bash build.sh && python3 instrument.py && python3 - <<'PY'
import re
s=open('test.html').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n, (s.count(a), a[:80])
    s=s.replace(a,b)
rep("window.__d={persp,controls,renderer,scene,dog,cat,state:()=>state,",
    "window.__updateWalk=updateWalk;window.__openProps=openProps;window.__rebuild=rebuildObject;window.__mig=migrateDesign;window.__DEF=()=>DEFAULT_STATE();window.__navF=navFurniture;"
    "window.__settle=()=>{ lastInteract=-1e9; lastRelease=-1e9; aoFade=1; if (aoPass){ aoPass.enabled=true; aoPass.blendIntensity=.9; } if (bloomPass) bloomPass.enabled=true; if (typeof setRenderScale==='function') setRenderScale(1); postReady=true; if (smaaPass) smaaPass.enabled=true; shadowDirty=true; reflDirty=true; lastRefl=-1e9; envDirty=true; lastEnv=-1e9; if (typeof stepReflections==='function' && Q().reflect){ reflFace = -1; for (let i=0;i<6;i++) stepReflections(); } };"
    "window.__pick=(x,y)=>{ setNDC({clientX:x, clientY:y}); return pickObject(); };window.__nbStats=()=>({...nb.stats});window.__postReady=()=>(typeof postReady==='undefined' ? true : postReady);window.__q=()=>qName;"
    "window.__d={updNb:updateNeighbours,batches:(typeof batches!=='undefined'?batches:null),shadowSplit:(typeof shadowSplit!=='undefined'?shadowSplit:null),ladies,walk,NAV,setView,clouds,sun,hemi,nb,camera:()=>camera,ortho,ocontrols,ui,meshById,objectsGroup,house:(typeof house!=='undefined'?house:null),persp,controls,renderer,scene,dog,cat,state:()=>state,")
# deterministic clocks for screenshots: window.__freezeT freezes wind, water, clouds and the lady
rep("if (!photo){ windU.uTime.value = now/1000; waterNormal.offset.set(now*1.2e-5, now*0.8e-5); }",
    "if (!photo){ const __n = window.__freezeT ?? now; windU.uTime.value = __n/1000; waterNormal.offset.set(__n*1.2e-5, __n*0.8e-5); }")
rep("updateLadies(now);", "updateLadies(window.__freezeT ?? now);")
rep("c.position.x += c.userData.speed*dt;", "c.position.x += (window.__freezeT ? 0 : c.userData.speed*dt);")
rep("occl = !ortho && dir.y > -.6 && cp.y < 45 && cp.y > .4;", "occl = !ortho && dir.y > -.6 && cp.y < 45 && cp.y > .4 && !window.__nbNoOcc;")
open('test_prod.html','w').write(s)                                   # as shipped: shader error checks off
rep("renderer.debug.checkShaderErrors = /[?&#]debug\\b/.test(location.href);", "renderer.debug.checkShaderErrors = true;")
open('test.html','w').write(s)
d = s.replace('"three":"/node_modules/three/build/three.module.min.js"','"three":"/three.dbg.js"'); assert d != s
open('test_dbg.html','w').write(d.replace('<link rel="modulepreload" href="/node_modules/three/build/three.module.min.js">\n',''))
PY
