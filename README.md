# 🐍 SERPENTINE OS

```
    ╔═══════════════════════════════════════════════════════════════════╗
    ║  ██████╗ ██╗███╗   ██╗███████╗██╗  ██╗    ██╗  ██╗██╗   ██╗███╗   ██╗ ╚██████╗║
    ║  ██╔══██╗██║████╗  ██║██╔════╝╚██╗██╔╝    ██║  ██║██║   ██║████╗  ██║  ╚══██║║
    ║  ██║  ██║██║██╔██╗ ██║███████╗ ╚███╔╝     ███████║██║   ██║██╔██╗ ██║     ██║║
    ║  ██║  ██║██║██║╚██╗██║╚════██║ ██╔██╗     ██╔══██║██║   ██║██║╚██╗██║     ██║║
    ║  ╚█████╔╝██║██║ ╚████║███████║██╔╝ ██╗    ██║  ██║╚██████╔╝██║ ╚████║     ██║║
    ║   ╚════╝ ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═╝║
    ╚═══════════════════════════════════════════════════════════════════╝
                    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
                   ╱░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╲
                  ║   A CYBERPUNK SNAKE ARCADE EXPERIENCE               ║
                   ╲_____________________________________________________╱
```

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Browser](https://img.shields.io/badge/browser-Chrome%7CFirefox%7CEdge%7CSafari-green.svg)
![No Dependencies](https://img.shields.io/badge/dependencies-zero-yellow.svg)
![Web Audio](https://img.shields.io/badge/audio-Web%20Audio%20API-purple.svg)
![Platform](https://img.shields.io/badge/platform-browser%20%7C%20mobile%20%7C%20desktop-pink.svg)

---

## 🎮 WHAT IS SERPENTINE?

**Serpentine OS** is a cyberpunk-themed snake arcade game that transforms the classic snake formula into a full-featured gaming experience. Navigate neon-lit grids, manipulate time itself, defend against hostile sentinels, and battle friends in intense 2-player duels—all with a procedurally generated soundtrack that adapts to your playstyle.

Built entirely with vanilla JavaScript, HTML5 Canvas, and the Web Audio API. **Zero external dependencies. Zero assets. Pure code.**

### Visual Style
```
    ┌─────────────────────────────────────────────────────────┐
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
    │  ▓  CYBERPUNK GRID   ▓  DEEP AMBIENT AUDIO   ▓        │
    │  ▓  Neon Colors      ▓  Procedural SFX      ▓        │
    │  ▓  CRT Effects       ▓  Dynamic Music       ▓        │
    │  ▓  Particle Systems  ▓  Adaptive BPM        ▓        │
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
    └─────────────────────────────────────────────────────────┘
```

---

## 🚀 QUICK START

```bash
# No installation required - just open in any modern browser!
cd Serpentine
open index.html
```

**That's it.** No npm, no build step, no dependencies. Pure HTML, CSS, and JavaScript.

> [!IMPORTANT]
> For full functionality (saves, audio), serve via a local server:
> ```bash
> npx serve
> # or
> python -m http.server 8000
> ```

---

## 🎯 GAME MODES

### 1. STANDARD MODE
```
┌─────────────────────────────────────┐
│  ████  CLASSIC SNAKE ARCADE  ████  │
│                                     │
│  🍎 → 🐍 → 🐍🐍 → 🐍🐍🐍 → ...     │
│                                     │
│  EAT • GROW • SURVIVE              │
└─────────────────────────────────────┘
```
**Classic snake gameplay perfected.** Collect glowing food orbs, grow your serpentine form, and avoid collisions. Choose your difficulty:
- **Easy** - 180ms tick rate
- **Medium** - 120ms tick rate
- **Hard** - 80ms tick rate
- **Insane** - 50ms tick rate

---

### 2. CHRONOSHIFT ⏱️
```
╔═══════════════════════════════════════╗
║  TEMPORAL MANIPULATION ACTIVATED       ║
║  ┌─────────────────────────────────┐   ║
║  │  [Q] REWIND   - Go back 5 sec   │   ║
║  │  [W] SLOW-MO  - 0.5x speed      │   ║
║  │  [E] FAST-FWD - 2x speed        │   ║
║  │  [R] PULSE    - Time explosion   │   ║
║  └─────────────────────────────────┘   ║
║  ████████░░░░░░ CHRONO-METER ░░░░░░░   ║
╚═══════════════════════════════════════╝
```
**Master time itself.** Manage your Chrono-Meter and use temporal powers strategically. Each ability drains your temporal energy—use them wisely or be trapped in a time loop of your own making.

---

### 3. SENTINEL BREACH 🛡️
```
┌──────────────────────────────────────────┐
│  ⚠️ WAVE 15 INCOMING ⚠️                   │
│                                          │
│  NEXUS: ████████████░░░░ 75%            │
│                                          │
│  HOSTILES:                               │
│  ├─ PROBE   ▪▪▪▪▪▪▪▪▪▪  (10)           │
│  ├─ SWARMER ▪▪▪▪▪▪ (6)                 │
│  ├─ HUNTER  ▪▪▪ (2)                     │
│  └─ TITAN   ▪ (1)                       │
└──────────────────────────────────────────┘
```
**Defend the Nexus.** Your snake is humanity's last defense against hostile sentinels. Each wave brings more enemies—probes, swarmers, hunters, and the devastating Titan class.

---

### 4. GRID WARFARE ⚔️
```
┌────────────────────────────────────────┐
│       PLAYER 1        VS        PLAYER 2│
│         ████              ████        │
│        ██████            ██████       │
│  SCORE: 247          SCORE: 189       │
│  ROUNDS WON: 2       ROUNDS WON: 1   │
│                                        │
│         [FIRST TO 5 WINS]             │
└────────────────────────────────────────┘
```
**Snake meets combat.** 1v1 or 2v2 local multiplayer. First to 5 round wins. Can be played against AI with selectable difficulty. Choose your character and dominate your opponent.

---

### 5. FIREWALL BREACH 🔥
```
┌───────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓                                  ▓  │
│  ▓    THE FIREWALL IS SHRINKING    ▓  │
│  ▓                                  ▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│         EAT TO PUSH IT BACK          │
└───────────────────────────────────────┘
```
**Outrun the collapse.** The deadly Firewall is closing in. Eat food to push it back—or be consumed. Every second counts.

---

### 6. Trace Protocol 🧠
```
┌─────────────────────────────────────┐
│  ╭─────────────────────────────╮    │
│  │   ARCHETYPE MATCHING MODE   │    │
│  │                             │    │
│  │    ┌───┐    ┌───┐          │    │
│  │    │ ↓ │ →  │ ↓ │  MATCH!  │    │
│  │    └───┘    └───┘          │    │
│  │                             │    │
│  │  ACCURACY: 94.2%            │    │
│  │  DRILL: SPIRAL              │    │
│  ╰─────────────────────────────╯    │
└─────────────────────────────────────┘
```
**Reflex training simulator.** Shape-matching puzzle mode. Six drill types: WARMUP, FIGURE-8, ZIGZAG, SPIRAL, WAVE, GAUNTLET. Train your reflexes and track your accuracy.

---

## 👤 CHARACTER ROSTER

### Default Characters (Unlocked from Start)

| Character | Color | Special Mechanic |
|-----------|-------|------------------|
| **NEON PROTOCOL** | `#00ffcc` | The classic starter |
| **VOID WALKER** | `#8a2be2` | Shadow prince |
| **GOLD-FI** | `#ffd700` | Shiny and sleek |
| **GLITCH-WAVE** | `#ff0055` | Digital chaos |
| **MECHA-SERPENT** | `#708090` | Robotic precision |

---

### Unlockable Characters

| Character | Color | Unlock Method | Special Mechanic |
|-----------|-------|---------------|------------------|
| **CHROMATIC PUNCH** | Rainbow | Eat 20 food in Standard | Color cycle shift |
| **9193** | `#ffd700` | Hold 9 key for 9 seconds | Fixed 9 segments, cheater mode |
| **PRINCESS** | `#8B4513` | Shop (50,000 PTS) | Character options |
| **ARTHROPOD** | `#39FF14` | Shop (75,000 PTS) | Skin selection |
| **KITE DRAGON** | `#FF4500` | Shop (100,000 PTS) | Dragon aesthetic |
| **CRIMSON FANG** | `#8B0000` | Eat 30 food | Angular head |
| **COBALT GRID** | `#0047AB` | Eat 40 food | Geometric style |
| **EMERALD CORE** | `#00FF00` | Eat 50 food | Organic flow |
| **VOID STAR** | `#000000` | Eat 60 food | Strobe effect, inverted |
| **PLASMA HYDRA** | `#FF4500` | Eat 70 food | Multi-head |
| **MONOCHROME** | `#FFFFFF` | Eat 80 food | Retro style |
| **MOLTEN CORE** | `#FF8C00` | Eat 90 food | Ember particles |
| **TITANIUM COIL** | `#C0C0C0` | Eat 100+ food | Metallic sheen |
| **QUICKSILVER** | `#C0C0C0` | Standard under 60s | Speed lines |
| **PHOTON DASH** | `#FFFFFF` | Standard under 45s | Light streak |
| **MACH MACH** | `#ff0000` | Insane under 90s | Blur effect |
| **SONIC BOOM** | `#4488ff` | Hard under 60s | Afterimage |
| **QUANTUM LEAP** | `#ff00ff` | ChronoShift no rewind | Quantum pulse |
| **WARP PYTHON** | `#4a0080` | ChronoShift Insane <120s | Starlight trail |
| **FLASH PROTOCOL** | `#ffff00` | Sentinel Wave 20 | Flash effect |
| **AEGIS DEFENDER** | `#ffd700` | Survive 500s | Shield icon |
| **PHOENIX PROTOCOL** | `#ff4500` | Die/respawn 10x | Phoenix effect |
| **JUGGERNAUT** | `#8b4513` | Reach 200 segments | Massive size |
| **INFINITY SCALE** | `#ff00ff` | 100 Standard games | Prismatic |
| **ZENITH SERPENT** | `#e0e0e0` | Top 3 all leaderboards | Crown jewel |

---

### Secret Characters 🐍

| Character | Color | Unlock Method | Special Mechanic |
|-----------|-------|---------------|------------------|
| **NOKIA NOSTALGIA** | `#84B500` | Play 50 games | LCD style |
| **KONAMI CODE** | `#FF0000` | ↑↑↓↓←→←→BA | Konami style |
| **MISSINGNO** | `#FF00FF` | 500 consecutive deaths | Glitch, screen tear |
| **DOGECOIN** | `#D4A017` | Bank 10,000 PTS | Comic Sans, Shiba |
| **BINARY CONSTRICTOR** | `#00FF00` | Eat 500 total food | Matrix style |
| **THE DEV** | `#FFD700` | Unlock all 29 others | Crown jewel, golden |
| **ERROR 404** | `#888888` | Visit /#error404 | Flicker effect |
| **BLUE SCREEN** | `#0000AA` | Die 100 times | BSOD style |
| **SCANLINE SAMURAI** | `#FF0000` | Clear 10 Firewall levels | Katana tail |
| **SYNTHESIZER** | `#FF00FF` | Listen to 5 full songs | Audio reactive |

---

### Seasonal Characters 🎃

| Character | Color | Availability | Special Mechanic |
|-----------|-------|--------------|------------------|
| **PUMPKIN PROTOCOL** | `#ff6600` | October only | Jack-o-lantern |
| **FROST SERPENT** | `#aaddff` | December-January | Snowflake particles |
| **HEART CORE** | `#ff4466` | February 1-14 | Heart patterns |

---

### Character Variants

| Variant | Parent | Unlock Method | Special Mechanic |
|---------|--------|---------------|------------------|
| **NEON CLASSIC** | NEON PROTOCOL | Play 10 Neon games | Classic variant |
| **NEON PULSE** | NEON PROTOCOL | Play 25 Neon games | Pulse effect |
| **VOID SHADOW** | VOID WALKER | Play 10 Void games | Shadow effect |
| **VOID NOVA** | VOID WALKER | Play 25 Void games | Nova effect |
| **GLITCH CLASSIC** | GLITCH-WAVE | Play 10 Glitch games | Classic variant |
| **GLITCH DEBUG** | GLITCH-WAVE | Play 25 Glitch games | Debug effect |

---

## ⚡ POWER-UPS

| Power-Up | Color | Effect |
|----------|-------|--------|
| **SHIELD** | `#4488ff` | Absorbs one hit (wall/self collision) |
| **SPEED BOOST** | `#ffdd00` | Increases speed by 1.5x |
| **GHOST** | `#ffffff` | Phase through walls and self |
| **MAGNET** | `#aa44ff` | Pulls food toward snake |
| **DOUBLE EAT** | `#44ff88` | Eat twice the food, grow 2 segments |

---

## 🏆 ACHIEVEMENT SYSTEM

### MASTERY
```
┌────────────────────────────────────────────────────────┐
│  🎓 MASTERY                                              │
│  ├─ APPRENTICE   - Complete first Standard run          │
│  ├─ COMPETENT    - Reach 100 points on Medium           │
│  ├─ EXPERT       - Reach 500 points on Hard             │
│  ├─ MASTER       - Reach 1000 points on Insane         │
│  └─ LEGEND       - Reach 2000 points on Insane          │
└────────────────────────────────────────────────────────┘
```

### CHRONOSHIFT
```
┌────────────────────────────────────────────────────────┐
│  ⏱️ TEMPORAL MASTERY                                     │
│  ├─ TEMPORAL    - Complete a ChronoShift run           │
│  ├─ REWINDER    - Use rewind 5 times in one run        │
│  └─ TIMELORD    - Survive 5 minutes in ChronoShift     │
└────────────────────────────────────────────────────────┘
```

### COMBAT
```
┌────────────────────────────────────────────────────────┐
│  ⚔️ BATTLE HARDENED                                      │
│  ├─ GUARDIAN    - Clear Wave 10 Sentinel Breach       │
│  ├─ DEFENDER    - Clear Wave 25 Sentinel Breach        │
│  └─ LEGENDARY   - Clear Wave 50 Sentinel Breach        │
└────────────────────────────────────────────────────────┘
```

### COMPETITIVE
```
┌────────────────────────────────────────────────────────┐
│  🏅 DUELING                                               │
│  ├─ DUELIST     - Win a Grid Warfare match             │
│  ├─ CHAMPION    - Win 10 Grid Warfare matches          │
│  └─ UNDISPUTED  - Win 50 Grid Warfare matches          │
└────────────────────────────────────────────────────────┘
```

### COLLECTOR
```
┌────────────────────────────────────────────────────────┐
│  📦 COMPLETIONIST                                         │
│  ├─ COMPLETIST  - Unlock 10 characters                  │
│  ├─ HARDCORE    - Unlock 25 characters                  │
│  └─ EVERYTHING  - Unlock all 40 characters              │
└────────────────────────────────────────────────────────┘
```

### CHALLENGES
```
┌────────────────────────────────────────────────────────┐
│  🎯 SPECIALIST                                            │
│  ├─ PERFECTIONIST - Complete with 0 deaths              │
│  ├─ SPEEDRUNNER  - Complete Standard under 30 seconds  │
│  └─ UNDYING      - Use mercy 10 times in one day        │
└────────────────────────────────────────────────────────┘
```

---

## 💾 SAVE SYSTEM

Your progress is automatically saved locally. The save system includes:

- **Auto-save** - Progress saved after every game
- **Cloud-ready export** - JSON profile with all stats
- **Import/Export** - Share your profile or backup
- **Corruption recovery** - Automatic backup and restore
- **Preview modal** - Review data before importing

### Export Format
```json
{
  "version": "1.0",
  "exportedAt": "2026-05-31T00:00:00Z",
  "profile": {
    "totalGames": 0,
    "totalFood": 0,
    "totalDeaths": 0,
    "totalPTS": 0,
    "unlockedCharacters": [],
    "achievements": [],
    "dailyChallenges": [],
    "weeklyChallenges": [],
    "settings": {}
  }
}
```

---

## 🎮 CONTROLS

### Keyboard

| Action | Default Key |
|--------|-------------|
| **Move Up** | W / ↑ |
| **Move Down** | S / ↓ |
| **Move Left** | A / ← |
| **Move Right** | D / → |
| **Pause** | ESC / P |
| **Mercy/Continue** | M |
| **Rewind (ChronoShift)** | Q |
| **Slow-Mo (ChronoShift)** | W |
| **Fast-Forward (ChronoShift)** | E |
| **Pulse (ChronoShift)** | R |
| **Toggle Desktop Mode** | Shift + ESC |
| **Open Settings** | , (comma) |

### Mobile Touch Controls

```
┌─────────────────────────────────────┐
│                                     │
│           [ ▲ ]                     │
│                                     │
│      [ ◄ ]    [ ► ]                │
│                                     │
│           [ ▼ ]                     │
│                                     │
│  Semi-transparent D-Pad overlay    │
│  with configurable swipe sensitivity│
└─────────────────────────────────────┘
```

### Control Remapping

All controls are fully customizable via Settings. Bind any action to any key.

---

## 📖 HOW TO PLAY: STANDARD MODE

### The Core Loop

```
    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    │   1. START → Grid appears, snake spawns center    │
    │                                                     │
    │   2. MOVE  → Navigate with WASD or Arrow keys     │
    │                                                     │
    │   3. EAT   → Collect glowing food orbs            │
    │                                                     │
    │   4. GROW  → Each food = +1 segment               │
    │                                                     │
    │   5. AVOID → Don't hit walls or yourself!         │
    │                                                     │
    │   6. SCORE → More food = higher score             │
    │                                                     │
    │   7. DIE   → Game Over (unless Mercy available)  │
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

### Scoring

| Food Type | Points | Effect |
|-----------|--------|--------|
| Regular Food | 10 pts | +1 segment |
| Golden Food (rare) | 50 pts | +1 segment |
| Speed Food | 25 pts | Temporary speed boost |

### Difficulty Scaling

| Difficulty | Tick Rate | Food Spawn Rate | Special |
|------------|-----------|------------------|---------|
| **Easy** | 180ms | High | Forgiving |
| **Medium** | 120ms | Normal | Balanced |
| **Hard** | 80ms | Low | Challenging |
| **Insane** | 50ms | Very Low | Expert only |

---

## 🌟 SPECIAL FEATURES

### Daily & Weekly Challenges
- **20 unique daily challenge templates**
- **20 unique weekly challenge templates**
- Seed-based for fair competition
- Rewards: +25,000 PTS (daily), +100,000 PTS + exclusive character (weekly)

### Season Track
- **50 tiers** of progression
- Earn PTS toward rewards
- Unlock skins, character variants, audio tracks

### Meta-Progression Titles
```
┌────────────────────────────────────────────────────────┐
│  TITLES UNLOCK SEQUENCE                                 │
│                                                         │
│  1.  APPRENTICE         - First steps                  │
│  2.  JOURNEYMAN         - 10 games                      │
│  3.  COMPETENT          - 50 games                      │
│  4.  EXPERT             - 100 games                     │
│  5.  MASTER             - 250 games                     │
│  6.  GRANDMASTER         - 500 games                     │
│  7.  CHAMPION            - 1000 games                    │
│  8.  LEGEND              - 2500 games                   │
│  9.  SERPENTINE PIONEER  - All achievements             │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Profile Badges
Categories: mastery, combat, collector, speedrunner, survival

### Ghost Replay System
- Records last 3 runs
- Renders as transparent overlay
- Generates shareable base64 codes
- Watch replays at 8fps with pause/skip controls

### OS Desktop Mode
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────┐ ┌──────┐                    ┌──────┐ │
│  │ 🐍   │ │ ⚙️   │ │ 📊   │      SERPENTINE OS │ 12:34│ │
│  │ GAME │ │STNGS │ │STATS │                    │ PM   │ │
│  └──────┘ └──────┘ └──────┘                    └──────┘ │
│                                                         │
│   [Start Menu]  [Settings]  [Statistics]  [Credits]   │
│                                                         │
│   Shift + ESC to toggle                                │
└─────────────────────────────────────────────────────────┘
```
- Window-style desktop with program icons
- Taskbar with clock
- Clickable shortcuts

### Accessibility Options
- **Color blind modes**: Protanopia, Deuteranopia, Tritanopia
- **High contrast mode**
- **Reduced motion**
- **Screen reader support**
- **Customizable controls**
- **Touch D-Pad sensitivity options**

### Mercy System
Continue at half score after death. Limited uses per day.

---

## 🏗️ TECHNICAL ARCHITECTURE

### Zero-Asset Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ╔═══════════════════════════════════════════════════╗   │
│   ║              SERPENTINE OS ARCHITECTURE             ║   │
│   ╠═══════════════════════════════════════════════════╣   │
│   ║                                                       ║   │
│   ║   ┌─────────────────────────────────────────────┐   ║   │
│   ║   │              HTML LAYER                     │   ║   │
│   ║   │   Semantic structure, accessibility         │   ║   │
│   ║   └─────────────────────────────────────────────┘   ║   │
│   ║                       │                              ║   │
│   ║                       ▼                              ║   │
│   ║   ┌─────────────────────────────────────────────┐   ║   │
│   ║   │              CSS STYLING                    │   ║   │
│   ║   │   Cyberpunk theme, animations, effects     │   ║   │
│   ║   └─────────────────────────────────────────────┘   ║   │
│   ║                       │                              ║   │
│   ║                       ▼                              ║   │
│   ║   ┌─────────────────────────────────────────────┐   ║   │
│   ║   │           JAVASCRIPT LOGIC                  │   ║   │
│   ║   │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │   ║   │
│   ║   │  │ Canvas  │ │ Web     │ │  Game   │        │   ║   │
│   ║   │  │ Render  │ │ Audio   │ │ Engine  │        │   ║   │
│   ║   │  └─────────┘ └─────────┘ └─────────┘        │   ║   │
│   ║   └─────────────────────────────────────────────┘   ║   │
│   ║                                                       ║   │
│   ╚═══════════════════════════════════════════════════╝   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Procedural Audio Engine

The Web Audio API generates all sounds procedurally:

| Track | Characteristics |
|-------|----------------|
| **Menu** | 64-step loop, 175ms/step, deep drone + drop phase |
| **Game** | 256-step loop, 150ms/step, A minor progression (Am-F-C-G) |
| **Chrono Ambient** | Tense time-dilated mood, heartbeat, clock ticks |
| **Sentinel Combat** | Aggressive/distorted, alarm synth stabs |
| **Firewall Alarm** | Pulsing red alarm, compressed bass, static |
| **Neural Calm** | Meditative/flowing, soft pad, piano notes |
| **Victory Fanfare** | Triumphant chord sweep (3s) |
| **Game Over Requiem** | Melancholic descending chord (4s) |

### Sound Effects (20+)

```
┌────────────────────────────────────────────────────────┐
│  ⚡ POWERUP SPAWN      ⚡ MERCY ACTIVATE               │
│  ⚡ ACHIEVEMENT UNLOCK  ⚡ WAVE COMPLETE               │
│  ⚡ MODE TRANSITION     ⚡ BUTTON HOVER                 │
│  ⚡ CHARACTER UNLOCK    ⚡ EASTER EGG DISCOVERED        │
│  ⚡ REWIND              ⚡ SLOWMO ACTIVATE              │
│  ⚡ FASTFORWARD         ⚡ PULSE ACTIVATE               │
│  ⚡ NEXUS HUM           ⚡ SENTINEL SPAWN/DEATH        │
│  ⚡ CHRONO COLLECT      ⚡ FOOD SPAWN                   │
│  ⚡ EAT                 ⚡ DEATH                       │
│  ⚡ UNLOCK              ⚡ POWERUP                      │
│  ⚡ PRINCESS BARK                                    │
└────────────────────────────────────────────────────────┘
```

---

## 🌐 BROWSER REQUIREMENTS

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| **Chrome** | 66+ | Full support |
| **Firefox** | 61+ | Full support |
| **Edge** | 79+ | Full support |
| **Safari** | 14+ | Full support |
| **Opera** | 53+ | Full support |
| **Mobile Chrome** | 89+ | Touch controls |
| **Mobile Safari** | 14+ | Touch controls |

### Required Features
- HTML5 Canvas
- Web Audio API
- Local Storage
- ES6+ JavaScript

### Performance Notes
- 60 FPS gameplay on modern devices
- Optimized for 1920x1080, scales to any resolution
- Mobile-responsive touch controls
- Battery-efficient audio system

---

## 🎵 AUDIO TRACKS

### Main Soundtrack

| Track | Duration | Mood |
|-------|----------|------|
| **Menu** | Loop (64-step) | Deep, atmospheric |
| **Game** | Loop (256-step) | Driving, focused |
| **Chrono Ambient** | Loop | Tense, time-warped |
| **Sentinel Combat** | Loop | Aggressive, urgent |
| **Firewall Alarm** | Loop | Danger, pulse |
| **Neural Calm** | Loop | Peaceful, meditative |
| **Victory Fanfare** | 3s | Triumphant |
| **Game Over Requiem** | 4s | Melancholic |

### Unlockable Tracks
Earn 10 additional soundtrack tracks through season tiers.

---

## 📂 DOCUMENTATION

For deep-dives into the game's architecture and features, refer to:

- 🐍 **[Field Manual](FIELD_MANUAL.md)**: Full character lore, unlock guides, and secret system protocols.
- 🧪 **[Concepts Lab](concepts.md)**: Detailed mechanics for advanced modes like Sentinel Breach and Trace Protocol.
- 🎵 **[Audio Manifest](AUDIO_MANIFEST.md)**: Full breakdown of procedural synth tracks and tactical sound effects.
- ⚖️ **[Legal Audit](LEGAL_OBSERVATIONS.md)**: Full IP review of the "Zero-Asset" procedural architecture.

---

## 🤝 CONTRIBUTING

Contributions are welcome! Here's how to help:

### Development Setup
```bash
git clone https://github.com/yourusername/serpentine.git
cd serpentine
# Just open index.html in your browser - no build step needed!
```

### Areas for Contribution
- 🎨 New character designs and mechanics
- 🎵 Additional audio tracks and SFX
- 🌍 Translation/localization
- 📱 Mobile experience improvements
- ♿ Accessibility enhancements
- 🐛 Bug fixes and performance optimization
- 📖 Documentation improvements

### Code Style
- ES6+ JavaScript
- Semantic HTML5
- CSS custom properties for theming
- JSDoc comments for documentation

---

## 📄 LICENSE

```
MIT License

Copyright (c) 2026 Serpentine OS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🎮 QUICK REFERENCE

```
╔═══════════════════════════════════════════════════════════════════╗
║                         SERPENTINE OS                              ║
╠═══════════════════════════════════════════════════════════════════╣
║  Game Modes:     6 (Standard, ChronoShift, Sentinel, Grid,       ║
║                       Breach, Trace Protocol)                          ║
║  Characters:     49 (5 default + 44 unlockable/secret)          ║
║  Power-ups:       5                                                ║
║  Achievements:    20+ across 6 categories                          ║
║  Audio Tracks:    18 procedurally generated                       ║
║  Sound Effects:   20+ unique                                      ║
║  Platforms:       Browser, Mobile, Desktop                        ║
║  Dependencies:    ZERO                                           ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

**🐍 Slither. Evolve. Dominate.**

*Serpentine OS - Where classic arcade meets cyberpunk future.*
