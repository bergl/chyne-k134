// Path-traced photo: screenshots after a number of samples.  usage: node pttest.mjs <page> <tag> [view=garden] [samples=24] [w=640] [h=400] [quality=ultra] [maxSeconds=420]
import { chromium } from 'playwright-core';
const [page = 'test.html', tag = 'pt', view = 'garden', SAMPLES = '24', W = '640', H = '400', q = 'ultra', MAXS = '420'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:+W,height:+H}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack)); p.on('console',m=>{ const t = m.text(); if (t.startsWith('PT ')) console.log(t); else if ((m.type()==='error' || m.type()==='warning') && !t.includes('404') && !t.includes('GPU stall') && !t.includes('KHR_parallel')) console.log('CONSOLE', m.type(), t.slice(0,400)); });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
if (process.env.KEEP) await p.evaluate(()=>{ window.__keep = true; });
await p.evaluate((q)=>{ window.__freezeT = 1e6; document.querySelector(`[data-q=${q}]`).click(); for (const k of (window.__keep ? [] : ['dog','cat','swimmer','weather'])){ const c = document.querySelector('[data-layer='+k+']'); if (c && c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }
  const tt = document.getElementById('toggleTools'); if (tt.getAttribute('aria-expanded') === 'true') tt.click(); const w = document.getElementById('s-wind'); w.value = 0; w.oninput(); const d = document.getElementById('s-day'); d.value = 172; d.oninput(); const e = document.getElementById('s-time'); e.value = 15; e.oninput(); }, q);
await p.selectOption('#seasonSel', process.env.SEASON || 'summer'); await p.waitForTimeout(1500);
if (process.env.SUN) await p.evaluate((t)=>{ const e = document.getElementById('s-time'); e.value = t; e.oninput(); }, +process.env.SUN);
if (process.env.SEASON === 'winter') await p.waitForTimeout(9000);
const views = {garden:{pos:[-14.6,1.7,7.6], tgt:[1,2.5,4.4]}, aerial:{pos:[-30,27,36], tgt:[-8,0,4]}, terrace:{pos:[-6,1.7,9.5], tgt:[1,1.2,5]}, pool:{pos:[-24,2.2,7.5], tgt:[-18.5,.4,1.5]}, pets:{pos:[-9.5,1.3,9.5], tgt:[-6,.5,5]}, street:{pos:[30,3,-14], tgt:[8,2,3]}, tree:{pos:[-9,1.6,9], tgt:[-5,2.4,5]}, leaf:{pos:[-7.6,2.3,6.6], tgt:[-5.2,2.9,4.9]}, kitchen:{room:'1.05', wpos:[4.3,0,5.2], yaw:-0.75, pitch:-.1}, living:{room:'1.05', wpos:[3.0,0,1.2], yaw:Math.atan2(-1,.05), pitch:-.18}};
const v = views[view];
if (v.room){ await p.selectOption('#viewSel','room:'+v.room); await p.evaluate((v)=>{ __d.walk.pos.set(...v.wpos); __d.walk.yaw=v.yaw; __d.walk.pitch=v.pitch; }, v); }
else await p.evaluate((v)=>{ __d.persp.position.set(...v.pos); __d.controls.target.set(...v.tgt); __d.controls.update(); }, v);
await frames(4); await p.evaluate(()=>window.__settle()); await frames(6);
if (process.env.LIVE) await p.screenshot({path:`pt_${tag}_${view}_live.png`, timeout:300000});
const t0 = Date.now();
if (process.env.PTO) await p.evaluate((o)=>Object.assign(window.__pto, JSON.parse(o)), process.env.PTO);
await p.evaluate(()=>{ document.getElementById('photo').click(); }); await frames(2);
await p.evaluate(()=>{ document.getElementById('photo-pt').click(); });
if (!process.env.UI) await p.addStyleTag({content:'#app > *:not(#view){display:none !important}'});
let st = '', n = 0, shot = new Set((process.env.AT || '').split(',').filter(Boolean).map(Number));
while (Date.now() - t0 < +MAXS*1000){ st = await p.textContent('#status'); const m = /(\d+) of \d+ samples/.exec(st); n = m ? +m[1] : (/Photo ready/.test(st) ? 1e9 : 0);
  for (const k of [...shot]) if (n >= k){ shot.delete(k); await p.screenshot({path:`pt_${tag}_${view}_s${k}.png`, timeout:300000}); console.log('  shot at', n, 'samples,', ((Date.now()-t0)/1000).toFixed(0)+'s'); }
  if (n >= +SAMPLES || /not supported|could not/.test(st)) break; await p.waitForTimeout(1500); }
console.log(tag, view, q, `${W}x${H}`, 'status:', st.slice(0,90), '| after', ((Date.now()-t0)/1000).toFixed(0)+'s', '| GL error', await p.evaluate(()=>__d.renderer.getContext().getError()));
await p.screenshot({path:`pt_${tag}_${view}.png`, timeout:300000});
if (process.env.RAW){ await p.evaluate(()=>{ window.__pto.denoise = 0; }); await frames(3); await p.screenshot({path:`pt_${tag}_${view}_raw.png`, timeout:300000}); }
await b.close();
