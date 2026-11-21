import sys
p='test.html'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:80]; s=s.replace(a,b)
rep("  if (!photo){ updateDog(dt, now); updateCat(dt, now); updateSwimmer(dt, now); updateLadies(now); }",
    "  { const T=window.__T; let t0=performance.now(); if (!photo){ updateDog(dt, now); T.dog+=performance.now()-t0; t0=performance.now(); updateCat(dt, now); T.cat+=performance.now()-t0; t0=performance.now(); updateSwimmer(dt, now); updateLadies(now); T.misc+=performance.now()-t0; } }")
rep("  renderFrame();\n  if (photo && now-photoStatusT","  { const T=window.__T; renderer.info.autoReset=false; renderer.info.reset(); const t0=performance.now(); renderFrame(); T.render+=performance.now()-t0; T.calls=renderer.info.render.calls; T.tris=renderer.info.render.triangles; T.callsSum=(T.callsSum||0)+T.calls; T.trisSum=(T.trisSum||0)+T.tris; T.frames++; }\n  if (photo && now-photoStatusT")
rep("  updateLabels(); updateCompass();\n  requestAnimationFrame(loop);","  { const T=window.__T, t0=performance.now(); updateLabels(); updateCompass(); T.labels+=performance.now()-t0; }\n  requestAnimationFrame(loop);")
rep("function loop(now){","window.__T={dog:0,cat:0,misc:0,render:0,labels:0,frames:0,calls:0,tris:0};\nfunction loop(now){")
assert s.count("startUp();\n</script>")==1
s=s.replace("startUp();\n</script>","window.__d={persp,controls,renderer,scene,dog,cat,state:()=>state,get photo(){return photo},flakes,flyLeaves,snow,fall,cityGroup,ui,get litter(){return litter}};startUp();\n</script>")
open(p,'w').write(s)
