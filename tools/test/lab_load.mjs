// Load profile: CPU-profiles the page from navigation until a few frames after the first one.
// usage: node lab_load.mjs [page=test.html] [w=1280] [h=800] [dpr=1] [touch=0]
import { chromium } from 'playwright-core';
import fs from 'fs';
const [page = 'test.html', W = '1280', H = '800', DPR = '1', TOUCH = '0'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx = await b.newContext({viewport:{width:+W,height:+H}, deviceScaleFactor:+DPR, hasTouch:TOUCH==='1', isMobile:TOUCH==='1'});
const p = await ctx.newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.message));
const cdp = await ctx.newCDPSession(p);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval:200});
await p.addInitScript(()=>{ window.__t0 = performance.now(); let n = 0; const raf = requestAnimationFrame; window.__frames = [];
  const tick = (t)=>{ window.__frames.push(performance.now()); if (window.__frames.length < 400) raf(tick); }; raf(tick); });
await cdp.send('Profiler.start');
const t0 = Date.now();
await p.goto('http://localhost:8765/'+page, {timeout:180000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:180000});
const tFirst = Date.now() - t0;
await p.waitForTimeout(3000);
const { profile } = await cdp.send('Profiler.stop');
const marks = await p.evaluate(()=>({marks: window.__marks || null, frames: window.__frames.slice(0, 40).map(t=>Math.round(t - window.__t0)), q: (typeof qName!=='undefined') ? qName : null,
  info: window.__d ? {calls: window.__T.calls, tris: window.__T.tris, programs: window.__d.renderer.info.programs.length, geos: window.__d.renderer.info.memory.geometries, tex: window.__d.renderer.info.memory.textures} : null}));
fs.writeFileSync('lab_load.cpuprofile', JSON.stringify(profile));
// aggregate
const nodes = new Map(profile.nodes.map(n=>[n.id, n])); const self = new Map(); const dt = profile.timeDeltas; let total = 0;
const selfNode = new Map();
for (let i=0;i<profile.samples.length;i++){ const id = profile.samples[i], d = dt[i]||0; selfNode.set(id, (selfNode.get(id)||0)+d); total += d; }
const parent = new Map(); for (const n of profile.nodes) for (const c of n.children||[]) parent.set(c, n.id);
const key = n=>`${n.callFrame.functionName||'(anon)'} :${n.callFrame.lineNumber+1} ${n.callFrame.url.split('/').pop().slice(0,28)}`;
const selfBy = new Map(), totBy = new Map();
for (const [id, d] of selfNode){ const n = nodes.get(id); selfBy.set(key(n), (selfBy.get(key(n))||0)+d);
  const seen = new Set(); for (let c = id; c!==undefined; c = parent.get(c)){ const k = key(nodes.get(c)); if (!seen.has(k)){ seen.add(k); totBy.set(k, (totBy.get(k)||0)+d); } } }
const top = (m, n)=>[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${(v/1000).toFixed(0).padStart(6)} ms  ${k}`).join('\n');
console.log(`page ${page} ${W}x${H}@${DPR} touch=${TOUCH}: first 3 frames after ${tFirst} ms wall; profile total ${(total/1000).toFixed(0)} ms`);
console.log('frame times since navigation (ms):', marks.frames.join(' '));
console.log('info', JSON.stringify(marks.info));
if (marks.marks) console.log('marks', JSON.stringify(marks.marks));
console.log('--- top self time ---\n'+top(selfBy, 45));
console.log('--- top total time (inclusive) ---\n'+top(totBy, 70));
// line-level ticks for the module's top-level code
const lineTicks = new Map();
for (const n of profile.nodes){ if (!n.positionTicks) continue; const fn = n.callFrame.functionName; if (fn) continue; if (!n.callFrame.url.endsWith(page)) continue;
  for (const t of n.positionTicks) lineTicks.set(t.line, (lineTicks.get(t.line)||0)+t.ticks); }
console.log('--- top-level module lines by self ticks (line: ticks) ---\n'+[...lineTicks.entries()].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([l,t])=>`${l}:${t}`).join('  '));
await b.close();
