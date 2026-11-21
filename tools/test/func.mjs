// Functional regression: every view, cut, season, quality, layer, edit and photo path must run without a page or shader error.
// usage: node func.mjs [page=test.html]
import { chromium } from 'playwright-core';
const [page = 'test.html'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:720,height:440}})).newPage();
let errors = 0;
p.on('pageerror',e=>{ errors++; console.log('PAGEERR '+e.stack); });
p.on('console',m=>{ const t = m.text(); if ((m.type()==='error' || /THREE\.|WebGL: INVALID|GL_INVALID|shader/i.test(t)) && !t.includes('404') && !t.includes('GPU stall')){ errors++; console.log('CONSOLE', m.type(), t.slice(0,400)); } });
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
let fail = 0; const ok = (name, cond, extra='')=>{ console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fail++; };
const glErr = ()=>p.evaluate(()=>__d.renderer.getContext().getError());
const census = ()=>p.evaluate(()=>{ let meshes = 0, vis = 0, skinned = 0; __d.scene.traverse(m=>{ if (m.isMesh){ meshes++; if (m.isSkinnedMesh) skinned++; } }); __d.scene.traverseVisible(m=>{ if (m.isMesh) vis++; });
  return {meshes, vis, skinned, calls:window.__T.calls, tris:Math.round(window.__T.tris/1000)+'k', programs:__d.renderer.info.programs.length, nb:window.__nbStats()}; });
ok('overlay gone after start-up', await p.evaluate(()=>!document.getElementById('boot') && !document.getElementById('app').classList.contains('booting')));
ok('toolbar and panel are shown', await p.evaluate(()=>{ const v = document.getElementById('viewSel'), r = v.getBoundingClientRect(); return r.width > 20 && getComputedStyle(v).visibility !== 'hidden'; }));
console.log('start', JSON.stringify(await census()));
// --- quality presets
for (const q of ['ultra','standard','high']){ await p.evaluate(q=>document.querySelector(`[data-q=${q}]`).click(), q); await p.waitForTimeout(1500); await p.evaluate(()=>window.__settle()); await frames(8);
  const c = await census(); ok(`quality ${q}`, c.calls > 20 && (await glErr()) === 0, JSON.stringify({calls:c.calls, tris:c.tris, programs:c.programs})); }
// --- every view
const views = await p.evaluate(()=>[...document.querySelectorAll('#viewSel option')].map(o=>o.value));
let vbad = [];
for (const v of views){ await p.selectOption('#viewSel', v); await frames(3); const c = await census(); const e = await glErr(); if (!(c.calls > 10) || e) vbad.push(v+':'+c.calls+':'+e); }
ok(`views (${views.length})`, vbad.length === 0, vbad.join(' '));
await p.selectOption('#viewSel', 'aerial'); await frames(2);
// --- neighbours are there in the default aerial view
{ await p.evaluate(()=>{ __d.persp.position.set(-70,45,95); __d.controls.target.set(0,0,0); __d.controls.update(); }); await frames(3);
  const c = await census(); ok('neighbour houses drawn in a wide view', c.nb && (c.nb.full + c.nb.simple + c.nb.imp) > 40, JSON.stringify(c.nb)); await p.selectOption('#viewSel', 'aerial'); await frames(2); }
