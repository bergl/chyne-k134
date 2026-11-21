// The loading note: shows while loading, goes after the first frames, and says so when the engine is late, missing, or the model cannot start.
import { chromium } from 'playwright-core';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = 'http://localhost:8765/test_prod.html';
const state = p=>p.evaluate(()=>{ const e = document.getElementById('boot'); return e ? {msg:document.getElementById('boot-msg').textContent, err:e.classList.contains('err'), booting:document.getElementById('app').classList.contains('booting'), toolbarHidden:getComputedStyle(document.getElementById('viewSel')).visibility === 'hidden'} : 'gone'; });
let fail = 0; const ok = (name, cond, extra='')=>{ console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fail++; };
// 1. normal load on desktop and phone, with the engine held back a few seconds
for (const [tag, vp, extra] of [['desk', {width:900,height:560}, {}], ['phone', {width:390,height:780}, {hasTouch:true, isMobile:true, deviceScaleFactor:2}]]){
  const ctx = await b.newContext({viewport:vp, ...extra}); const p = await ctx.newPage(); let errs = 0; p.on('pageerror',e=>{ errs++; console.log('PAGEERR '+e.message); });
  await p.route('**/three.module.min.js', async r=>{ await new Promise(s=>setTimeout(s, 4000)); r.continue(); });
  p.goto(page, {timeout:240000, waitUntil:'commit'}).catch(()=>{});
  await p.waitForTimeout(2500); await p.screenshot({path:`boot_${tag}_1.png`});
  const s1 = await state(p); ok(`${tag}: note shown while loading, toolbar hidden`, s1 !== 'gone' && /Loading/.test(s1.msg) && s1.booting && s1.toolbarHidden && !s1.err, JSON.stringify(s1));
  await p.waitForFunction(()=>window.__T && window.__T.frames >= 2, null, {timeout:300000, polling:100}); await p.waitForTimeout(1500);
  ok(`${tag}: note gone after the first frames, no errors`, (await state(p)) === 'gone' && errs === 0);
  await p.screenshot({path:`boot_${tag}_2.png`}); await ctx.close(); }
// 2. the engine cannot be loaded
{ const ctx = await b.newContext({viewport:{width:900,height:560}}); const p = await ctx.newPage();
  await p.route('**/three.module.min.js', r=>r.abort());
  p.goto(page, {timeout:60000, waitUntil:'commit'}).catch(()=>{}); await p.waitForTimeout(3000);
  const s = await state(p); ok('engine blocked: says it could not be loaded', s !== 'gone' && /could not be loaded/.test(s.msg) && s.err, JSON.stringify(s)); await p.screenshot({path:'boot_blocked.png'}); await ctx.close(); }
// 3. the engine is very late: the note changes after 20 s, and loading still completes
{ const ctx = await b.newContext({viewport:{width:900,height:560}}); const p = await ctx.newPage();
  await p.route('**/three.module.min.js', async r=>{ await new Promise(s=>setTimeout(s, 23000)); r.continue(); });
  p.goto(page, {timeout:240000, waitUntil:'commit'}).catch(()=>{}); await p.waitForTimeout(21500);
  const s = await state(p); ok('engine late: note after 20 s', s !== 'gone' && /Still loading the 3D engine/.test(s.msg) && !s.err, JSON.stringify(s));
  await p.waitForFunction(()=>window.__T && window.__T.frames >= 2, null, {timeout:300000, polling:100}); await p.waitForTimeout(1500);
  ok('engine late: loads in the end', (await state(p)) === 'gone'); await ctx.close(); }
// 4. the model fails to start (no WebGL)
{ const ctx = await b.newContext({viewport:{width:900,height:560}}); const p = await ctx.newPage(); p.on('pageerror',()=>{});
  await p.addInitScript(()=>{ const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(t, ...a){ return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
  p.goto(page, {timeout:60000, waitUntil:'commit'}).catch(()=>{}); await p.waitForTimeout(9000);
  const s = await state(p); ok('no WebGL: says the model could not start', s !== 'gone' && /could not start/.test(s.msg) && s.err, JSON.stringify(s)); await p.screenshot({path:'boot_nowebgl.png'}); await ctx.close(); }
console.log(fail ? `${fail} FAILED` : 'all boot checks passed');
await b.close();
