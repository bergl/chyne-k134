// Start-up timeline without the profiler: when the overlay goes, first frames, when post-processing is ready; plus extension support.
// usage: node lab_start.mjs [page] [w] [h] [dpr] [touch]
import { chromium } from 'playwright-core';
const [page = 'test_prod.html', W = '1280', H = '800', DPR = '1', TOUCH = '0'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx = await b.newContext({viewport:{width:+W,height:+H}, deviceScaleFactor:+DPR, hasTouch:TOUCH==='1', isMobile:TOUCH==='1'});
const p = await ctx.newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.message)); p.on('console',m=>{ if (m.type()==='error' || m.type()==='warning') console.log('CONSOLE', m.type(), m.text().slice(0,200)); });
await p.addInitScript(()=>{ window.__t0 = performance.now(); window.__ev = []; const raf = requestAnimationFrame; let longest = 0, lastT = performance.now(), n = 0; window.__gaps = [];
  const tick = ()=>{ const t = performance.now(); window.__gaps.push(Math.round(t - lastT)); lastT = t; if (++n < 3000) raf(tick); }; raf(tick); });
const t0 = Date.now();
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
const dcl = Date.now() - t0;
await p.waitForFunction(()=>window.__T && window.__T.frames >= 1, null, {timeout:300000, polling:50}); const f1 = Date.now() - t0;
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000, polling:50}); const f3 = Date.now() - t0;
let post = null;
try { await p.waitForFunction(()=>window.__postReady && window.__postReady(), null, {timeout:120000, polling:50}); post = Date.now() - t0; } catch(e){}
await p.waitForTimeout(2500);
const r = await p.evaluate(()=>({ext: window.__d ? window.__d.renderer.extensions.has('KHR_parallel_shader_compile') : null, programs: window.__d ? window.__d.renderer.info.programs.length : null,
  boot: !!document.getElementById('boot'), gaps: window.__gaps, q: window.__q ? window.__q() : null}));
const gaps = r.gaps; const big = gaps.map((g,i)=>[g,i]).filter(([g])=>g > 120).map(([g,i])=>`#${i}:${g}`);
console.log(`${page} ${W}x${H}@${DPR}${TOUCH==='1'?' touch':''} quality=${r.q}: DOMContentLoaded ${dcl} ms, first frame ${f1} ms, 3 frames ${f3} ms, post-processing ready ${post} ms; programs ${r.programs}; parallel-compile ext: ${r.ext}; overlay still there: ${r.boot}`);
console.log('frames with a gap > 120 ms (rAF index:ms): ' + big.join(' '));
await b.close();
