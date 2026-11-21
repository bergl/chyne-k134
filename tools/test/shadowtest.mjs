// The split shadow map (kept still scene + movers) must equal a full redraw, texel for texel, while the animals move about.
import { chromium } from 'playwright-core';
import fs from 'fs';
const [page = 'test.html', N = '40'] = process.argv.slice(2);
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await (await b.newContext({viewport:{width:480,height:300}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR '+e.stack));
await p.goto('http://localhost:8765/'+page, {timeout:240000, waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__T && window.__T.frames >= 3, null, {timeout:300000});
await p.evaluate(()=>{ window.__freezeT = 1e6; document.querySelector('[data-q=standard]').click(); }); await p.selectOption('#seasonSel', process.env.SEASON || 'summer'); await p.waitForTimeout(3000);
const frames = (n)=>p.evaluate((n)=>new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
await p.evaluate(()=>{ const R = __d.renderer, gl = R.getContext(), S = __d.shadowSplit;
  const read = ()=>{ const map = __d.sun.shadow.map, fbo = R.properties.get(map).__webglFramebuffer, px = new Uint8Array(map.width*map.height*4);
    const prev = R.getRenderTarget(); R.setRenderTarget(map); gl.readPixels(0, 0, map.width, map.height, gl.RGBA, gl.UNSIGNED_BYTE, px); R.setRenderTarget(prev); return px; };
  const readRT = (rt)=>{ const px = new Uint8Array(rt.width*rt.height*4); const prev = R.getRenderTarget(); R.setRenderTarget(rt); gl.readPixels(0, 0, rt.width, rt.height, gl.RGBA, gl.UNSIGNED_BYTE, px); R.setRenderTarget(prev); return px; };
  window.__shadowCheck = ()=>{ const a = read(), cache0 = S.cache ? readRT(S.cache) : null;                                   // what the split path left in the map this frame
    const on = S.on; S.on = false; R.shadowMap.needsUpdate = true; R.setRenderTarget(null); R.render(__d.scene, __d.camera());   // the same instant, drawn in full
    const b2 = read(); S.on = on; S.staticDirty = true;
    let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; const W = __d.sun.shadow.map.width;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i+1] !== b2[i+1] || a[i+2] !== b2[i+2] || a[i+3] !== b2[i+3]){ n++; const k = i/4, x = k % W, y = (k - x)/W; x0 = Math.min(x0,x); x1 = Math.max(x1,x); y0 = Math.min(y0,y); y1 = Math.max(y1,y); }
    let extra = 0, missing = 0, other = 0; const white = (p, k)=>p[k]===255&&p[k+1]===255&&p[k+2]===255&&p[k+3]===255;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i+1] !== b2[i+1] || a[i+2] !== b2[i+2] || a[i+3] !== b2[i+3]){ const wa = white(a, i), wb = white(b2, i); if (wa && !wb) missing++; else if (!wa && wb) extra++; else other++; }
    // the still scene on its own, drawn now: is the kept copy still what the still scene looks like?
    const vis = [__d.dog, __d.cat].map(o=>o.group ? o.group.visible : null);
    let samples = [], cacheVsA = 0, cacheVsB = 0;
    if (cache0) for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i+1] !== b2[i+1] || a[i+2] !== b2[i+2] || a[i+3] !== b2[i+3]){
      const eqA = cache0[i]===a[i]&&cache0[i+1]===a[i+1]&&cache0[i+2]===a[i+2]&&cache0[i+3]===a[i+3], eqB = cache0[i]===b2[i]&&cache0[i+1]===b2[i+1]&&cache0[i+2]===b2[i+2]&&cache0[i+3]===b2[i+3];
      if (eqA) cacheVsA++; if (eqB) cacheVsB++; if (samples.length < 4){ const k = i/4; samples.push({x:k % W, y:(k - k % W)/W, split:[a[i],a[i+1],a[i+2],a[i+3]].join('.'), full:[b2[i],b2[i+1],b2[i+2],b2[i+3]].join('.'), cache:[cache0[i],cache0[i+1],cache0[i+2],cache0[i+3]].join('.')}); } }
    window.__last = {extra, missing, other, splitEqualsCache:cacheVsA, fullEqualsCache:cacheVsB, samples};
    let png = null;
    if (n){ const m = 50, cx0 = Math.max(0, x0-m), cy0 = Math.max(0, y0-m), cw = Math.min(W, x1+m) - cx0, ch = Math.min(W, y1+m) - cy0, c = document.createElement('canvas'); c.width = cw*3; c.height = ch; const g = c.getContext('2d'), im = g.createImageData(cw*3, ch);
      const depth = (px, k)=>px[k]/255 + px[k+1]/65025;   // packed depth, coarse
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++){ const k = ((cy0+y)*W + cx0 + x)*4, o = ((ch-1-y)*cw*3 + x)*4, da = a[k+3], db = b2[k+3];
        const va = 255 - Math.min(255, (a[k]+a[k+1]+a[k+2]+a[k+3]) % 256), vb = 255 - Math.min(255, (b2[k]+b2[k+1]+b2[k+2]+b2[k+3]) % 256);
        const sa = (a[k]===255&&a[k+1]===255&&a[k+2]===255&&a[k+3]===255) ? 255 : 60, sb = (b2[k]===255&&b2[k+1]===255&&b2[k+2]===255&&b2[k+3]===255) ? 255 : 60;
        im.data[o] = im.data[o+1] = im.data[o+2] = sa; im.data[o+3] = 255;
        const o2 = o + cw*4; im.data[o2] = im.data[o2+1] = im.data[o2+2] = sb; im.data[o2+3] = 255;
        const o3 = o + cw*8, df = (a[k]!==b2[k]||a[k+1]!==b2[k+1]||a[k+2]!==b2[k+2]||a[k+3]!==b2[k+3]); im.data[o3] = df ? 255 : 0; im.data[o3+1] = df ? 60 : 0; im.data[o3+2] = 0; im.data[o3+3] = 255; }
      g.putImageData(im, 0, 0); g.strokeStyle = '#0f0'; for (const r of S.rects){ for (const off of [0, cw, cw*2]) g.strokeRect(r[0]-cx0+off, ch-(r[3]-cy0), r[2]-r[0], r[3]-r[1]); }
      const big = document.createElement('canvas'); big.width = c.width*4; big.height = c.height*4; const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height); png = big.toDataURL('image/png'); }
    return {diff:n, box:n ? [x0,y0,x1,y1] : null, full:S.full, part:S.part, rects:S.rects.map(r=>r.join(',')), png, kind:window.__last}; };
});
console.log('split on:', await p.evaluate(()=>__d.shadowSplit.on), 'ladies:', await p.evaluate(()=>__d.ladies.size));
let bad = 0;
for (let i = 0; i < +N; i++){
  await frames(7);                                                                 // let the animals move for a few frames on the split path
  const r = await p.evaluate(()=>window.__shadowCheck());
  if (r.diff){ bad++; console.log(`check ${i}: ${r.diff} texels differ ${JSON.stringify(r.kind)}, box ${r.box}; rects ${r.rects.join(' | ')}`); if (r.png && bad <= 3) fs.writeFileSync(`shadowdiff_${process.env.RUN||''}_${bad}.png`, Buffer.from(r.png.split(',')[1], 'base64')); }
  if (i % 10 === 0) console.log(`check ${i}: diff ${r.diff}, full renders ${r.full}, mover updates ${r.part}, rects ${r.rects.length}`);
  if (i === 12) await p.evaluate(()=>{ const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); const ev = (t)=>c.dispatchEvent(new PointerEvent(t, {clientX:r.left+r.width*.45, clientY:r.top+r.height*.62, bubbles:true, pointerId:1, button:0})); ev('pointerdown'); ev('pointerup'); });   // throw the ball: the dog runs
}
console.log(`${N} checks: ${bad} with differences`);
await b.close();
