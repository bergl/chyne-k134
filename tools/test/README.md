# Regression tests

Headless-browser checks for `src/index.html` (Playwright + Chromium with the software renderer).

```
cd tools/test
npm install                      # playwright-core, three, three-mesh-bvh, three-gpu-pathtracer (served locally instead of the CDN)
python3 -m http.server 8765 &    # the pages are loaded from http://localhost:8765/
./mk.sh                          # builds test.html (shader checks on), test_prod.html (as shipped) with debug hooks
node func.mjs                    # every view, cut, season, quality, layer, edit and photo path; 0 errors expected
node batchtest.mjs test.html standard   # view-mode batches look exactly like the objects, stay clickable (also: high)
node shadowtest.mjs test.html 34 # kept shadow map + movers equals a full redraw, texel for texel
node blitcheck.mjs               # the shadow copies raise no GL errors
node nbtest.mjs test.html 260 7  # neighbour houses never disappear: occlusion culling on vs off over hundreds of poses
node boottest.mjs                # loading note: normal load, engine late, engine blocked, no WebGL
node phototest.mjs test.html new high   # photo mode finishes without GL errors (compare with a baseline build)
node shots.mjs new high test.html       # deterministic screenshots of 21 views; python3 cmp.py base new high compares two sets
node lab_start.mjs test_prod.html 1280 800 1 0   # start-up timeline
```

Chromium is expected at `/opt/pw-browsers/chromium` (change `executablePath` in the scripts otherwise).
To compare against an older version, build it into `test_base.html` the same way and run `shots.mjs base …`.
Compare screenshots at **both** Standard and High: they use different render paths.
