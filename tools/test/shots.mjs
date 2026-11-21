// Deterministic screenshots for regression comparison.
// usage: node shots.mjs <tag> [quality=high] [page=test.html] [only=name1,name2]
import { chromium } from 'playwright-core';
import fs from 'fs';
const [tag = 'base', q = 'high', page = 'test.html', ONLY = ''] = process.argv.slice(2);
fs.mkdirSync('shots', {recursive:true});
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:960,height:600}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack)); p.on('console',m=>{ if (m.type()==='error' && !m.text().includes('404')) console.log('ERR', m.text().slice(0,300)); });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
await p.evaluate((q)=>{ window.__freezeT = 1e6; document.querySelector(`[data-q=${q}]`).click();
  for (const k of ['dog','cat','swimmer','weather']){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const tt = document.getElementById('toggleTools'); if (tt.getAttribute('aria-expanded') === 'true') tt.click();     // tools panel closed: the whole view is compared
  const w = document.getElementById('s-wind'); w.value = 0; w.oninput();
  const d = document.getElementById('s-day'); if (d){ d.value = 172; d.oninput(); }
}, q);
const setSun = (t)=>p.evaluate((t)=>{ const e = document.getElementById('s-time'); e.value = t; e.oninput(); }, t);
const season = (s)=>p.selectOption('#seasonSel', s);
await season('summer'); await setSun(15); await p.waitForTimeout(1500);
const V = [
  // name, {pos,tgt} | {room, wpos, yaw, pitch}, extras
  ['aerial',  {pos:[-30,27,36], tgt:[-8,0,4]}],
  ['garden',  {pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}],
  ['street',  {pos:[30,3,-14], tgt:[8,2,3]}],
  ['far',     {pos:[-160,90,190], tgt:[0,0,10]}],
  ['low',     {pos:[-60,8,80], tgt:[20,3,-20]}],
  ['pool',    {pos:[-24,2.2,7.5], tgt:[-18.5,.4,1.5]}],
  ['terrace', {pos:[-6,1.7,9.5], tgt:[1,1.2,5]}],
  ['roofdown',{pos:[4,22,16], tgt:[6,0,4]}],
  ['evening', {pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}, {sun:19.5}],
  ['morning', {pos:[-30,27,36], tgt:[-8,0,4]}, {sun:7.5}],
  ['winter',  {pos:[-30,27,36], tgt:[-8,0,4]}, {season:'winter'}],
  ['autumn',  {pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}, {season:'autumn'}],
  ['cutgf',   {pos:[3.5,13,9.5], tgt:[4.2,0,4.4]}, {cut:'gf'}],
  ['cutuf',   {pos:[3.5,16,12], tgt:[6,3,4.4]}, {cut:'uf'}],
  ['plan',    {view:'plan'}],
  ['kitchen', {room:'1.05', wpos:[4.3,0,5.2], yaw:-0.75, pitch:-.1}],
  ['living',  {room:'1.05', wpos:[3.0,0,1.2], yaw:Math.atan2(-1,.05), pitch:-.18}],
  ['tvwall',  {room:'1.05', wpos:[3.4,0,3.0], yaw:Math.atan2(1,0), pitch:.02}],
  ['window',  {room:'1.05', wpos:[4.7,0,6.3], yaw:Math.atan2(-.55,-.85), pitch:-.08}],
  ['bedroom', {room:'2.06'}],
  ['hall',    {room:'1.02'}],
];
const only = ONLY ? new Set(ONLY.split(',')) : null;
for (const [name, v, ex = {}] of V){ if (only && !only.has(name)) continue;
  const t0 = Date.now();
  if (ex.sun) await setSun(ex.sun); if (ex.season) await season(ex.season);
  if (ex.cut){ if (await p.evaluate(()=>__d.walk.on)) await p.selectOption('#viewSel','aerial'); await p.selectOption('#cutSel', ex.cut); }
  if (v.room){ await p.selectOption('#viewSel','room:'+v.room); if (v.wpos) await p.evaluate((v)=>{ __d.walk.pos.set(...v.wpos); __d.walk.yaw=v.yaw; __d.walk.pitch=v.pitch; }, v); }
  else if (v.view){ await p.selectOption('#viewSel', v.view); }
  else { if (await p.evaluate(()=>__d.ui.view !== 'aerial')) await p.selectOption('#viewSel','aerial'); await p.evaluate((v)=>{ __d.persp.position.set(...v.pos); __d.controls.target.set(...v.tgt); __d.controls.update(); }, v); }
  await frames(3); await p.waitForTimeout(700);                       // timers: grass rebuild, reflections throttle
  await frames(2); await p.evaluate(()=>window.__settle()); await frames(4); await p.evaluate(()=>window.__settle()); await frames(3);
  await p.screenshot({path:`shots/${tag}_${q}_${name}.png`});
  const st = await p.evaluate(()=>JSON.stringify({nb:window.__nbStats(), calls:window.__T.calls}));
  console.log(name, st, ((Date.now()-t0)/1000).toFixed(0)+'s');
  if (ex.sun) await setSun(15); if (ex.season) await season('summer'); if (ex.cut) await p.selectOption('#cutSel','all');
}
await b.close();