// --- every cut
const cuts = await p.evaluate(()=>[...document.querySelectorAll('#cutSel option')].map(o=>o.value));
let cbad = [];
for (const v of cuts){ await p.selectOption('#cutSel', v); await frames(3); const c = await census(); const e = await glErr(); if (!(c.calls > 10) || e) cbad.push(v+':'+c.calls+':'+e); }
ok(`cuts (${cuts.join(',')})`, cbad.length === 0, cbad.join(' '));
await p.selectOption('#cutSel', cuts[0]); await frames(2);
// --- seasons + weather
const seasons = await p.evaluate(()=>[...document.querySelectorAll('#seasonSel option')].map(o=>o.value));
let sbad = [];
for (const v of seasons){ await p.selectOption('#seasonSel', v); await p.waitForTimeout(600); await frames(3); const c = await census(); const e = await glErr(); if (!(c.calls > 10) || e) sbad.push(v+':'+c.calls+':'+e); }
ok(`seasons (${seasons.join(',')})`, sbad.length === 0, sbad.join(' '));
await p.selectOption('#seasonSel', 'summer'); await p.waitForTimeout(600); await frames(2);
// --- every layer off and on again
const layers = await p.evaluate(()=>[...document.querySelectorAll('[data-layer]')].map(c=>c.dataset.layer));
let lbad = [];
for (const k of layers){ for (const pass of [0,1]){ await p.evaluate(k=>{ const c = document.querySelector('[data-layer='+k+']'); c.checked = !c.checked; c.dispatchEvent(new Event('change')); }, k); await frames(2); const e = await glErr(); if (e) lbad.push(k+':'+e); } }
ok(`layers (${layers.length}) toggle`, lbad.length === 0, lbad.join(' '));
// --- sun time and wind sliders
await p.evaluate(()=>{ for (const [id, v] of [['s-time', 7.5], ['s-time', 20.5], ['s-time', 13], ['s-wind', 1], ['s-wind', .3]]){ const el = document.getElementById(id); el.value = v; (el.oninput || (()=>el.dispatchEvent(new Event('input'))))(); } }); await frames(3);
ok('sun and wind sliders', (await glErr()) === 0);
// --- walking through rooms
await p.selectOption('#viewSel', 'room:1.05'); await frames(3);
{ const r = await p.evaluate(()=>{ const w = __d.walk; const x0 = w.pos.x; w.keys.w = true; for (let i=0;i<40;i++) window.__updateWalk(1/30); w.keys.w = false; return {moved:Math.abs(w.pos.x-x0)+Math.abs(w.pos.z)}; }); await frames(3);
  const c = await census(); ok('walk in the living room', c.calls > 30 && (await glErr()) === 0, JSON.stringify({calls:c.calls, tris:c.tris})); }
await p.selectOption('#viewSel', 'room:2.06'); await frames(3); ok('upper-floor room view', (await census()).calls > 30);
await p.selectOption('#viewSel', 'aerial'); await frames(3);
// --- edit mode: select, move, rebuild, duplicate, undo/redo
await p.evaluate(()=>document.getElementById('editToggle').click()); await frames(3);
{ const n0 = await p.evaluate(()=>__d.state().objects.length);
  const r = await p.evaluate(()=>{ const o = __d.state().objects.find(q=>q.type==='sauna_cube') || __d.state().objects[0]; o.x += .7; window.__rebuild(o); window.__openProps && window.__openProps(o.id); return {id:o.id, has:!!__d.meshById.get(o.id)}; }); await frames(3);
  ok('edit: rebuild an object', r.has && (await glErr()) === 0, r.id);
  const dup = await p.evaluate(()=>{ const b = document.getElementById('p-dup'); if (!b || b.offsetParent === null) return null; b.click(); return __d.state().objects.length; }); await frames(3);
  if (dup !== null){ ok('edit: duplicate', dup === n0 + 1, `${n0} → ${dup}`);
    await p.evaluate(()=>document.getElementById('undo').click()); await frames(3); ok('edit: undo', await p.evaluate(()=>__d.state().objects.length) === n0);
    await p.evaluate(()=>document.getElementById('redo').click()); await frames(2); await p.evaluate(()=>document.getElementById('undo').click()); await frames(2); }
  else console.log('note: duplicate button not shown; skipped'); }
await p.evaluate(()=>document.getElementById('editToggle').click()); await frames(3);
{ const B = await p.evaluate(()=>__d.batches ? {on:__d.batches.on, sources:__d.batches.sources.length} : null); ok('view mode again: batches on', !B || (B.on && B.sources > 100), JSON.stringify(B)); }
// --- animals and people animate
{ const a = await p.evaluate(()=>({x:__d.dog.group ? __d.dog.group.position.x : null})); await frames(12); const c = await census(); ok('animated figures present', c.skinned >= 5, 'skinned '+c.skinned); }
// --- top (orthographic) view and back
if (views.includes('top')){ await p.selectOption('#viewSel', 'top'); await frames(3); ok('top view', (await census()).calls > 10 && (await glErr()) === 0); await p.selectOption('#viewSel', 'aerial'); await frames(2); }
// --- resize
await p.setViewportSize({width:520, height:700}); await frames(3); ok('resize to portrait', (await census()).calls > 10 && (await glErr()) === 0);
await p.setViewportSize({width:720, height:440}); await frames(3);
// --- photo mode (path tracer) starts and exits
await p.evaluate(()=>document.getElementById('photo').click()); await p.waitForTimeout(9000);
{ const st = await p.textContent('#status'); ok('photo mode starts', /photo|render/i.test(st || ''), (st || '').slice(0,60));
  await p.evaluate(()=>document.getElementById('photo-exit').click()); await frames(4); const c = await census(); ok('photo mode exits back to the live view', c.calls > 30, JSON.stringify({calls:c.calls})); }
console.log('end', JSON.stringify(await census()));
console.log(`errors: ${errors}, failed checks: ${fail}`);
await b.close();
