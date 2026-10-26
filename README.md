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
- **Photo mode:** progressive accumulation of jittered frames (anti-aliasing and soft sun shadows); experimental path tracing with three-gpu-pathtracer.
- **Performance:**
  - Parts that share a material are merged into one mesh. The dog, cat, swimmer and lady are rigidly skinned, so each takes only a few draw calls.
  - The sun's shadow map is redrawn only when something changes.
  - While the view moves, ambient occlusion and bloom pause, and the resolution drops if frames are slow.
  - Neighbouring houses use three levels of detail: the full house when close, a ~150-triangle model at middle distance, and impostors far away. Impostors are pictures pre-rendered from 48 directions, storing colour and surface normals so they light correctly.
  - A quadtree is walked front to back each frame. It skips areas outside the view, and an occlusion horizon hides houses fully behind closer buildings. Houses near the plot cast shadows through invisible stand-ins, so shadows never depend on the camera.
  - Layers → Performance stats shows FPS, draw calls, and how many houses are drawn at each level or culled.

**On phones:** the page has a proper mobile viewport, so it opens in the phone layout. It can be added to the home screen (Share → Add to Home Screen on iPhone, Install app on Android) and then runs full screen like an app.

The app is a single static `index.html` and uses Three.js 0.160, three-mesh-bvh 0.7.6 and three-gpu-pathtracer 0.0.23 from jsDelivr. To run it locally, open the file in a browser or serve the folder with any static server.
