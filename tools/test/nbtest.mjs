// Neighbour houses must never disappear: renders many camera poses with occlusion culling on and off and compares pixels.
// usage: node nbtest.mjs [page=test.html] [n=260] [seed=7]
import { chromium } from 'playwright-core';
import fs from 'fs';
const [page = 'test.html', N = '260', SEED = '7'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:480,height:300}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack));
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
await p.evaluate(()=>{ window.__freezeT = 1e6; document.querySelector('[data-q=standard]').click(); for (const k of ['dog','cat','swimmer','weather','grass','sky']){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const w = document.getElementById('s-wind'); w.value = 0; w.oninput(); });
await p.selectOption('#seasonSel','summer'); await p.waitForTimeout(2500);
await p.evaluate(()=>{ const R = __d.renderer, gl = R.getContext(), S = __d.scene;
  window.__pose = (pos, yaw, pitch, fov)=>{ const c = __d.persp; c.position.set(...pos); c.rotation.set(0,0,0); c.rotation.order = 'YXZ'; c.rotation.y = yaw; c.rotation.x = pitch; if (fov){ c.fov = fov; c.updateProjectionMatrix(); } c.updateMatrixWorld(true); };
  const grab = (noOcc)=>{ window.__nbNoOcc = noOcc; for (const h of __d.nb.houses) h.lod = -1; __d.updNb(); R.setRenderTarget(null); R.render(S, __d.persp);
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w*h*4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return {px, w, h, st:{...__d.nb.stats}}; };
  window.__cmp = ()=>{ const a = grab(false), b2 = grab(true); let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let i = 0; i < a.px.length; i += 4){ if (Math.abs(a.px[i]-b2.px[i]) > 6 || Math.abs(a.px[i+1]-b2.px[i+1]) > 6 || Math.abs(a.px[i+2]-b2.px[i+2]) > 6){ n++; const k = i/4, x = k % a.w, y = Math.floor(k / a.w); x0 = Math.min(x0,x); x1 = Math.max(x1,x); y0 = Math.min(y0,y); y1 = Math.max(y1,y); } }
    window.__nbNoOcc = false; return {diff:n, box:n ? [x0,y0,x1,y1] : null, on:a.st, off:b2.st}; };
});
// keep the app loop from fighting the test camera: stop orbit controls from rewriting the pose
await p.evaluate(()=>{ __d.controls.enabled = false; __d.controls.update = ()=>{}; });
let sd = +SEED; const rnd = ()=>{ sd = (sd*16807) % 2147483647; return (sd-1)/2147483646; };
const poses = [];
// outdoor: random spots around the plot at several heights, random headings
for (let i = 0; i < +N; i++){ const a = rnd()*Math.PI*2, r = 6 + Math.pow(rnd(), .7)*230, h = [1.7, 1.7, 3, 6, 10, 16, 24, 34, 44][Math.floor(rnd()*9)];
  poses.push({k:'out', pos:[-3 + Math.cos(a)*r, h, 5 + Math.sin(a)*r], yaw:rnd()*Math.PI*2, pitch:-(rnd()*.6)*(h > 5 ? 1 : .25), fov:45}); }
// street level along the neighbouring streets, looking along them
for (let i = 0; i < 60; i++){ const a = rnd()*Math.PI*2, r = 15 + rnd()*120; poses.push({k:'street', pos:[-3 + Math.cos(a)*r, 1.7, 5 + Math.sin(a)*r], yaw:rnd()*Math.PI*2, pitch:.02 - rnd()*.1, fov:45}); }
// inside the house at eye height (walk mode uses fov 70), looking in 12 directions from several rooms on both floors
for (const [x, z, y] of [[3.2,2.5,1.65],[4.3,6.6,1.65],[6.9,6.5,1.65],[1.2,3,1.65],[12,6.5,1.65],[9,4.4,1.65],[2.3,2,4.82],[4.6,7,4.82],[11.5,1.8,4.82],[13.6,7,4.82],[6,4.3,4.82],[1.5,4.4,4.9]])
  for (let i = 0; i < 12; i++) poses.push({k:'in', pos:[x, y, z], yaw:i/12*Math.PI*2, pitch:-.05, fov:70});
if (process.env.REPLAY){ const r = JSON.parse(fs.readFileSync(process.env.REPLAY)); poses.length = 0; for (const w of r.worst) poses.push({k:w.k, pos:w.pos, yaw:w.yaw, pitch:w.pitch, fov:w.fov}); }
let bad = 0, worst = []; const t0 = Date.now(); let culled = 0;
for (let i = 0; i < poses.length; i++){ const q = poses[i];
  const r = await p.evaluate((q)=>{ window.__pose(q.pos, q.yaw, q.pitch, q.fov); return window.__cmp(); }, q);
  culled += r.on.occ;
  if (r.diff > 0){ bad++; worst.push({i, ...q, ...r}); if (worst.length <= 12){ const f = `nbbad_${i}`; await p.evaluate(()=>{ window.__nbNoOcc = false; for (const h of __d.nb.houses) h.lod = -1; }); } }
}
worst.sort((a,b)=>b.diff-a.diff);
console.log(`${poses.length} poses in ${((Date.now()-t0)/1000).toFixed(0)} s: ${bad} with visible differences; houses culled by occlusion in total ${culled}`);
for (const w of worst.slice(0, 25)) console.log(`  #${w.i} ${w.k} pos=[${w.pos.map(v=>v.toFixed(1))}] yaw=${w.yaw.toFixed(2)} pitch=${w.pitch.toFixed(2)} diff=${w.diff}px box=${w.box} on=${JSON.stringify(w.on)} off=${JSON.stringify(w.off)}`);
if (!process.env.REPLAY) fs.writeFileSync('nbtest_last.json', JSON.stringify({bad, worst:worst.slice(0,60).map(w=>({i:w.i,k:w.k,pos:w.pos,yaw:w.yaw,pitch:w.pitch,fov:w.fov,diff:w.diff}))}));
await b.close();
