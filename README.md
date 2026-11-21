# Chýně K-134 Garden Studio

Interactive 3D model of house K-134 (Premonstrátů 1000, Chýně) and its garden, for planning a sauna, pool, planting and other garden projects.

**Built from:**
- **Building outline:** the 2021 geometric plan 1785-7/2021 (S-JTSK coordinates of the 8 corners).
- **Floors, heights, windows and rooms:** the sales drawings (D17), including the section and elevations.
- **Plot boundary:** digitised from the survey sketch (662 m² against the registered 657 m²).
- **Garden layout:** placed from the listing photos, accurate to about ±1 m.
- **Surrounding Chýně:** building outlines, streets, fields and green areas traced from the OpenStreetMap map (© OpenStreetMap contributors, ODbL). They are placed through the plot's S-JTSK points; the house's own outline in the map lands within 1.5 m of the model. Neighbouring houses of the same type (single, paired or in short rows) are drawn as copies of K-134. Other buildings are simple blocks with heights estimated from footprint size.

**Rendering:**
- **Quality levels:** Standard, High and Ultra, chosen in the Sun tab.
- **Seasons:** one picker in the toolbar. Autumn adds falling leaves and a leaf pile; winter adds snowfall, snow cover and a snowman. Layers can switch the weather off.
- **Lighting:** image-based lighting from the sky, with ambient occlusion (GTAO) on High and Ultra.
- **Glass and water:** windows and water reflect the garden live; Ultra adds true refraction.
- **Plants:** procedural trees and grass that sway in a wind you can adjust.
- **Walk inside:** the View selector lists every room. Pick one to stand in it, then drag to look around and walk with W A S D, the arrow keys or the on-screen buttons. Walls and furniture block the way, doorways let you through, and the stairs connect the floors.
- **Swimmer:** swims laps, then relaxes: leaning back against the end wall with arms over the coping, or floating on an inflatable lounger that drifts in the pool. The pool's properties choose Swims, then relaxes (default), Just relaxes, or Swims laps.
- **Furniture:** the living room and kitchen are furnished from the owners' photos (Nov 2026); the bedroom furniture comes from the sales plan. Every piece is an editable object.
  - Switch on Edit while standing in a room. Click a piece to select it, drag it to move it, Q / E rotates, right-click or long-press opens its properties, and Delete removes it.
  - **Kitchen:** greige handleless units with black granite tops. The island carries the induction hob, the espresso machine, paper towels, mills and mugs; the oak range hood and a two-tier black hanging shelf (basil, peace lily, jars, tins) hang from the black ceiling with its LED strips. The sink wall runs straight on from the black side-by-side fridge covered in magnets: drawers and doors under the granite top, the black niche with three oak wall cabinets over the black backsplash, the black tap, knife block, bottle and kettle, and the Bosch oven and microwave column by the garden door, with greige cabinets up to the ceiling.
  - **Dining:** live-edge oak table on black steel frames, six cream upholstered chairs, grey placemats and coasters, roses, a linear pendant, dark grey curtains, the kumquat in a blue pot, and on the wall the fish print and the striped shell canvas.
  - **Living room:** cream sofa with one long backrest, raised headrests and chrome legs facing the TV; an arm at the window end and the deep open chaise at the dining end, a cream fleece throw over the seats and blue velvet pillows. The reclaimed-wood coffee table (a framed top of weathered planks on black steel frames, with ribbed glass candle holders, mugs and a solitaire board) stands on a cream rug; the chaise bench and floor lamp are by the window, the wine fridge in the corner with the leaning olive-tree photo. The TV wall and the slat wall are painted greige; the oak slat panel carries three mesh pendants over the floating desk shelf and black drawers under a black bulkhead; the three-arm lamp hangs from the ceiling. The big blue boat painting hangs on a rope from a cleat next to the TV; below the TV a black floating shelf holds the soundbar, router and camera.
  - Pictures, curtains, shelves, the thermostat and the air conditioner snap flat onto the nearest wall when dragged; a picture can also lean against the wall on the floor. Each piece's properties change its size, style and colours.
  - Build → Indoors adds more right in front of you: sofa, armchair, pictures, curtains, hanging shelf, range hood, fridge, kitchen things, ceiling panels, wall colours and more.
  - The 65″ Samsung QE65S90C TV (1444.9 × 829.6 × 39.9 mm, no stand) hangs on the wall; dragged TVs snap flat onto the nearest wall.
  - Small fittings are drawn only when you are inside or the house is cut open, so the garden views stay fast.
  - In the cut-away views, upper-floor furniture goes with the upper floor and ceiling panels are left out, so the rooms can be seen from above.
- **Photo mode:** progressive accumulation of jittered frames (anti-aliasing and soft sun shadows); experimental path tracing with three-gpu-pathtracer.
- **Performance:**
  - **Loading:** a loading note with a progress bar shows while the model is built. The shader programs the first frame needs are compiled in the background (in parallel where the browser supports it) before the first frame; ambient occlusion and anti-aliasing compile after it and switch on when ready. The 3D engine is preloaded and minified, and the pictures for far-away houses are drawn only when first needed. If the engine is slow to arrive, cannot be loaded, or the browser has no WebGL 2, the note says so.
  - **Batching:** in view mode, the still parts of all objects that share a material are drawn as one mesh (about 200–350 draw calls for the whole scene instead of over 1,000). Edit mode shows the objects themselves, so everything stays editable; clicking an object for details works in both.
  - **Shadows:** the sun's shadow map of the still scene is kept and only redrawn when something changes. The moving figures (dog, cat, swimmer, ball) are patched into it every frame, so their shadows stay live without redrawing the garden.
  - **Ambient occlusion** is worked out from the depth of the picture already drawn, with no second drawing of the scene. It fades out with distance and is lighter on leaves and grass.
  - **Reflections** are refreshed one side of the cube per frame, so a change never stalls a frame.
  - Things inside the house cast sun shadows only when you are inside or the house is cut open; the car in the closed garage is not drawn from outside.
  - Where frames are slow while the view moves, the resolution drops and ambient occlusion and bloom pause until the camera rests.
  - The dog, cat, swimmer and lady are rigidly skinned, so each takes only a few draw calls.
  - Neighbouring houses use three levels of detail: the full house when close, a ~150-triangle model at middle distance, and impostors far away. Impostors are pictures rendered from 48 directions, storing colour and surface normals so they light correctly.
  - A quadtree is walked front to back each frame. It skips areas outside the view, and an occlusion horizon hides houses fully behind closer buildings. The horizon only hides what is farther away than the wall that drew it, and K-134 itself never hides anything, so houses stay visible through its windows and in cut-away views. Houses near the plot cast shadows through invisible stand-ins, so shadows never depend on the camera.
  - Layers → Performance stats shows FPS, draw calls, and how many houses are drawn at each level or culled.

**On phones:** the page has a proper mobile viewport, so it opens in the phone layout. It can be added to the home screen (Share → Add to Home Screen on iPhone, Install app on Android) and then runs full screen like an app.

The app is a single static `index.html` and uses Three.js 0.160, three-mesh-bvh 0.7.6 and three-gpu-pathtracer 0.0.23 from jsDelivr. To run it locally, open the file in a browser or serve the folder with any static server.

**Source layout:** `src/index.html` is the app as it is edited (a page fragment, the same file that is published as the claude.ai artifact). `python3 tools/build_pages.py` wraps it into the complete, installable `index.html` in the repository root that GitHub Pages serves. Adding `?debug` to the address switches shader error checks on; `?ao=geo` and `?shadow=full` switch back to the older ambient-occlusion and shadow paths for comparison.
