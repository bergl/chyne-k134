// The background compile of hidden materials (runs only with KHR_parallel_shader_compile; forced on in test_hid.html): no errors, and later reveals need few new programs.
import { chromium } from 'playwright-core';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const page of ['test_hid.html', 'test.html']){
  const p = await (await b.newContext({viewport:{width:640,height:400}})).newPage(); let errors = 0;
  p.on('pageerror',e=>{ errors++; console.log('PAGEERR '+e.stack); }); p.on('console',m=>{ const t = m.text(); if ((m.type()==='error' || /THREE\.|shader|warm-up/i.test(t)) && !t.includes('404') && !t.includes('GPU stall')){ errors++; console.log('CONSOLE', t.slice(0,300)); } });
  await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__T && window.__T.frames >= 3 && window.__postReady(), null, {timeout:300000});
  const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
  await p.waitForTimeout(4000); await frames(3);
  const progs = ()=>p.evaluate(()=>__d.renderer.info.programs.length);
  const out = {page, hidden:await p.evaluate(()=>window.__hidN ?? null), hidMs:await p.evaluate(()=>window.__hidMs ? Math.round(window.__hidMs) : null), start:await progs()};
  await p.selectOption('#seasonSel','winter'); await p.waitForTimeout(800); await frames(4); out.winter = await progs();
  await p.selectOption('#seasonSel','autumn'); await p.waitForTimeout(800); await frames(4); out.autumn = await progs();
  await p.selectOption('#viewSel','room:1.05'); await frames(4); out.room = await progs();
  await p.selectOption('#viewSel','aerial'); await p.selectOption('#cutSel','gf'); await frames(4); out.cut = await progs();
  out.errors = errors; out.glError = await p.evaluate(()=>__d.renderer.getContext().getError());
  console.log(JSON.stringify(out)); await p.close(); }
await b.close();
