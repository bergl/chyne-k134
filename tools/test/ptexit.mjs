// Leaving the path-traced photo must give back the live view exactly as it was; starting it twice must work.  usage: node ptexit.mjs [page] [quality]
import { chromium } from 'playwright-core';
import fs from 'fs';
const [page = 'test.html', q = 'high'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:480,height:300}})).newPage(); let errors = 0;
p.on('pageerror',e=>{ errors++; console.log('PAGEERR '+e.stack); }); p.on('console',m=>{ const t = m.text(); if ((m.type()==='error' || /WebGL: INVALID|GL_INVALID/.test(t)) && !t.includes('404')){ errors++; console.log('CONSOLE', t.slice(0,300)); } });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
await p.evaluate((q)=>{ window.__freezeT = 1e6; document.querySelector(`[data-q=${q}]`).click(); for (const k of ['dog','cat','swimmer','weather']){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const tt = document.getElementById('toggleTools'); if (tt.getAttribute('aria-expanded') === 'true') tt.click(); const w = document.getElementById('s-wind'); w.value = 0; w.oninput(); const d = document.getElementById('s-day'); d.value = 172; d.oninput(); const e = document.getElementById('s-time'); e.value = 15; e.oninput(); }, q);
await p.selectOption('#seasonSel', 'summer'); await p.waitForTimeout(1500);
let fail = 0; const ok = (name, cond, extra='')=>{ console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fail++; };
const settle = async()=>{ await frames(3); await p.waitForTimeout(700); await frames(2); await p.evaluate(()=>window.__settle()); await frames(4); await p.evaluate(()=>window.__settle()); await frames(3); };
const state = ()=>p.evaluate(()=>{ let meshes = 0, vis = 0, tris = 0; __d.scene.traverse(m=>{ if (m.isMesh) meshes++; }); __d.scene.traverseVisible(m=>{ if (m.isMesh){ vis++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0)/3; } });
  return {meshes, vis, tris:Math.round(tris), children:__d.scene.children.length, env:__d.scene.environment ? __d.scene.environment.uuid : null, bg:__d.scene.background ? (__d.scene.background.isColor ? 'color' : __d.scene.background.uuid) : null, fog:!!__d.scene.fog, sunVis:__d.sun.visible, sunI:+__d.sun.intensity.toFixed(3), pr:__d.renderer.getPixelRatio(), calls:window.__T.calls}; });
const runPT = async(samples)=>{ await p.evaluate((n)=>{ window.__pto.samples = n; document.getElementById('photo').click(); }, samples); await frames(2); await p.evaluate(()=>document.getElementById('photo-pt').click());
  const t0 = Date.now(); let st = ''; while (Date.now() - t0 < 300000){ st = await p.textContent('#status'); if (/Photo ready|not supported|could not/.test(st)) break; await p.waitForTimeout(1000); } return st; };
for (const [name, v] of [['garden', {pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}], ['kitchen', {room:'1.05', wpos:[4.3,0,5.2], yaw:-0.75, pitch:-.1}]]){
  if (v.room){ await p.selectOption('#viewSel','room:'+v.room); await p.evaluate((v)=>{ __d.walk.pos.set(...v.wpos); __d.walk.yaw=v.yaw; __d.walk.pitch=v.pitch; }, v); }
  else { await p.selectOption('#viewSel','aerial'); await p.evaluate((v)=>{ __d.persp.position.set(...v.pos); __d.controls.target.set(...v.tgt); __d.controls.update(); }, v); }
  await settle(); const s0 = await state(); const a = await p.screenshot({timeout:120000});
  let st = await runPT(2); ok(`${name}: path trace runs`, /Photo ready/.test(st), st.slice(0,60));
  st = await p.evaluate(()=>{ document.getElementById('photo-pt').click(); return document.getElementById('status').textContent; }); await frames(3);   // back to the ordinary photo
  await p.evaluate(()=>document.getElementById('photo-pt').click()); const t0 = Date.now(); while (Date.now() - t0 < 300000){ st = await p.textContent('#status'); if (/Photo ready · path/.test(st)) break; await p.waitForTimeout(1000); }
  ok(`${name}: starts a second time`, /Photo ready · path/.test(st), st.slice(0,60));
  await p.evaluate(()=>document.getElementById('photo-exit').click()); await settle(); const s1 = await state(); const c = await p.screenshot({timeout:120000});
  const same = ['meshes','vis','tris','children','env','bg','fog','sunVis','sunI','pr'].filter(k=>s0[k] !== s1[k]);
  ok(`${name}: scene as before`, same.length === 0, same.map(k=>`${k}: ${s0[k]} → ${s1[k]}`).join(', ') || JSON.stringify(s1));
  fs.writeFileSync(`ptexit_${q}_${name}_a.png`, a); fs.writeFileSync(`ptexit_${q}_${name}_b.png`, c);
  ok(`${name}: no GL error`, (await p.evaluate(()=>__d.renderer.getContext().getError())) === 0);
}
console.log(`errors: ${errors}, failed: ${fail}`);
await b.close();
