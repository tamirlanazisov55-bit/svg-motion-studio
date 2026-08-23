# Star Shader Lab

Browser-based WebGL playground for the Tribute star mark.

## Current structure
- Fixed Tribute star + visible wordmark
- Base WebGL shader inside the star
- Stackable WebGL overlay layers
- GradFlow-inspired gradient family: Aurora, Mesh, Smoke, Wave, Animated, Conic, Stripe, Silk, Linear
- Chromatic Shadow as an external silhouette effect
- ReactBits-style directional Border Glow
- Clean intro animation without path deformation
- Pointer-driven perspective hover on the star
- JSON preset import/export

## Run locally
Open `index.html` in a modern Chromium-based browser with WebGL2 enabled.

## Deployment
The repository includes `.github/workflows/pages.yml` so pushes to `main` automatically publish the current `index.html`, `styles.css`, `app.js`, and `shaders.js` once GitHub Pages is enabled for the repository.
