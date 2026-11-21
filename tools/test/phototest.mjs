// Photo mode (accumulated frames): the result must look like the baseline's, with no GL errors.  usage: node phototest.mjs <page> <tag> [quality]
import { chromium } from 'playwright-core';
const [page = 'test.html', tag = 'new', q = 'high'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:720,height:450}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack)); p.on('console',m=>{ const t = m.text(); if ((m.type()==='error' || m.type()==='warning') && !t.includes('404') && !t.includes('GPU stall')) console.log('CONSOLE', m.type(), t.slice(0,300)); });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
await p.evaluate((q)=>{ window.__freezeT = 1e6; document.querySelector(`[data-q=${q}]`).click(); for (const k of ['dog','cat','swimmer','weather']){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const tt = document.getElementById('toggleTools'); if (tt.getAttribute('aria-expanded') === 'true') tt.click(); const w = document.getElementById('s-wind'); w.value = 0; w.oninput(); const d = document.getElementById('s-day'); d.value = 172; d.oninput(); const e = document.getElementById('s-time'); e.value = 15; e.oninput(); }, q);
await p.selectOption('#seasonSel','summer'); await p.waitForTimeout(1500);
await p.evaluate(()=>{ __d.persp.position.set(-14.6,1.7,7.6); __d.controls.target.set(1,2.5,4.4); __d.controls.update(); }); await frames(4); await p.evaluate(()=>window.__settle()); await frames(4);
await p.evaluate(()=>{ while (__d.renderer.getContext().getError()); document.getElementById('photo').click(); });
const t0 = Date.now(); let st = '';
while (Date.now() - t0 < 240000){ st = await p.textContent('#status'); if (/Photo ready/.test(st)) break; await p.waitForTimeout(1500); }
console.log(tag, q, 'status:', st.slice(0,70), 'after', ((Date.now()-t0)/1000).toFixed(0)+'s', 'GL error:', await p.evaluate(()=>__d.renderer.getContext().getError()));
await p.screenshot({path:`photo_${tag}_${q}.png`});
await p.evaluate(()=>document.getElementById('photo-exit').click()); await frames(5);
console.log(tag, q, 'back in live view: calls', await p.evaluate(()=>window.__T.calls), 'GL error:', await p.evaluate(()=>__d.renderer.getContext().getError()));
await b.close();
