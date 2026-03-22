# Neon Snake Arcade 🐍

A highly stylized, neon outrun/cyberpunk-themed Snake Game.

## Overview
Neon Snake Arcade is a modern re-imagining of the classic arcade game built strictly with Vanilla HTML, CSS, and JS. It requires no frameworks, plugins, or package managers. 

## Features 🚀
* 🎵 **Procedural Synthwave Synth**: A complete 38.4-second looping background track composed mathematically using the browser's native Web Audio API. Zero external MP3 downloads required! Includes driving basslines, arpeggiated synth melodies, kicks, and snares.
* ✨ **Particle Physics Collision Engine**: Eating food or dying erupts into dynamic, fading retro-neon particle explosions rendered beautifully at 60fps using `requestAnimationFrame`.
* 🕹️ **Arcade Mechanics**: Multi-directional logic built for keyboard (WASD/Arrows) and touch screens (fluid swipe gestures on mobile devices).
* 💾 **Persistent Memory**: Uses browser `localStorage` to permanently save your highest game score on your machine.
* 🎨 **Hardware Accelerated UI**: Built with scanline CSS overlays, breathing glow elements, game-over screen shake mechanics, and smooth neon color grading matching the retro 80s arcade aesthetic.

## Controls
- **Start/Restart**: `Spacebar`, `Enter`, or click/tap the button.
- **Move**: `Arrow Keys`, `WASD`, or **Swipe directly on touchscreen displays.**

## Getting Started
1. Clone the repository to your local machine.
2. Double-click the `index.html` file to open it in any modern browser.
3. Turn up your volume and hit **INITIALIZE**.

## Tech Stack
* **HTML5 Canvas:** Fluid rendering using 2D Web API perfectly suited for 2D game grids.
* **Vanilla JavaScript:** Zero-dependency logic natively engineered for speed.
* **Web Audio API:** Custom sound engine utilizing layered `OscillatorNode`, `BiquadFilterNode`, and `GainNode` calculations producing authentic synth waves.
* **Vanilla CSS3:** Native keyframe animations, glow-boxing, and grid geometry.
