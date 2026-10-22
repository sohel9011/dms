# DMS RUN - 3D Endless Runner Game

**DMS RUN** is a high-speed, original 3D endless runner game inspired by classic subway runners, built with React, Three.js, and Tailwind CSS.

## Features
- **3-Lane Gameplay**: Smooth, responsive lane transitions with lateral banking physics.
- **Dynamic Acrobatics**:
  - **Jump**: Leap over low hurdles and jump onto subway train rooftops to collect high-altitude coin arcs.
  - **Slide**: Duck low under overhead warning gantries, or fast-dive slam to the ground when in mid-air.
- **Original 3D Procedural Assets**:
  - Multi-part procedural runner character ("DMS Sprinter") with running, jumping, sliding, and lateral tilt animations.
  - Modular railway tracks, sleepers, neon lane guides, overhead signal gantries, and procedural skyscrapers.
  - Original obstacles: subway trains (with climbable roofs), hazard hurdles, overhead clearance gantries, and roadblocks.
- **Power-Ups**:
  - **Coin Magnet**: Magnetic pull drawing all nearby gold coins toward you.
  - **2X Multiplier**: Doubles your score accumulation rate and collected coins.
  - **Energy Shield**: Absorbs one fatal collision with explosive shatter effects and brief invulnerability.
  - **Super Spring**: High-altitude jumps over full trains and obstacles.
- **Runner Suits Shop**: Unlockable outfits (*DMS Cyber Sprinter*, *Sunset Blaze*, *Acid Volt*, *Gold Monarch*) purchased with collected coins.
- **Audio Synthesizer**: 100% procedural Web Audio API music and SFX with zero external audio file dependencies.
- **Dual Controls**:
  - **Desktop**: Arrow keys or `W`/`A`/`S`/`D` or `Space` (jump) + `P`/`Esc` (pause).
  - **Mobile**: Touch swipes (left, right, up, down) and on-screen directional touch buttons.
- **Persistent Progress**: Best score, longest distance, lifetime coins, and unlocked suits saved in `localStorage`.

---

## Publishing Instructions

### Local Development
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### Build for Production
```bash
npm run build
```
The compiled, optimized production files will be generated in the `dist/` directory.

### Deploying to GitHub Pages
1. In `vite.config.ts`, if your repository is hosted at `https://<username>.github.io/<repo-name>/`, set the base path:
   ```ts
   export default defineConfig({
     base: './', // Ensures relative asset paths
     // ...
   });
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder using GitHub Actions or `gh-pages`:
   ```bash
   npx gh-pages -d dist
   ```

### Deploying to Vercel or Netlify
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
