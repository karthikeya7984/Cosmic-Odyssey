# COSMIC ODYSSEY

A self-contained 2D real-time arcade space shooter built with React, TypeScript, Vite, Tailwind CSS, and HTML5 Canvas. Its visuals feature a monochrome, hand-drawn-inspired line-art aesthetic with custom Web Audio sound effects.

## Features
- **Monochrome Hand-Drawn Space Art**: Custom procedural rendering of orbits, planets, stars, and ships on canvas.
- **Real-Time Flight Action**: Smooth 60fps physics, inertia steering, thrusters, collision detection, and screen shake.
- **Ship Garage**: Choose between 3 unique spacecraft:
  - **Explorer**: Balanced stats, reliable hull and speed.
  - **Phantom**: High speed, lighter hull.
  - **Titan**: Heavy armored hull, withstands heavy punishment.
- **Sector Campaign**:
  - **Sector 01**: The Quiet Belt (clear 8 hostiles)
  - **Sector 02**: Hostile Orbit (clear 12 hostiles)
  - **Sector 03**: The Sentinel (boss hostile with bullet barrage)
- **Salvage / Pickups**: Health (+30 hull), Shield (8s), Rapid fire (12s), Double shot (12s), Overdrive (12s), Score crystal (+150 pts).
- **Audio Synthesizer**: Custom retro sound effects generated dynamically via Web Audio API.
- **Responsive & Touch Support**: Full keyboard controls plus touch D-pad and action buttons for mobile devices.
- **Local Persistence**: Saves your high score, selected ship, sound settings, and achievements to `localStorage`.

## Controls
- **WASD / Arrow keys:** Move and steer
- **Space:** Fire lasers
- **Shift:** Boost (uses energy meter)
- **E:** Deflector shield (3s invulnerability, 14s cooldown)
- **Escape:** Pause / resume
- **Mouse Aiming:** Optional in Settings

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- npm

## Quick Start
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/`).

## Production Build
```bash
npm run build
npm run preview
```
