# Chýně K-134 Garden Studio

Interactive 3D model of house K-134 (Premonstrátů 1000, Chýně) and its garden, for planning a sauna, pool, planting and other garden projects.

**Built from:**
- **Building outline:** the 2021 geometric plan 1785-7/2021 (S-JTSK coordinates of the 8 corners).
- **Floors, heights, windows and rooms:** the sales drawings (D17), including the section and elevations.
- **Plot boundary:** digitised from the survey sketch (662 m² against the registered 657 m²).
- **Garden layout:** placed from the listing photos, accurate to about ±1 m.

**Rendering:**
- **Quality levels:** Standard, High and Ultra, chosen in the Sun tab.
- **Lighting:** image-based lighting from the sky, with ambient occlusion (GTAO) on High and Ultra.
- **Glass and water:** windows reflect the garden live; glass and water are refractive.
- **Plants:** procedural trees and grass that sway in a wind you can adjust.
- **Photo mode:** progressive accumulation of jittered frames (anti-aliasing and soft sun shadows); experimental path tracing with three-gpu-pathtracer.

The app is a single static `index.html` and uses Three.js 0.160, three-mesh-bvh 0.7.6 and three-gpu-pathtracer 0.0.23 from jsDelivr. To run it locally, open the file in a browser or serve the folder with any static server.
