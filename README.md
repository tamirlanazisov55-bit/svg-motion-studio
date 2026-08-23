# SVG Motion Studio

Standalone browser prototype for animating uploaded SVG files.

## Features
- Upload local SVG (client-side only)
- Sanitizes `script`, `foreignObject`, embedded frames/objects, inline event handlers and `javascript:` links
- Layer list for `g`, `path`, `rect`, `circle`, `ellipse`, `polygon`, `polyline`, `line`, and `text`
- Select a layer from the sidebar or by clicking it directly in the preview
- HEX text input + native color picker for all surface, glow, spark, and shader palettes
- Animated multi-color gradient with moving cloud/noise highlight
- Orbiting contour highlight rendered as a soft blurred glow (no crisp visible stroke)
- One-shot reveal from a point: clean, elastic, or scale + fade
- Spark intro: burst or clockwise cascade
- WebGL shader layer masked to the selected SVG element/group:
  - Strands
  - Galaxy
  - Prismatic Burst
  - Side Rays
  - Silk
- `Reset to ReactBits reference` restores each WebGL effect to its source visual defaults
- WebGL can run continuously inside the SVG or only during reveal
- Replay intro
- Preview on dark/light/alpha backgrounds
- Export a clean, self-contained HTML file with the configured SVG animation **and WebGL runtime**

## Run
Open `index.html` in a current Chromium/Chrome/Edge browser with WebGL2 enabled. No npm install, server, or external runtime dependency is required.

For deployment, serve the folder as a static site.

## React Bits reference shaders / license
The WebGL formulas for Strands, Galaxy, Prismatic Burst, Side Rays, and Silk are adapted from the corresponding open-source React Bits components by David Haz so their source defaults and motion character remain as close to the references as possible.

React Bits shader portions: Copyright (c) 2026 David Haz. Licensed under **MIT + Commons Clause License Condition v1.0**. The upstream license permits use/modification/distribution as part of an application, website, or product, but restricts selling/sublicensing/redistributing the components themselves as components or a ported component library.

Upstream: https://github.com/DavidHDev/react-bits
