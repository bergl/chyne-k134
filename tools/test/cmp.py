"""Compare two screenshot sets: python3 cmp.py base p1 high  -> per-view difference stats, writes side-by-side sheets for the worst."""
import sys, os, numpy as np
from PIL import Image
a, b, q = sys.argv[1], sys.argv[2], sys.argv[3]
thr = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
rows = []
for f in sorted(os.listdir('shots')):
    if not f.startswith(f'{a}_{q}_'): continue
    name = f[len(f'{a}_{q}_'):-4]; g = f'shots/{b}_{q}_{name}.png'
    if not os.path.exists(g): rows.append((name, None)); continue
    A = np.asarray(Image.open('shots/'+f).convert('RGB')).astype(np.int16); B = np.asarray(Image.open(g).convert('RGB')).astype(np.int16)
    if A.shape != B.shape: rows.append((name, 'size')); continue
    D = np.abs(A-B).max(axis=2); mean = float(np.abs(A-B).mean()); big = float((D > 24).mean()*100); mid = float((D > 8).mean()*100)
    rows.append((name, mean, mid, big))
    if big > thr:
        m = (D > 24); im = Image.new('RGB', (A.shape[1]*3, A.shape[0])); im.paste(Image.open('shots/'+f).convert('RGB'), (0,0)); im.paste(Image.open(g).convert('RGB'), (A.shape[1],0))
        heat = np.zeros_like(A, dtype=np.uint8); heat[...,0] = np.clip(D*4, 0, 255); heat[...,1] = np.clip(D, 0, 255); im.paste(Image.fromarray(heat), (A.shape[1]*2, 0))
        im.save(f'shots/cmp_{a}_{b}_{q}_{name}.png')
print(f'{a} vs {b} ({q}): mean abs diff | % pixels differing by >8 | by >24')
for r in rows:
    if r[1] is None: print(f'  {r[0]:10s} missing'); continue
    if r[1] == 'size': print(f'  {r[0]:10s} size differs'); continue
    print(f'  {r[0]:10s} {r[1]:6.2f} | {r[2]:6.2f}% | {r[3]:6.2f}%' + ('   <-- sheet written' if r[3] > thr else ''))
