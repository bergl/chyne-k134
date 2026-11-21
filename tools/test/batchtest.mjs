// View-mode batches must look exactly like the objects themselves, stay clickable, and follow edits, layers and views.
import { chromium } from 'playwright-core';
import fs from 'fs';
const [page = 'test.html', q = 'standard'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:640,height:400}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack)); p.on('console',m=>{ if (m.type()==='error' && !m.text().includes('404')) console.log('ERR', m.text().slice(0,300)); });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
await p.evaluate((q)=>{ window.__freezeT = 1e6; document.querySelector(`[data-q=${q}]`).click();
  for (const k of ['dog','cat','swimmer','weather','sky']){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const tt = document.getElementById('toggleTools'); if (tt.getAttribute('aria-expanded') === 'true') tt.click();
  const w = document.getElementById('s-wind'); w.value = 0; w.oninput(); }, q);
await p.selectOption('#seasonSel','summer'); await p.waitForTimeout(2500); await frames(3);
let fail = 0; const ok = (name, cond, extra='')=>{ console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fail++; };
const info = ()=>p.evaluate(()=>{ const B = __d.batches; let l1 = 0, meshes = 0; __d.objectsGroup.traverse(m=>{ if (m.isMesh){ meshes++; if (m.layers.mask === 2) l1++; } });
  let bm = 0; B.root.traverse(m=>{ if (m.isMesh) bm++; }); return {on:B.on, built:B.built, ms:+B.ms.toFixed(1), sources:B.sources.length, layer1:l1, meshes, batchMeshes:bm, groups:[...B.groups.entries()].map(([r,g])=>r+':'+(g.visible?1:0)+':'+g.children.length).join(' '), calls:window.__T.calls}; });
// --- pixels: batches on (view mode) against batches off (the same frame drawn from the objects themselves)
await p.evaluate(()=>{ const R = __d.renderer, gl = R.getContext();
  window.__grab = ()=>{ const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w*h*4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  window.__ab = ()=>{ const S = __d.scene, cam = __d.camera(), B = __d.batches;
    R.shadowMap.needsUpdate = true; __d.shadowSplit.staticDirty = true; R.setRenderTarget(null); R.render(S, cam); const a = window.__grab(); const ua = window.__dump ? R.domElement.toDataURL('image/png') : null;
    for (const m of B.sources) m.layers.set(0); B.root.visible = false;
    R.shadowMap.needsUpdate = true; __d.shadowSplit.staticDirty = true; R.render(S, cam); const b2 = window.__grab(); const ub = window.__dump ? R.domElement.toDataURL('image/png') : null;
    for (const m of B.sources) m.layers.set(1); B.root.visible = true; __d.shadowSplit.staticDirty = true;
    let n = 0, big = 0; for (let i = 0; i < a.length; i += 4){ const d = Math.max(Math.abs(a[i]-b2[i]), Math.abs(a[i+1]-b2[i+1]), Math.abs(a[i+2]-b2[i+2])); if (d > 2) n++; if (d > 24) big++; } return {n, big, total:a.length/4, ua, ub}; };
});
console.log('view mode:', JSON.stringify(await info()));
const views = [['aerial', {pos:[-30,27,36], tgt:[-8,0,4]}], ['garden', {pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}], ['street', {pos:[30,3,-14], tgt:[8,2,3]}], ['pool', {pos:[-24,2.2,7.5], tgt:[-18.5,.4,1.5]}], ['terrace', {pos:[-6,1.7,9.5], tgt:[1,1.2,5]}]];
for (const [name, v] of views){
  await p.evaluate((v)=>{ __d.persp.position.set(...v.pos); __d.controls.target.set(...v.tgt); __d.controls.update(); }, v); await frames(3);
  await p.evaluate(()=>{ window.__dump = true; }); const r = await p.evaluate(()=>window.__ab()); await p.evaluate(()=>{ window.__dump = false; });
  if (r.ua){ fs.writeFileSync(`bt_${name}_batched.png`, Buffer.from(r.ua.split(',')[1], 'base64')); fs.writeFileSync(`bt_${name}_objects.png`, Buffer.from(r.ub.split(',')[1], 'base64')); }
  ok(`pixels equal with and without batches: ${name}`, r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} px differ by >2, ${r.big} by >24`);
}
await p.selectOption('#viewSel','room:1.05'); await p.evaluate(()=>{ __d.walk.pos.set(4.3,0,5.2); __d.walk.yaw=-0.75; __d.walk.pitch=-.1; }); await frames(4);
{ const r = await p.evaluate(()=>window.__ab()); ok('pixels equal with and without batches: kitchen (walk)', r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} px differ by >2, ${r.big} by >24`); console.log('room view:', JSON.stringify(await info())); }
await p.selectOption('#viewSel','aerial'); await frames(3);
// --- clicking still finds the object under the pointer
const hit = await p.evaluate(()=>{ const o = __d.state().objects.find(q=>q.type==='sauna_cube'); const v = new (__d.persp.position.constructor)(o.x, 1.2, o.y).project(__d.persp);
  return {id:o.id, x:(v.x+1)/2*innerWidth, y:(1-v.y)/2*innerHeight}; });
const picked = await p.evaluate((h)=>{ const r = window.__pick(h.x, h.y); return r ? r.id : null; }, hit);
ok('a click in view mode finds the sauna through its batch', picked === hit.id, 'picked ' + picked);
// --- edit mode shows the objects themselves; moving one and returning rebuilds the batch
const before = await info();
await p.evaluate(()=>document.getElementById('editToggle').click()); await frames(3);
const ed = await info(); ok('edit mode: batches off, every mesh back on the drawn layer', !ed.on && ed.layer1 === 0, JSON.stringify(ed));
await p.evaluate(()=>{ const o = __d.state().objects.find(q=>q.type==='sauna_cube'); o.x += 1.5; window.__rebuild(o); }); await frames(2);
await p.evaluate(()=>document.getElementById('editToggle').click()); await frames(3);
const after = await info(); ok('back in view mode: batch rebuilt', after.on && after.built > before.built && after.layer1 > 0, JSON.stringify(after));
{ const r = await p.evaluate(()=>window.__ab()); ok('pixels equal after the edit', r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} px differ by >2, ${r.big} by >24`); }
// --- layers and seasons keep it in step
await p.evaluate(()=>{ const c = document.querySelector('[data-layer=trees]'); c.checked = false; c.dispatchEvent(new Event('change')); }); await frames(3);
{ const r = await p.evaluate(()=>window.__ab()); ok('trees layer off: pixels equal', r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} / ${r.big}`); }
await p.evaluate(()=>{ const c = document.querySelector('[data-layer=trees]'); c.checked = true; c.dispatchEvent(new Event('change')); }); await frames(2);
await p.selectOption('#seasonSel','autumn'); await p.waitForTimeout(800); await frames(3);
await p.evaluate(()=>{ const c = document.querySelector('[data-layer=weather]'); if (c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }); await frames(3);
{ const r = await p.evaluate(()=>window.__ab()); ok('autumn: pixels equal', r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} / ${r.big}`); }
// --- cut-away: upper-floor things and the ground-floor ceiling follow the cut
await p.selectOption('#cutSel','gf'); await frames(3);
const vis = await p.evaluate(()=>{ const out = {}; for (const id of ['f-bed','f-ceilK','f-sofaL','f-pan']){ const g = __d.meshById.get(id); out[id] = g ? g.visible : null; } return out; });
ok('ground-floor cut: bed and kitchen ceiling hidden, sofa and pan shown', vis['f-bed'] === false && vis['f-ceilK'] === false && vis['f-sofaL'] === true && vis['f-pan'] === true, JSON.stringify(vis));
await p.evaluate(()=>{ __d.persp.position.set(3.5,13,9.5); __d.controls.target.set(4.2,0,4.4); __d.controls.update(); }); await frames(3);
{ const r = await p.evaluate(()=>window.__ab()); ok('ground-floor cut: pixels equal', r.big <= r.total*0.0002 && r.n < r.total*0.002, `${r.n} / ${r.big}`); console.log('cut view:', JSON.stringify(await info())); }
await p.selectOption('#cutSel','all');
console.log(fail ? `${fail} FAILED` : 'all batching checks passed');
await b.close();
