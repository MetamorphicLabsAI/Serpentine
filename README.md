# Serpentine 🐍

A highly stylized, neon outrun/cyberpunk-themed Snake Game.

## Overview
Serpentine is a modern re-imagining of the classic arcade game built strictly with Vanilla HTML, CSS, and JS. It requires no frameworks, plugins, or package managers. 

> [!IMPORTANT]
> **Check the [Field Manual](FIELD_MANUAL.md) for a complete list of features, character lore, unlockable entities, and secret system protocols.**

## Features 🚀
* 🎵 **Procedural Synthwave Synth**: A complete 38.4-second looping background track composed mathematically using the browser's native Web Audio API. Zero external MP3 downloads required! Includes driving basslines, arpeggiated synth melodies, kicks, and snares.
* ✨ **Particle Physics Collision Engine**: Eating food or dying erupts into dynamic, fading retro-neon particle explosions rendered beautifully at 60fps using `requestAnimationFrame`.
* 🕹️ **Arcade Mechanics**: Multi-directional logic built for keyboard (WASD/Arrows) and touch screens (fluid swipe gestures on mobile devices).
* 💾 **Persistent Memory**: Uses browser `localStorage` to permanently save your highest game score on your machine.
* 🎨 **Hardware Accelerated UI**: Built with scanline CSS overlays, breathing glow elements, game-over screen shake mechanics, and dynamic arcade cabinet color grading that shifts to match your selected snake profile.
* ⚙️ **Arcade OS Menu System**: A fully integrated main menu UI allowing seamless navigation between game modes, difficulty parameters, and character profiles.
* 🐍 **Selectable Snake Profiles**: Choose between different retro-cyberpunk characters like Glitch-Wave, Void Walker, or Mecha-Serpent with unique lore and custom, fully color-matched neon aesthetics.
* 🔓 **Unlockable Mechanics**: Complete in-game milestones to permanently unlock exclusive profiles (like the shifting *Chromatic Punch* algorithm). Locked characters are shrouded in mystery as solid grey HUD silhouettes with '???' naming and yellow tactical unlock criteria displayed natively in their lore panels! Satisfying an unlock condition triggers a triumphant global synthesized audio chord alongside a full-spectrum particle eruption mid-gameplay.
* 🔥 **Dynamic Difficulty Modes**: Scale your challenge precisely across Easy (180ms tick rate), Medium (120ms tick rate), Hard (80ms tick rate), and Insane (50ms tick rate) speeds.
* 🏆 **Per-Difficulty Leaderboards**: Top 10 local high score boards tracked independently for each standard difficulty. Players enter 3-character initials (first, middle, last — blanks allowed) using arcade-style arrow key scrolling after qualifying.
* 🤫 **Hidden Entities**: Rumors persist of an exploit left behind by the original developer. Those who know the right sequence of numbers might find something that doesn't play by the rules... and if you go deep enough, you might just unlock *everything*.

## Controls
### Menu Navigation
- **Navigate Up/Down**: `W`/`S` or `↑`/`↓` Arrow Keys
- **Select / Confirm**: `Spacebar` or `Enter`
- **Go Back**: `Escape` or `Backspace`
- **Browse Characters**: `A`/`D` or `←`/`→` Arrow Keys

### In-Game
- **Move Snake**: `Arrow Keys` or `WASD`
- **Touch Devices**: Swipe directly on the game canvas

## Getting Started
1. Clone the repository to your local machine.
2. Double-click the `index.html` file to open it in any modern browser.
3. Turn up your volume and hit **INITIALIZE**.

## Tech Stack
* **HTML5 Canvas:** Fluid rendering using 2D Web API perfectly suited for 2D game grids.
* **Vanilla JavaScript:** Zero-dependency logic natively engineered for speed.
* **Web Audio API:** Custom sound engine utilizing layered `OscillatorNode`, `BiquadFilterNode`, and `GainNode` calculations producing authentic synth waves.
* **Vanilla CSS3:** Native keyframe animations, glow-boxing, and grid geometry.
