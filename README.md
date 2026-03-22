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
* ⚙️ **Character Options UI**: Advanced profiles (like Princess or Centipede) now feature a secondary **OPTIONS** layer. Toggle between 'Realistic' and 'Serpentine' play styles for the dog, or cycle through multiple custom skins for the Centipede. This allows for deep personalization without leaving the arcade dashboard.
* 🔓 **Unlockable Mechanics**: Complete in-game milestones to permanently unlock exclusive profiles (like the shifting *Chromatic Punch* algorithm). Locked characters are shrouded in mystery as solid grey HUD silhouettes with '???' naming and yellow tactical unlock criteria displayed natively in their lore panels! Satisfying an unlock condition triggers a triumphant global synthesized audio chord alongside a full-spectrum particle eruption mid-gameplay.
* 🔥 **Dynamic Difficulty Modes**: Scale your challenge precisely across Easy (180ms tick rate), Medium (120ms tick rate), Hard (80ms tick rate), and Insane (50ms tick rate) speeds.
* 🏆 **Per-Difficulty Leaderboards**: Top 10 local high score boards tracked independently for each standard difficulty. Players enter 3-character initials (first, middle, last — blanks allowed) using arcade-style arrow key scrolling after qualifying.
* 🤫 **Hidden Entities**: Rumors persist of an exploit left behind by the original developer. Those who know the right sequence of numbers might find something that doesn't play by the rules... and if you go deep enough, you might just unlock *everything*.
* 🏦 **System Shop & Point Bank**: Every point earned across all game sessions is saved to your persistent browser-based Point Bank. Spend your fortune in the System Shop to decrypt classified entities, hints, and new game modes.

## 📂 Documentation Matrix
For deep-dives into the game's architecture, legal standing, and future roadmap, refer to the following:

- 🐍 **[Field Manual](FIELD_MANUAL.md)**: Full character lore, unlock guides, and secret system protocols.
- 🧪 **[Concepts Lab](concepts.md)**: Detailed mechanics for advanced modes like Sentinel Breach (v2.0) and Neural Fit.
- 📈 **[Pricing strategy](PRICING_STRATEGY.md)**: Market analysis and commercial expansion roadmap ($5–$15 tier).
- ⚖️ **[Legal Audit](LEGAL_OBSERVATIONS.md)**: Full IP review of the "Zero-Asset" procedural architecture.
- 📜 **[Commercial License](LICENSE.md)**: The Five Dollar Games (FDG) proprietary license agreement.
- 🎵 **[Audio Manifest](AUDIO_MANIFEST.md)**: Full breakdown of procedural synth tracks and tactical sound effects.

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
1. **Clone the Repo**: Download the source code to your machine.
2. **Launch a Local Server (Required)**: Modern browsers restrict `localStorage` and dynamic audio when running from `file://` URLs.
   - **Using Node:** `npx serve`
   - **Using Python:** `python -m http.server 8000`
   - **Using VS Code:** Install the **Live Server** extension.
3. **Initialize the OS**: Open the `localhost` URL provided by the server and click **INITIALIZE**.

### 🛡️ Browser Security Note
If you see **"CORS"** or **"Unsafe attempt to load URL"** errors, it's because you are trying to open the `index.html` file directly. Always use the local server steps above to ensure the game saves your progress and plays audio correctly.

### 🔄 Live Updates & Refreshes
You do **not** need to reboot your local server to see code changes. Simply save your files and perform a **Hard Refresh** in your browser to bypass the cache:
- **Windows/Linux**: `Ctrl + Shift + R` (or `Ctrl + F5`)
- **Mac**: `Cmd + Shift + R`

## Tech Stack
* **HTML5 Canvas:** Fluid 60fps rendering using native 2D Web API.
* **Vanilla JavaScript:** Zero-dependency game logic.
* **Web Audio API:** Custom procedural synth engine for zero-asset music and SFX.
* **Vanilla CSS3:** Modern neon aesthetics with glassmorphism and scanline shaders.
