# SERPENTINE — Full Game Expansion Masterplan
> **Document Status:** MASTERPLAN v1.0  
> **Classification:** LEVEL 10 ACCESS  
> **Date:** 2026-05-31  
> **Author:** Serpentine Development Team

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Vision: The Complete Serpentine OS](#3-vision-the-complete-serpentine-os)
4. [Phase 1: Foundation Polish (Sessions 1-4)](#4-phase-1-foundation-polish-sessions-1-4)
5. [Phase 2: Mode Expansion (Sessions 5-12)](#5-phase-2-mode-expansion-sessions-5-12)
6. [Phase 3: Content Depth (Sessions 13-20)](#6-phase-3-content-depth-sessions-13-20)
7. [Phase 4: Polish & Systems (Sessions 21-26)](#7-phase-4-polish--systems-sessions-21-26)
8. [Character Roster Master List](#8-character-roster-master-list)
9. [Audio Architecture](#9-audio-architecture)
10. [Save System & Persistence](#10-save-system--persistence)
11. [Visual Identity System](#11-visual-identity-system)
12. [Technical Architecture](#12-technical-architecture)
13. [Community & Social Features](#13-community--social-features)
14. [Monetization Strategy](#14-monetization-strategy)
15. [Risk Assessment](#15-risk-assessment)
16. [Success Metrics](#16-success-metrics)
17. [Implementation Order](#17-implementation-order)

---

## 1. Executive Summary

**What is Serpentine?**
Serpentine is a cyberpunk-themed arcade game built entirely with vanilla HTML/CSS/JS, featuring procedural audio synthesis, 60fps particle physics, multiple game modes, a rich character unlock system, and a deep narrative framing where gameplay is "running a snake program" in a fictional "OS." The project currently represents approximately **12-15 sessions** of development effort and delivers a polished Standard Mode with 10 characters, power-ups, leaderboards, and a point bank.

**What Should It Become?**
A complete arcade platform with 5+ distinct game modes, 40+ unlockable characters, a meta-progression system, a procedural soundtrack with 4 unique tracks, an achievement system, a tutorial framework, and a persistent save profile. The target is **Serpentine OS v3.0** — a game players can invest 50+ hours into.

**Why This Is Possible**
The foundation is solid. The architecture (canvas rendering, Web Audio, localStorage) is clean and scalable. The narrative framing ("you're running programs in an OS") gives coherence to wildly different game modes. The character system provides a 40-item unlock pipeline that creates long-tail engagement.

**Roadmap Overview**
| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| **Phase 1** | Foundation Polish | 4 sessions | Tutorial, accessibility, save system v2, mobile polish |
| **Phase 2** | Mode Expansion | 8 sessions | ChronoShift, Sentinel Breach, Firewall Breach |
| **Phase 3** | Content Depth | 8 sessions | Grid Warfare, Neural Fit, 30 new characters |
| **Phase 4** | Polish & Systems | 6 sessions | Achievements, meta-progression, audio expansion, tutorial |

**Total Estimated Development Time:** 26 focused sessions (~52 hours of coding)

---

## 2. Current State Audit

### 2.1 What's Implemented ✅

**Core Gameplay (Standard Mode)**
- Snake movement with 4-directional WASD/Arrow control
- Touch/swipe support for mobile
- 4 difficulty levels (Easy 180ms → Insane 50ms tick rate)
- Dynamic speed acceleration per food eaten
- Wall collision and self-collision detection
- Food spawning with 15% power-up chance
- Power-up system: Shield, Speed Boost, Ghost, Magnet, Double Eat
- Mercy system (continue at ½ score once per run)

**Characters (10 Total)**
| Character | Unlock Method | Special Feature |
|-----------|--------------|------------------|
| Neon Protocol | Default | Baseline cyan snake |
| Void Walker | Default | Purple aesthetic |
| Gold-Fi | Default | Golden aesthetic |
| Glitch-Wave | Default | Magenta aesthetic |
| Mecha-Serpent | Default | Grey military aesthetic |
| Chromatic Punch | 20 food in one Standard run | Rainbow color shifting |
| Princess | Shop (50,000 PTS) | Canvas-rendered dachshund with bark SFX |
| Arthropod | Shop (75,000 PTS) | Multi-legged creature with skins |
| Kite Dragon | Shop (100,000 PTS) | Crystalline flying design |
| 9193 | Cheat code 1-2-3-4-5-6-7-8-0 | Cheater snake (portal walls, no self-collision) |

**Audio System**
- Procedural synthwave background track (38.4s loop, Web Audio API)
- Menu music (64-step procedural ambient → drop progression)
- Synthesized SFX: eat, death, unlock, power-up, menu navigation
- Princess bark sound (MP3 sample, pitch-shifted for variation)

**UI/UX Systems**
- Arcade cabinet visual theme with animated border
- CSS variable-driven color theming per character
- Scanline CRT overlay effect
- Screen shake on death
- Particle explosion system (60fps requestAnimationFrame)
- Main menu with animated preview snake (infinity loop path)
- Leaderboard system (3-char initials, Top 10 per difficulty)
- System Shop with Point Bank
- Character select with lore and lock states
- Character options (Princess play style, Arthropod skins)
- Shop demo mode (15-second cinematic previews)

**Persistence (localStorage)**
- High score per difficulty
- Per-difficulty leaderboards
- Point Bank accumulation
- Unlock states for all characters
- Character option preferences
- Demo mode hints purchased

### 2.2 What's Missing ❌

**Critical Gaps**
1. **No tutorial** — New players have no onboarding
2. **No accessibility features** — Color blind modes, screen reader support, remappable controls
3. **No mobile optimization** — Touch controls exist but feel clunky; no mobile-specific layout
4. **Save system v1 only** — No cloud save, no export/import, no profile system
5. **No achievement system** — No meta-progression beyond character unlocks
6. **Only 1 of 5 planned modes playable** — Standard is complete; ChronoShift, Sentinel Breach, Firewall Breach, Grid Warfare, Neural Fit are designed but not implemented

**Audio Gaps**
- Only 2 music tracks (game + menu)
- No mode-specific audio themes
- No ambient sound in menus
- Missing SFX: power-up spawn, mercy activation, wave announcements

**Content Gaps**
- 40 planned characters (only 10 implemented)
- 40+ challenge unlocks from concepts.md (0 implemented)
- Boss encounters (0 implemented)
- Level-based campaign mode (0 implemented)
- Procedural arena generation (0 implemented)

**Quality Gaps**
- No pause menu in-game
- No settings screen (volume, fullscreen, etc.)
- No replays or ghost data
- No daily/weekly challenges
- No stats tracking beyond high scores

---

## 3. Vision: The Complete Serpentine OS

### 3.1 The Narrative Frame

Serpentine presents itself as a **desktop OS running corrupted snake programs**. Each game mode is a different "program" in the OS. This framing is critical — it makes the game mode variety feel intentional rather than bolted-on. Players aren't "playing different games"; they're "accessing different programs in the Serpentine OS."

**The Serpentine OS Desktop:**
```
┌──────────────────────────────────────────────────────────────┐
│  SERPENTINE OS v1.0                           [MINIMIZE][X] │
├──────────────────────────────────────────────────────────────┤
│  🐍 STANDARD.exe    ⏱️ CHRONOSHIFT.exe    ⚔️ SENTINEL.exe    │
│  🔥 BREACH.exe      🏁 WARFARE.exe        🧠 NEURAL_FIT.exe   │
│                                                              │
│  📁 CHARACTERS/     🏦 SYSTEM_SHOP/      🏆 LEADERBOARDS/   │
│  ⚙️ SETTINGS/       📖 MANUAL.doc         🔓 ACHIEVEMENTS/   │
└──────────────────────────────────────────────────────────────┘
```

This desktop metaphor should replace the current flat menu system. It makes the game feel like an **operating system you're navigating**, not just a collection of game modes.

### 3.2 Core Pillars

1. **Neon Arcade Aesthetic** — Every visual element reinforces the cyberpunk arcade feel. No compromises on the CRT scanlines, glow effects, or synthwave palette.

2. **Zero-Asset Architecture** — Everything is procedurally generated. This keeps the game portable, lightweight, and self-contained. Sound is synthesized. Graphics are canvas-rendered. No external downloads.

3. **Deep but Accessible** — The skill ceiling is high (Insane mode, boss encounters, speedrunner challenges). But the first 10 minutes are immediately fun and understandable.

4. **Persistent Progression** — Everything you do in Serpentine feeds back into your save profile. High scores, unlocks, achievements, statistics. Return players always have something to chase.

5. **Replayability Through Mode Variety** — Five distinct game modes provide fundamentally different gameplay experiences. A player burnt out on survival can try tactical combat, time manipulation, or rhythm-based drills.

---

## 4. Phase 1: Foundation Polish (Sessions 1-4)

*Goal: Address critical gaps that affect player retention and accessibility before expanding content.*

### Session 1: Tutorial System

**What to Build:**
A mandatory first-time tutorial that plays before Standard Mode.

**Flow:**
```
[BOOT SEQUENCE] → [WELCOME TO SERPENTINE OS] → [PROGRAM 1: STANDARD.EXE]
                                                              ↓
[TUTORIAL STEP 1: Movement]    "Use ARROW KEYS or WASD to move"
                               Highlight controls, player moves freely
                               [CONTINUE when player moves 5 times]

[TUTORIAL STEP 2: Eat Food]    "Collect the RED DATA FRAGMENTS"
                               Food spawns, player must eat 1
                               [CONTINUE]

[TUTORIAL STEP 3: Avoid Death] "Don't hit walls or your own code"
                               Show what happens when you die (slow-mo replay)
                               [CONTINUE]

[TUTORIAL STEP 4: Power-Ups]   "Power-ups spawn occasionally"
                               A power-up appears, player collects
                               Explain each type briefly
                               [CONTINUE]

[TUTORIAL COMPLETE]            "You understand the basics."
                               "Good luck, Operator."
                               → Start first real game
```

**Implementation Notes:**
- Tutorial state stored in localStorage (`serpentineTutorialComplete`)
- Skip button for returning players
- All tutorial text uses OS/narrative framing ("DATA FRAGMENTS" not "food")
- Tutorial can be re-accessed from SETTINGS

### Session 2: Accessibility & Settings

**Settings Screen Features:**
```
SETTINGS
├── AUDIO
│   ├── Music Volume: [━━━━━━━━━━○━━] 80%
│   ├── SFX Volume:  [━━━━━━━━━○━━━━] 70%
│   └── Mute on Focus Loss: [ON]
├── VIDEO
│   ├── Scanlines: [ON/OFF]
│   ├── Screen Shake: [ON/OFF]
│   ├── Particle Effects: [HIGH/MEDIUM/LOW/OFF]
│   └── Fullscreen: [TOGGLE]
├── CONTROLS
│   ├── Keyboard Scheme: [WASD / ARROWS / CUSTOM]
│   ├── Touch Controls: [ON/OFF]
│   ├── Swipe Sensitivity: [LOW / MEDIUM / HIGH]
│   └── Remap Controls: [OPEN REMAPPER]
├── ACCESSIBILITY
│   ├── Color Blind Mode: [NONE / PROTANOPIA / DEUTERANOPIA / TRITANOPIA]
│   ├── High Contrast Mode: [ON/OFF]
│   ├── Screen Reader: [ON/OFF]
│   └── Reduced Motion: [ON/OFF]
└── DATA
    ├── Export Save Data: [DOWNLOAD]
    ├── Import Save Data: [UPLOAD]
    ├── Reset Progress: [DANGER ZONE — requires confirmation ×2]
    └── Version: v1.0.0
```

**Color Blind Mode Implementation:**
- Apply SVG filter matrices to canvas
- Protanopia: `#00ffcc` → `#00cccc`, `#ff0055` → `#ffaa00` (shifts red to orange)
- Deuteranopia: `#00ffcc` → `#00ccaa`, `#ff0055` → `#ff9900`
- Tritanopia: `#00ffcc` → `#00ffaa`, `#ff0055` → `#ff5599`
- UI text gains underlines/color+icon combinations (never color alone for meaning)

### Session 3: Mobile Optimization

**Current State:** Touch controls exist but are bare-bones.

**Improvements:**
1. **Dedicated touch button overlay** — Show on-screen D-pad for mobile devices, positioned at bottom of screen for thumb reach
2. **Swipe deadzone** — Minimum 30px swipe before registering direction change (prevents accidental direction changes)
3. **Haptic feedback** — `navigator.vibrate()` for food collection, death, and menu navigation
4. **Responsive canvas** — Scale canvas to fit mobile screen while maintaining aspect ratio
5. **Mobile menu layout** — Stack menu buttons vertically, larger touch targets (min 48px)
6. **Performance profiling** — Cap particles at 50 on mobile, reduce shadow blur
7. **Orientation lock** — Prompt user to use landscape for best experience
8. **Fullscreen API** — Implement `requestFullscreen()` for immersive mobile play

### Session 4: Save System v2 & Profile

**Profile Structure:**
```javascript
const saveProfile = {
    meta: {
        version: "2.0",
        createdAt: timestamp,
        lastPlayedAt: timestamp,
        totalPlayTime: 0  // seconds
    },
    progress: {
        tutorialComplete: boolean,
        charactersUnlocked: ["neon", "void", ...],
        achievementsUnlocked: ["ach_1", ...],
        currentStreak: number,
        longestStreak: number,
        lastPlayedDate: "YYYY-MM-DD"
    },
    scores: {
        standard: { easy: [], medium: [], hard: [], insane: [] },
        chronoshift: { easy: [], medium: [], hard: [], insane: [] },
        // ... per mode
    },
    economy: {
        bank: number,
        shopPurchases: ["princess", "arthropod", ...]
    },
    settings: {
        musicVolume: 0.8,
        sfxVolume: 0.7,
        // ... from settings screen
    },
    stats: {
        totalGamesPlayed: number,
        totalFoodEaten: number,
        totalDeaths: number,
        highestSpeed: number,  // fastest tick rate survived
        longestSnake: number,
        favoriteCharacter: characterId,
        hoursPerMode: { standard: 0, chronoshift: 0, ... }
    },
    secrets: {
        cheatCodeUsed: boolean,
        masterRitualUsed: boolean,
        foundEasterEggs: ["ee_1", ...]
    }
};
```

**Save Operations:**
- Auto-save after every game over (non-blocking, runs after render)
- Save on tab close (`beforeunload` event)
- Export as JSON file download
- Import from file upload
- Validation on load — discard corrupted saves with user warning

---

## 5. Phase 2: Mode Expansion (Sessions 5-12)

*Goal: Implement all five game modes, making Serpentine a complete multi-mode platform.*

### Session 5-6: ChronoShift Implementation

**Priority:** HIGH  
**Estimated Time:** 2 sessions  
**Reference:** `CHRONOSHIFT.md` (fully designed document)

**Key Implementation Points:**

1. **Chrono-Meter HUD**
   - New HTML bar below score
   - Glowing cyan fill, max 1000 units
   - Four action buttons: Q (REWIND), W (SLOW-MO), E (FAST-FORWARD), R (PULSE)
   - Buttons grey out when insufficient chrono units
   - REWIND button pulses gold when >=500 units available

2. **History Buffer**
   - Rolling array of last 25 game states
   - Each state: `{ snake: [{x,y}...], food: {x,y}, powerUpFood: {...}, timestamp }`
   - Store every tick (120ms at medium)
   - Memory: <5KB per run — safe for localStorage-free session storage

3. **Rewind System**
   - Trigger: Q key when chrono >= 500
   - Animation sequence:
     1. Freeze game (0.3s)
     2. Screen desaturates
     3. "REVERSING..." text flashes
     4. Ghost trail shows last 3 positions
     5. State restored
     6. 0.5s invincibility window
     7. Chrono meter permanently reduced by 500
   - Score preserved, survival bonus if 10s passed

4. **Time Orbs**
   - Gold pulsing orbs, distinct from food
   - Spawn every 4 seconds (medium), max 2 on grid
   - Collecting: +200 chrono units, +25 points
   - Chime sound (440Hz → 880Hz sweep, 200ms)

5. **Slow-Motion Mode**
   - Trigger: W key when chrono >= 200
   - Tick rate drops to ×0.4 for 5 seconds
   - Cyan pulsing halo around snake head
   - "SLOW-MO: Xs" countdown in HUD

6. **Fast-Forward Mode**
   - Trigger: E key when chrono >= 300
   - Tick rate doubles for 5 seconds
   - Food/orb spawning suppressed
   - Blue-shift screen tint
   - "CAUGHT UP" flash on end

7. **Temporal Pulse**
   - Trigger: R key when chrono >= 150
   - All food teleports to random new positions
   - Instant effect, no animation beyond flash

8. **Visual Theme Integration**
   - Time trail afterimages (3 ghost segments at 20% opacity)
   - Background grid pulses cyan
   - Food gets orbit trail effect
   - Death effect: time-shatter (shards fly backward)

9. **Separate Leaderboard**
   - `serpentineLB_chrono_[difficulty]`
   - 3-char initials, Top 10 per difficulty
   - ChronoShift scores contribute to Point Bank

### Session 7-8: Sentinel Breach Implementation

**Priority:** HIGH  
**Estimated Time:** 2 sessions  
**Reference:** `SENTINEL_BREACH.md` (fully designed document)

**Key Implementation Points:**

1. **Mode Entry**
   - Available after ChronoShift unlock (or standalone in shop)
   - Mode select shows Sentinel Breach with wave-based preview

2. **Core Loop**
   - Player snake originates from center Nexus (3×3 glowing zone)
   - 8-directional movement (WASD or Arrow Keys)
   - Sentinels spawn from edges, move toward Nexus
   - Eat sentinel head → kill it (no growth)
   - Eat food → grow (defensive barrier building)
   - Any sentinel head reaching Nexus → GAME OVER

3. **Sentinel AI (4 Types)**
   ```
   PROBE:   3 segments, 250ms tick, random wandering, blue
   SWARMER: 4 segments, 180ms tick, pathfinds to Nexus, magenta  
   HUNTER:  5 segments, 120ms tick, leads target by 2 cells, red
   TITAN:   8 segments, 300ms tick, takes 3 food-hits to kill, orange
   ```

4. **Wave System**
   ```
   Wave 1:  3 PROBEs
   Wave 2:  5 PROBEs  
   Wave 3:  4 PROBEs + 2 SWARMERs
   Wave 4:  3 PROBEs + 4 SWARMERs
   Wave 5:  2 PROBEs + 3 SWARMERs + 1 HUNTER
   Wave 6+: Scaling (+1 HUNTER every 2 waves, +1 TITAN every 5 waves)
   ```

5. **Own-Body Collision OFF**
   - Critical for defensive coiling strategy
   - Players spiral around Nexus to form barrier walls

6. **New HUD**
   - Wave number, score, sentinel count
   - Nexus health rings (optional — 3 shield points, may simplify to 0)

7. **Distinct Audio**
   - Low 60Hz hum for Nexus idle
   - Digital chirp on sentinel spawn
   - Crunch on sentinel death
   - Ascending sweep on wave complete

### Session 9-10: Grid Warfare Implementation

**Priority:** MEDIUM  
**Estimated Time:** 2 sessions  
**Reference:** `GRID_WARFARE.md` (fully designed document)

**Key Implementation Points:**

1. **Two-Snake Simultaneous Game Loop**
   - Player 1: WASD + Space
   - Player 2: Arrow Keys + Enter
   - Both snakes move simultaneously each tick
   - Walls are lethal (no wrapping)
   - Own-body collision enabled (high stakes)

2. **Collision Resolution Per Tick (in order)**
   ```
   1. Check wall collision → death if out of bounds
   2. Check opponent body collision → death
   3. Check own body collision → death
   4. Check head-to-head → both die = DRAW
   ```

3. **Round System**
   - First to 5 round wins takes the match
   - 3-second countdown between rounds
   - Independent score tracking per round

4. **AI Opponent (Single Player)**
   ```
   Easy:    Random wandering, gravitates toward food within 5 cells
   Medium:  Pathfinds to food, avoids opponent body, occasional mistakes
   Hard:    Optimal BFS pathfinding, predicts opponent, rarely mistakes
   ```

5. **Character Select (2-Player)**
   - Both players choose independently before match
   - All unlocked characters available
   - Visual distinction maintained per character

6. **Scoring**
   - Eat food: +5 points
   - Opponent crashes wall/self: +100 points
   - Opponent crashes YOUR body: +500 points
   - Draw (head-to-head): 0 points, both get +25 survival

7. **Visual Distinctness**
   - Cyan snake vs Magenta snake (or their character colors)
   - Center divider line
   - Wall border glow
   - Win pips (filled circles for wins out of 5)

### Session 11-12: Firewall Breach & Neural Fit

**Firewall Breach** (Session 11)
**Priority:** MEDIUM  
**Reference:** `concepts.md` Section "FIREWALL BREACH"

**Key Mechanics:**
- Red pulsing "firewall" border moves inward 1 unit every 10 seconds
- Eating food "hacks" firewall, pushing it back 1 unit
- Firewall speeds up as score increases
- Game over when playable space shrinks to nothing
- Visual: Pulsing red glow, crackling particle static, alarm-drone audio

**Neural Fit** (Session 12)
**Priority:** LOW (most complex, do after others)  
**Reference:** `NEURAL_FIT.md` (fully designed document)

**Key Mechanics:**
- Pre-defined drill paths (ghost trail shows target path)
- Player must match path with correct timing
- Combo system: Perfect/Good/OK/Miss ratings
- Score × combo multiplier
- 6 drills with unlock tree (Warm Up → Figure-8 → Zigzag → Spiral → Wave → Gauntlet)
- Generative ambient audio pad (D minor, calm)
- Results screen with accuracy breakdown

---

## 6. Phase 3: Content Depth (Sessions 13-20)

*Goal: Fill the game with 40+ characters, 10+ challenges, and deep unlock pipelines.*

### Session 13-14: Characters 11-20 (Standard Unlocks)

Based on `concepts.md` challenges 1-10, implement as food-milestone unlocks:

| ID | Name | Unlock | Color Pattern | Notes |
|----|------|--------|---------------|-------|
| 11 | Crimson Fang | 30 food Standard | Deep Red `#8B0000` / Black | Aggressive, sharp angular head |
| 12 | Cobalt Grid | 40 food Standard | Cobalt `#0047AB` / Silver | Cold, geometric, angular |
| 13 | Emerald Core | 50 food Standard | Bright Green `#00FF00` / Lime | Organic, flowing animation |
| 14 | Void Star | 60 food Standard | Pitch Black `#000000` / Violet Strobe | Inverted colors, strobe effect |
| 15 | Plasma Hydra | 70 food Standard | Hot Orange `#FF4500` / Purple | Multi-head visual (one actual head, decorative tails) |
| 16 | Monochrome | 80 food Standard | White/Gray/Black `#FFFFFF` | Classic retro computer aesthetic |
| 17 | Molten Core | 90 food Standard | Yellow-Orange `#FF8C00` / Red | Glowing ember particles |
| 18 | Titanium Coil | 100+ food Standard | Chrome `#C0C0C0` / Steely Blue | Reflective metallic sheen |
| 19 | Quicksilver | Complete Standard under 60s | Liquid Silver `#C0C0C0` / Cyan | Speed lines particle effect |
| 20 | Photon Dash | Complete Standard under 45s | Blinding White `#FFFFFF` / Yellow | Light streak trail |

### Session 15-16: Characters 21-30 (Secret/Easter Egg)

| ID | Name | Unlock | Color Pattern | Notes |
|----|------|--------|---------------|-------|
| 21 | Nokia Nostalgia | Play 50 games | Pea Soup `#84B500` / Dark LCD | Classic green-on-black aesthetic |
| 22 | Konami Code | Input Konami Code (Up Up Down Down...) | Red/Blue classic arcade | Pixel art snake |
| 23 | MissingNo | 500 consecutive deaths | Static Glitch / Broken Pink | Intentionally glitchy, screen tear effect |
| 24 | Dogecoin | Collect 10000 bank points total | Shiba Gold `#D4A017` / IEB Blue | Comic sans font overlay |
| 25 | Binary Constrictor | Reach 500 food eaten total | Matrix Green `#00FF00` | Trail leaves 0s and 1s |
| 26 | The Dev | Unlock all other characters | Glowing Gold / Royal Purple | Crown on head, most elaborate animation |
| 27 | Error 404 | Visit 404 error page (hidden URL) | Translucent / Blinking text | Snake flickers in/out |
| 28 | Blue Screen | Die 100 times | BSOD Blue `#0000AA` / White | Full-screen death effect |
| 29 | Scanline Samurai | Clear 10 levels in Sentinel Breach | Red `#FF0000` / Phosphor Green | Katana tail appendage |
| 30 | Synthesizer | Listen to full menu song 5 times | Waveform gradient | Body ripples to audio beat |

### Session 17: Speedrunner Characters 31-35

| ID | Name | Unlock | Color Pattern |
|----|------|--------|---------------|
| 31 | Mach Mach | Complete Insane mode under 90s | Red / Blur |
| 32 | Sonic Boom | Complete Hard mode under 60s | Shocking Blue / White |
| 33 | Quantum Leap | Complete Standard without rewind (ChronoShift) | Magenta / Cyan Pulse |
| 34 | Warp Python | Complete ChronoShift Insane under 120s | Deep Purple / Starlight |
| 35 | Flash Protocol | Clear Sentinel Breach Wave 20 | Bright Yellow / Red |

### Session 18: Special Character Skins & Variants

**Arthropod Skins** (already partially implemented):
- VENOMOUS (green) ✅
- INFERNO (fire) — implement particle trail
- PHANTOM (ghostly purple) — implement transparency

**Character Variants** (same base, different colors/patterns):
```
Neon Protocol → Neon Classic (original green), Neon Pulse (bright white)
Void Walker → Void Shadow (darker), Void Nova (bright burst on move)
Glitch-Wave → Glitch Classic (solid magenta), Glitch Debug (RGB split)
```

**Seasonal Characters** (time-limited availability):
- Pumpkin Protocol (Halloween, Oct 1-31) — Orange/black
- Frost Serpent (Winter, Dec 1-Jan 7) — Ice blue/white
- Heart Core (Valentine's, Feb 1-14) — Red/pink

### Session 19: Endless/Survival Characters 36-40

| ID | Name | Unlock | Notes |
|----|------|--------|-------|
| 36 | Aegis Defender | Survive 500 seconds in one Standard run | Shield icon, golden accents |
| 37 | Phoenix Protocol | Die and come back 10 times in one session | Respawn animation |
| 38 | Juggernaut | Reach 200 segments length | Slow, massive, intimidating |
| 39 | Infinity Scale | Complete 100 Standard games | Prismatic iridescent |
| 40 | Zenith Serpent | Reach top 3 on all leaderboards | Diamond crown, blazing trail |

### Session 20: Achievement System Framework

**Achievement Categories:**
```
🐍 MASTERY         — Get good at Standard Mode
   ├── "APPRENTICE" — Complete your first Standard run
   ├── "COMPETENT"  — Reach 100 points in Medium
   ├── "EXPERT"     — Reach 500 points in Hard
   ├── "MASTER"     — Reach 1000 points in Insane
   └── "LEGEND"     — Reach 2000 points in Insane

⏱️ CHRONOSHIFT     — Time manipulation mastery
   ├── "TEMPORAL"   — Complete ChronoShift run
   ├── "REWINDER"   — Use rewind 5 times in one run
   └── "TIMELORD"   — Survive 5 minutes in ChronoShift

⚔️ COMBAT          — Sentinel Breach mastery
   ├── "GUARDIAN"   — Clear Wave 10 in Sentinel Breach
   ├── "DEFENDER"   — Clear Wave 25 in Sentinel Breach
   └── "LEGENDARY"  — Clear Wave 50 in Sentinel Breach

🏁 COMPETITIVE     — Grid Warfare mastery
   ├── "DUELIST"    — Win a Grid Warfare match
   ├── "CHAMPION"   — Win 10 Grid Warfare matches
   └── "UNDISPUTED" — Win 50 Grid Warfare matches

🐍 COLLECTOR       — Unlock all characters
   ├── "COMPLETIST" — Unlock 10 characters
   ├── "HARDCORE"   — Unlock 25 characters
   └── "EVERYTHING" — Unlock all 40 characters

🎯 CHALLENGES      — Special feats
   ├── "PERFECTIONIST" — Complete a Standard run with 0 deaths
   ├── "SPEEDRUNNER"   — Complete Standard under 30 seconds
   └── "UNDYING"       — Use mercy 10 times in one day
```

**Achievement Rewards:**
- Each achievement unlocks a badge (displayed on profile)
- Every 5 achievements: +10,000 bonus bank points
- Milestone achievements (10/20/30/40): +50,000 bonus points
- Some achievements unlock characters directly (The Dev, MissingNo, etc.)

---

## 7. Phase 4: Polish & Systems (Sessions 21-26)

### Session 21: Audio Expansion

**New Tracks (Procedural, Web Audio API):**

| Track | Duration | Mood | Instruments |
|-------|----------|------|-------------|
| **Chrono Ambient** | 60s loop | Tense, time-dilated | Low bass drone, high arpeggios, reverse cymbals |
| **Sentinel Combat** | 40s loop | Aggressive, driving | Distorted bass, snare hits, alarm synth |
| **Firewall Alarm** | 20s loop | Claustrophobic, urgent | Pulsing red alarm, compressed bass, static |
| **Neural Calm** | 80s loop | Meditative, flowing | Soft pad, gentle piano, nature sounds |
| **Victory Fanfare** | 3s | Triumphant | Full chord sweep, brass approximation |
| **Game Over Requiem** | 4s | Melancholic | Descending minor chord, delay |

**SFX Expansion:**
- Power-up spawn chime
- Mercy activation sound
- Achievement unlock fanfare
- Wave complete announcement
- Mode transition swoosh
- Button hover blip (subtle)
- Character unlock cascade (multi-note sequence)
- Easter egg discovered sound (mysterious chord)

### Session 22: Meta-Progression System

**Season Pass Concept (No Real Money, Points-Only):**

```
SEASON 1: "SYSTEM LAUNCH"
Duration: Permanent (no time limit)

Track Structure:
- 50 tiers of rewards
- Every 10,000 bank points earned = 1 tier progress
- Track shows unlock progress visually

Tier Rewards:
1-10:   Bank point bonuses (+5,000 per tier)
11-20:  New character skins (+3 per tier)
21-30:  New character variants (+3 per tier)  
31-40:  Audio tracks unlocked for jukebox (+2 per tier)
41-50:  Legendary characters, profile badges, title

Milestone Bonuses:
Tier 10:  +100,000 bank points
Tier 25:  +250,000 bank points
Tier 50:  +500,000 bank points + "Serpentine Pioneer" profile badge
```

**Profile Titles (displayed on leaderboards):**
- "APPRENTICE" — Complete first game
- "COMPETENT" — Reach 500 points
- "EXPERT" — Reach 1000 points
- "MASTER" — Reach 2000 points
- "LEGEND" — Reach 3000 points
- "SERPENTINE PIONEER" — Tier 50 season pass
- "COLLECTOR" — All characters unlocked
- "TEMPORAL WIZARD" — 100 ChronoShift rewinds
- "SENTINEL HUNTER" — Clear Wave 50

### Session 23: Daily & Weekly Challenges

**Daily Challenge:**
- One challenge per day, resets at midnight local time
- Examples:
  - "Complete a Standard run on Insane"
  - "Collect 50 food in ChronoShift"
  - "Reach Wave 15 in Sentinel Breach"
  - "Win 3 rounds of Grid Warfare"
- Reward: +25,000 bank points + special badge

**Weekly Challenge:**
- One challenge per week, resets Monday
- Examples:
  - "Reach 5000 total points"
  - "Survive 10 minutes in ChronoShift"
  - "Clear Wave 30 in Sentinel Breach"
  - "Win 10 rounds of Grid Warfare"
- Reward: +100,000 bank points + exclusive character

**Challenge Storage:**
```javascript
{
    daily: {
        date: "2026-05-31",
        challengeId: "insane_run",
        completed: false,
        progress: 0
    },
    weekly: {
        weekStart: "2026-05-25",
        challengeId: "wave_30_sentinel",
        completed: false,
        progress: 0
    }
}
```

### Session 24: Replay System

**Ghost Replay Data:**
- Store the last 3 runs as "ghost data"
- Ghost appears in-game as translucent overlay showing your previous run
- Toggle ghost mode in settings
- Ghost data: ~500 bytes per run (snake path as compressed array of directions)

**Shareable Replays:**
- Encode run as base64 string (compressed)
- "Copy Replay Code" button on game over
- Replay code pasted on main menu plays back run as cinematic

### Session 25: Tutorial Expansion

**Per-Mode Tutorials:**
```
CHRONOSHIFT:
├── [STEP 1] "The Chrono-Meter charges as you collect time orbs"
├── [STEP 2] "REWIND (Q) rolls back 3 seconds — use it when in trouble"
├── [STEP 3] "SLOW-MO (W) gives you more reaction time"
├── [STEP 4] "FAST-FORWARD (E) skips bad situations"
└── [STEP 5] "TEMPORAL PULSE (R) scrambles food positions"

SENTINEL BREACH:
├── [STEP 1] "Defend the Nexus at the center"
├── [STEP 2] "Sentinels spawn from edges and hunt you"
├── [STEP 3] "Eat sentinel heads to destroy them"
├── [STEP 4] "Eat food to grow your defensive barrier"
└── [STEP 5] "Your own coils are safe — coil around the Nexus"

GRID WARFARE:
├── [STEP 1] "Two snakes — one grid"
├── [STEP 2] "Player 1: WASD, Player 2: Arrow Keys"
├── [STEP 3] "First to 5 rounds wins"
├── [STEP 4] "Head-to-head = DRAW"
└── [STEP 5] "Trap your opponent in their own body"
```

### Session 26: Polish Pass

**Final Quality Checklist:**
- [ ] All text has consistent terminology (OS language)
- [ ] All buttons have hover/active/disabled states
- [ ] All audio has volume controls
- [ ] All visual effects have LOW/OFF alternative
- [ ] All modes have working leaderboards
- [ ] All characters have unique animations
- [ ] All screens work on mobile
- [ ] No console errors in production
- [ ] All localStorage keys have fallback defaults
- [ ] Performance: 60fps on mid-range devices
- [ ] Accessibility: passes color blind simulation
- [ ] Touch: all interactions work with touch
- [ ] Fullscreen: works on all browsers
- [ ] Save export/import: tested successfully
- [ ] Tutorial: completable in <3 minutes

---

## 8. Character Roster Master List

### Default Characters (5)
| ID | Name | Unlock | Color | Lore |
|----|------|--------|-------|------|
| 1 | Neon Protocol | Default | Cyan | The original OS baseline |
| 2 | Void Walker | Default | Purple | Corrupted null-sectors entity |
| 3 | Gold-Fi | Default | Gold | Luxury data-packet miner |
| 4 | Glitch-Wave | Default | Magenta | Deleted game file remnant |
| 5 | Mecha-Serpent | Default | Slate Grey | Military intrusion software |

### Milestone Unlocks (5)
| ID | Name | Unlock | Color |
|----|------|--------|-------|
| 6 | Chromatic Punch | 20 food Standard | Rainbow shifting |
| 7 | Princess | Shop 50,000 PTS | Brown dachshund |
| 8 | Arthropod | Shop 75,000 PTS | Neon green |
| 9 | Kite Dragon | Shop 100,000 PTS | Orange/green dragon |
| 10 | 9193 | Cheat code 1-2-3-4-5-6-7-8-0 | Golden cheater |

### Food Milestone Unlocks (10)
| ID | Name | Unlock | Color |
|----|------|--------|-------|
| 11 | Crimson Fang | 30 food | Deep Red |
| 12 | Cobalt Grid | 40 food | Cobalt Blue |
| 13 | Emerald Core | 50 food | Bright Green |
| 14 | Void Star | 60 food | Black/Violet |
| 15 | Plasma Hydra | 70 food | Orange/Purple |
| 16 | Monochrome | 80 food | White/Gray |
| 17 | Molten Core | 90 food | Yellow-Orange |
| 18 | Titanium Coil | 100+ food | Chrome |
| 19 | Quicksilver | Under 60s | Silver/Cyan |
| 20 | Photon Dash | Under 45s | White/Yellow |

### Secret/Easter Egg (10)
| ID | Name | Unlock | Color |
|----|------|--------|-------|
| 21 | Nokia Nostalgia | 50 games | Pea Soup Green |
| 22 | Konami Code | Konami Code | Red/Blue |
| 23 | MissingNo | 500 deaths | Glitch Pink |
| 24 | Dogecoin | 10,000 bank points | Shiba Gold |
| 25 | Binary Constrictor | 500 food eaten | Matrix Green |
| 26 | The Dev | All characters | Gold/Purple |
| 27 | Error 404 | 404 URL | Translucent |
| 28 | Blue Screen | 100 deaths | BSOD Blue |
| 29 | Scanline Samurai | Wave 10 Sentinel | Red/Green |
| 30 | Synthesizer | 5 full songs | Waveform |

### Speedrun Characters (5)
| ID | Name | Unlock | Color |
|----|------|--------|-------|
| 31 | Mach Mach | Insane under 90s | Red/Blur |
| 32 | Sonic Boom | Hard under 60s | Blue/White |
| 33 | Quantum Leap | Chrono no rewind | Magenta/Cyan |
| 34 | Warp Python | Chrono Insane under 120s | Purple/Starlight |
| 35 | Flash Protocol | Wave 20 Sentinel | Yellow/Red |

### Survival/Endless Characters (5)
| ID | Name | Unlock | Color |
|----|------|--------|-------|
| 36 | Aegis Defender | 500s survival | Gold |
| 37 | Phoenix Protocol | 10 deaths per session | Orange/Gray |
| 38 | Juggernaut | 200 segments | Dark Iron |
| 39 | Infinity Scale | 100 games | Iridescent |
| 40 | Zenith Serpent | Top 3 all boards | Diamond Blue |

**Total: 40 Characters**

---

## 9. Audio Architecture

### 9.1 Audio Context Management

```javascript
class SerpentineAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        
        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        
        this.currentTrack = null;
        this.ambientOscillator = null;
    }
    
    setMasterVolume(v) { this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    setMusicVolume(v) { this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    setSFXVolume(v) { this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    
    // Procedural synth tracks
    playTrack(trackName) { /* switch on trackName, start appropriate sequencer */ }
    stopTrack() { /* stop all oscillators */ }
    
    // SFX
    playSFX(name, options) { /* play one-shot sound effect */ }
}
```

### 9.2 Track Specifications

**Main Menu Track** (existing)
- 64-step sequence, 175ms per step (~11 seconds)
- Phase 1 (0-31): Deep drone, low bass pulse
- Phase 2 (32-63): "The Drop" — rhythmic bass + arpeggio + kick

**Game Track** (existing)
- 256-step sequence, 150ms per step (38.4 seconds)
- Am-F-C-G chord progression
- Sawtooth bass, square melody (second half only), kick/snare drums

**New: ChronoShift Track**
- 400-step sequence, 150ms per step (60 seconds)
- Minor key (A minor — tense)
- Reverse reverb on melody elements
- Subtle heartbeat pulse every 4 bars
- Distant clock ticking overlay

**New: Sentinel Combat Track**
- 128-step sequence, 125ms per step (16 seconds)
- Aggressive, 4/4 driving
- Distorted bass, heavy snare, alarm synth stabs
- Intensity builds as waves progress (filter opens more)

**New: Neural Calm Track**
- Generative pad, D minor
- LFO-modulated sine wave (0.1Hz, ±5Hz sweep)
- Very low volume (0.05 gain)
- Responds to combo (volume +0.01 per perfect hit)

### 9.3 Sound Effect Library

| SFX Name | Description | Trigger | Synthesis |
|----------|-------------|---------|-----------|
| menu_nav | High-freq blip | Menu item change | 1800Hz square, 50ms |
| menu_select | Gritty thud | Confirm selection | 180Hz saw + 3000Hz square blip |
| menu_back | Descending whoosh | Go back | 350→100Hz saw, 300ms |
| eat | Two-tone blip | Collect food | 800Hz + 1200Hz square |
| death | Descending sweep | Game over | 150→10Hz saw, 1000ms |
| unlock | Triumphant arpeggio | Character unlocked | 440-554-659-880Hz sequence |
| powerup | Ascending sweep | Power-up collected | 440→1320Hz sine, 200ms |
| chrono_collect | Chime | Time orb collected | 440→880Hz sine, 200ms |
| sentinel_spawn | Digital chirp | Sentinel appears | 200→400Hz triangle, 100ms |
| sentinel_death | Crunch | Sentinel destroyed | Noise burst, 150ms |
| wave_complete | Ascending three-tone | Wave finished | 200→300→400Hz, 300ms |
| rewind | Reverse sweep | Rewind activated | 880→220Hz, 500ms + static |
| slowmo_activate | Doppler whoosh | Slow-Mo started | 200→800→200Hz, 300ms |
| victory | Fanfare chord | Match won | 440+550+660Hz sustained |
| achievement | Triumphant burst | Achievement unlocked | Multi-voice arpeggio |
| mercy | Heartbeat pulse | Mercy used | 60Hz + 80Hz, 2 beats |
| bark | Dog bark | Princess eats | MP3 sample, pitch-shifted |
| error | Error beep | Invalid action | 200Hz square, 3 quick beeps |

---

## 10. Save System & Persistence

### 10.1 Storage Keys

```javascript
const STORAGE_KEYS = {
    // Version 2 profile (primary)
    profile: "serpentineProfile_v2",
    
    // Legacy support (migrate on load)
    legacy_highscore: "serpentineHighScore",
    legacy_leaderboard: "serpentineLB_",
    legacy_unlocks: "serpentineUnlocked",
    
    // Temporary (session only, not saved)
    session_current_run: null,
    session_ghost_data: null
};
```

### 10.2 Migration Strategy

On first load of v2:
1. Read all v1 keys from localStorage
2. Transform v1 format → v2 profile format
3. Write v2 profile
4. Keep v1 keys for 30 days (rollback safety)
5. After 30 days, delete v1 keys

### 10.3 Export/Import Format

```json
{
    "serpentine_export": true,
    "version": "2.0",
    "exported_at": "2026-05-31T12:00:00Z",
    "profile": { /* full saveProfile object */ }
}
```

Exported as `.serpentine` file (JSON with `application/octet-stream` MIME type for security).

---

## 11. Visual Identity System

### 11.1 CSS Variable Architecture

```css
:root {
    /* Core palette — shift per character */
    --snake-primary: #00ffcc;
    --snake-glow: rgba(0, 255, 204, 0.5);
    --snake-secondary: #00cc99;
    --food-color: #ff0055;
    --food-glow: rgba(255, 0, 85, 0.8);
    
    /* UI palette — constant */
    --accent-color: #b026ff;
    --background-color: #050505;
    --grid-color: #1a1a2e;
    --text-color: #ffffff;
    --text-muted: #888888;
    
    /* Effects */
    --scanline-opacity: 0.15;
    --shake-intensity: 5px;
    --glow-spread: 20px;
}
```

### 11.2 Character Color Palettes

Each character defines a palette object that patches the CSS variables:
```javascript
const CHARACTER_PALETTES = {
    neon: {
        snakePrimary: "#00ffcc",
        snakeGlow: "rgba(0,255,204,0.5)",
        foodColor: "#ff0055",
        accentColor: "#b026ff"
    },
    void: {
        snakePrimary: "#8a2be2",
        snakeGlow: "rgba(138,43,226,0.8)",
        foodColor: "#00ffff",
        accentColor: "#ff00ff"
    },
    // ... all 40 characters
};
```

### 11.3 Mode Visual Themes

Each mode applies an additional theme overlay:

```javascript
const MODE_THEMES = {
    standard: {
        background: "#050505",
        gridColor: "#1a1a2e",
        tint: null  // no overlay
    },
    chronoshift: {
        background: "#030510",
        gridColor: "#1a2a3e",
        tint: "rgba(0,150,255,0.03)",  // subtle cyan tint
        gridEffect: "radial-pulse"  // grid pulses from center
    },
    sentinel: {
        background: "#100505",
        gridColor: "#2a1a1e",
        tint: "rgba(255,50,50,0.05)",
        borderGlow: "#ff2200"
    },
    breach: {
        background: "#100505",
        gridColor: "#2a1010",
        tint: "rgba(255,50,0,0.08)",
        borderGlow: "#ff4500",
        borderWidth: 3 + waveNumber  // grows with waves
    },
    neural: {
        background: "#050510",
        gridColor: "#1a1a2e",
        tint: "rgba(100,100,200,0.03)",
        accentColor: "#6677ff"
    }
};
```

### 11.4 Particle System Standardization

All particle effects use a unified system:

```javascript
class ParticleSystem {
    constructor(maxParticles = 200) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }
    
    emit(x, y, color, count, config = {}) {
        // config: { speed, size, decay, spread, gravity }
        for (let i = 0; i < count; i++) {
            const angle = (config.spread || Math.PI * 2) * Math.random();
            const speed = (config.speed || 4) * (0.5 + Math.random());
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: (config.size || 4) * (0.5 + Math.random()),
                life: 1,
                decay: config.decay || 0.03,
                color,
                gravity: config.gravity || 0
            });
        }
        // Cull oldest if over limit
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }
    
    // Predefined effects
    burst(x, y, color) { this.emit(x, y, color, 20, {speed: 4, size: 4, decay: 0.03}); }
    trail(x, y, color) { this.emit(x, y, color, 3, {speed: 1, size: 2, decay: 0.05, spread: 0.5}); }
    explosion(x, y, color) { this.emit(x, y, color, 40, {speed: 6, size: 6, decay: 0.02}); }
    shower(color) { /* rain particles from top */ }
    ring(x, y, color) { /* expanding ring effect */ }
}
```

---

## 12. Technical Architecture

### 12.1 Module Structure

```
serpentine/
├── index.html          # Entry point, DOM structure
├── style.css           # All CSS, theme variables
├── script.js           # Main game engine (current monolithic file)
│
├── modules/
│   ├── audio.js        # AudioEngine class
│   ├── particles.js    # ParticleSystem class
│   ├── save.js         # SaveManager class, export/import
│   ├── ui.js           # UIManager class, all screen transitions
│   └── utils.js        # Helpers (clamp, lerp, random, etc.)
│
├── modes/
│   ├── standard.js     # Standard mode logic
│   ├── chronoshift.js  # ChronoShift logic + chrono meter
│   ├── sentinel.js     # Sentinel Breach logic + waves
│   ├── breach.js       # Firewall Breach logic
│   ├── warfare.js      # Grid Warfare logic + AI
│   └── neural.js       # Neural Fit logic + drills
│
├── entities/
│   ├── Snake.js        # Snake entity (handles all character rendering)
│   ├── Sentinel.js     # Sentinel enemy (Sentinel Breach)
│   ├── Food.js         # Food/power-up rendering
│   └── Nexus.js        # Nexus core (Sentinel Breach)
│
├── characters/
│   ├── registry.js     # All 40 character definitions
│   ├── palettes.js     # Character color palettes
│   └── animations.js   # Character-specific drawing functions
│
├── ui/
│   ├── menus.js        # All menu screens
│   ├── hud.js          # In-game HUD rendering
│   ├── tutorial.js     # Tutorial flow controller
│   └── settings.js      # Settings panel
│
├── data/
│   ├── leaderboards.js # Leaderboard management
│   ├── achievements.js # Achievement definitions + tracking
│   ├── challenges.js   # Daily/weekly challenges
│   └── profile.js      # Profile metadata
│
└── resources/
    └── sounds/
        └── princess_bark.mp3  # Only external asset (optional, fallback exists)
```

### 12.2 Game State Machine

```javascript
const GameState = {
    BOOT: 'boot',              // Initial loading screen
    MAIN_MENU: 'main_menu',    // OS desktop
    MODE_SELECT: 'mode_select',// Choose program
    TUTORIAL: 'tutorial',      // First-time onboarding
    PLAYING: 'playing',        // Active gameplay
    PAUSED: 'paused',          // Pause menu
    GAME_OVER: 'game_over',    // Death screen
    LEADERBOARD: 'leaderboard',// View high scores
    SETTINGS: 'settings',      // Settings panel
    SHOP: 'shop',              // System Shop
    CHARACTER_SELECT: 'char_select', // Choose snake
    ACHIEVEMENTS: 'achievements' // View achievements
};

class Game {
    constructor() {
        this.state = GameState.BOOT;
        this.currentMode = null;
        this.currentCharacter = null;
        this.audio = new SerpentineAudio();
        this.save = new SaveManager();
        this.ui = new UIManager();
        this.particles = new ParticleSystem();
        
        this.init();
    }
    
    init() {
        this.audio.init();
        this.save.load();
        this.ui.init(this);
        this.setState(GameState.MAIN_MENU);
    }
    
    setState(newState, params) {
        const oldState = this.state;
        this.state = newState;
        this.ui.transition(oldState, newState, params);
        this.audio.onStateChange(oldState, newState);
    }
}
```

### 12.3 Rendering Pipeline

```javascript
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.modeTheme = MODE_THEMES.standard;
    }
    
    clear() {
        this.ctx.fillStyle = this.modeTheme.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid() {
        // Grid lines with mode-specific color
        const old = this.ctx.strokeStyle;
        this.ctx.strokeStyle = this.modeTheme.gridColor;
        // ... draw grid
        this.ctx.strokeStyle = old;
    }
    
    drawModeEffects() {
        // Mode-specific overlay effects
        if (this.modeTheme.tint) {
            this.ctx.fillStyle = this.modeTheme.tint;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        // Border glow for breach mode
        // Radial pulse for chronoshift
        // etc.
    }
    
    drawScanlines() {
        // CRT scanline effect
        // Toggleable via settings
    }
    
    frame(gameState, entities) {
        this.clear();
        this.drawGrid();
        this.drawModeEffects();
        
        for (const entity of entities) {
            entity.draw(this.ctx);
        }
        
        this.particles.draw(this.ctx);
        this.drawScanlines();
    }
}
```

### 12.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60 fps | `requestAnimationFrame` delta |
| Input Latency | <16ms | Keypress → visual response |
| Memory | <50MB | Chrome DevTools |
| Load Time | <2s | First contentful paint |
| localStorage | <5MB | All save data |
| Bundle Size | <500KB | Minified JS + CSS |
| Mobile FPS | 30+ fps | Low-power devices |

---

## 13. Community & Social Features

### 13.1 Local Leaderboard Enhancements

- **Difficulty-filtered leaderboard** (already implemented)
- **Mode-specific leaderboards** (already designed)
- **Character-filtered leaderboard** — see best scores with specific character
- **Global statistics** — "You are in the top X% of players"
- **Initials validation** — prevent offensive initials (basic word filter)

### 13.2 Ghost Leaderboard (Future)

- Store top 3 run paths as compressed ghost data
- Ghost snakes appear in-game on load, showing "pro paths"
- Players can try to beat the ghost
- Adds asynchronous competition

### 13.3 Community Events (Stretch)

*Implemented client-side only (no server required)*:

**Monthly Challenge:**
- Hardcoded monthly challenge announced on a specific date
- Community competes on honor system
- Reward: special profile badge + character

**Speedrun Leaderboard:**
- Dedicated "Speedrun" mode with timer
- Strict rules: no power-ups, no mercy
- Leaderboard for fastest completion times

---

## 14. Monetization Strategy

*Note: Serpentine is a zero-asset, self-contained game. All content should be accessible without real-money purchase. Monetization serves as optional appreciation, not gatekeeping.*

### 14.1 No-Gate Philosophy

**Core conviction:** Every gameplay feature, mode, and character is accessible through play. Real money cannot shortcut progression. This:
- Preserves the arcade spirit
- Prevents negative reviews about "pay-to-win"
- Builds genuine player investment
- Keeps the zero-asset architecture intact

### 14.2 Optional Appreciations

**Tip Jar Button:**
- Small "Support Development" button in settings
- Links to a Ko-fi / PayPal (or similar)
- No in-game reward
- Appeals to players who want to support

**Custom Profile:**
- Players can set a custom 8-character name
- Name appears on leaderboards
- Unlockable through playing (not purchase)

**Soundtrack Download:**
- Export procedural audio tracks as WAV files
- No gameplay content — just the music
- Appreciation item

### 14.3 Future: Optional Web Version

If the game is hosted on a web platform (itch.io,itch.io, GameJolt, etc.):
- Free base game
- "Deluxe Edition" ($5) includes:
  - All 40 characters pre-unlocked
  - Original concept art gallery
  - Extended soundtrack
  - No gameplay advantage — all available through play

---

## 15. Risk Assessment

### 15.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Audio context autoplay restrictions | High | Medium | User must click to start (already implemented), clear "INITIALIZE" prompt |
| localStorage quota exceeded | Low | High | Compression, old data pruning, export/import to file |
| Mobile performance degradation | Medium | Medium | Particle cap, quality settings, testing on low-end devices |
| Canvas rendering bugs on specific browsers | Low | Low | Test on Chrome/Firefox/Safari/Edge, polyfills for `roundRect` |
| Touch event conflicts with swipe controls | Medium | Medium | Clear deadzone, differentiate tap vs swipe |

### 15.2 Design Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Feature creep delays release | High | High | Strict phase gates, cut scope rather than delay |
| Mode variety makes game feel unfocused | Medium | Medium | Strong OS narrative framing, clear mode differentiation |
| 40 characters are too many to balance | Low | Medium | Most characters are visual variants, not mechanically distinct |
| Tutorial skippable/ignored | Medium | Low | First-time mandatory, skip only for returning players |
| Player confusion about modes | Medium | Medium | "DESKTOP" metaphor makes modes feel like separate programs, not a single confusing game |

### 15.3 Scope Management Rules

1. **No scope increase without phase completion** — finish Phase 1 before adding Phase 2 features
2. **Cut, don't postpone** — if a feature is too complex, cut it from the release scope
3. **"Would this be in the v1.0?"** test — if not, it's Phase 2+
4. **Time budget per phase** — 4 sessions max per phase, ship at end regardless of polish

---

## 16. Success Metrics

### 16.1 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Return rate (day 1) | >40% | Players who return next day |
| Return rate (week 1) | >20% | Players who return within 7 days |
| Sessions per player | >3 | Average play sessions |
| Time per session | >5 min | Average session length |
| Mode diversity | >30% try 2+ modes | localStorage mode flags |

### 16.2 Progression Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Character unlock rate | >10 unlocked per active player | localStorage unlocks |
| Achievement completion | >3 per active player | localStorage achievements |
| Leaderboard entries | >1 per player | localStorage leaderboard writes |
| Daily challenge completion | >50% | localStorage challenge flags |

### 16.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Crash rate | 0% | No uncaught exceptions |
| Console errors | 0 | No error-level console messages |
| Mobile compatibility | 100% of modern mobile browsers | Manual + automated testing |
| Accessibility score | >80/100 | Manual audit checklist |
| Performance | 60fps on mid-range devices | Frame rate profiling |

---

## 17. Implementation Order

### Phase 1: Foundation (Sessions 1-4)
```
Session 1:  Tutorial System
           ├── Boot sequence screen
           ├── 4-step interactive tutorial
           ├── Tutorial state persistence
           └── "DESKTOP" menu redesign (optional)
           
Session 2:  Accessibility & Settings
           ├── Full settings screen
           ├── Color blind modes (3 types)
           ├── Reduced motion option
           ├── Remappable controls
           └── Audio volume sliders
           
Session 3:  Mobile Optimization  
           ├── Touch D-pad overlay
           ├── Swipe deadzone tuning
           ├── Haptic feedback
           ├── Responsive layout
           └── Performance caps
           
Session 4:  Save System v2
           ├── Profile object structure
           ├── Auto-save on game over
           ├── Export/import JSON
           ├── v1 → v2 migration
           └── Stats tracking
```

### Phase 2: Modes (Sessions 5-12)
```
Session 5-6:  ChronoShift
             ├── Chrono-Meter HUD
             ├── History buffer (25 states)
             ├── Rewind animation sequence
             ├── Time orbs spawning
             ├── Slow-Mo / Fast-Forward / Pulse
             ├── Mode-specific audio
             └── Separate leaderboard
             
Session 7-8:  Sentinel Breach
             ├── Wave system
             ├── 4 sentinel types + AI
             ├── 8-directional movement
             ├── Nexus rendering
             ├── Combat audio
             └── Wave-based difficulty
             
Session 9-10: Grid Warfare
             ├── Two-snake simultaneous loop
             ├── Collision resolution (in order)
             ├── Round/match system
             ├── AI opponent (3 difficulties)
             ├── Character select (2-player)
             └── Victory screen
             
Session 11-12: Firewall Breach + Neural Fit
              (see Phase 2 description above)
```

### Phase 3: Content (Sessions 13-20)
```
Session 13-14: Characters 11-20 (food milestones)
Session 15-16: Characters 21-30 (easter eggs)
Session 17:     Characters 31-35 (speedrun)
Session 18:     Character skins + variants + seasonal
Session 19:     Characters 36-40 (survival)
Session 20:     Achievement system + badges
```

### Phase 4: Polish (Sessions 21-26)
```
Session 21:  Audio expansion (6 new tracks, 20+ SFX)
Session 22:  Meta-progression (season pass, titles)
Session 23:  Daily/weekly challenges
Session 24:  Replay system (ghosts, shareable codes)
Session 25:  Mode tutorials
Session 26:  Final polish pass + bug fixes
```

### Post-Development: Launch

1. **Playtesting** (1 session)
   - 5+ external playtesters
   - Feedback collection
   - Bug fixes

2. **Documentation** (0.5 session)
   - Updated README
   - Controls guide
   - All .md files updated

3. **Distribution** (0.5 session)
   - GitHub release
   - itch.io upload (if desired)
   - Version tagging

---

## Appendix A: File Inventory

```
Current Files (existing):
.
├── README.md              ← Primary documentation
├── FIELD_MANUAL.md       ← Character lore, mechanics reference
├── concepts.md           ← Design proposals, future ideas
├── CHRONOSHIFT.md        ← ChronoShift design document
├── SENTINEL_BREACH.md    ← Sentinel Breach design document
├── GRID_WARFARE.md       ← Grid Warfare design document
├── NEURAL_FIT.md         ← Neural Fit design document
├── PRICING_STRATEGY.md   ← Commercial analysis
├── LEGAL_OBSERVATIONS.md ← IP review
├── LICENSE.md           ← FDG proprietary license
├── AUDIO_MANIFEST.md     ← Audio track breakdown
├── RESET_DATA_GUIDE.md   ← Data reset instructions
├── index.html           ← Entry point
├── style.css            ← All styling
└── script.js            ← Complete game engine (3500+ lines)

New Files (to create):
.
├── MASTERPLAN.md         ← This document
├── TUTORIAL.md           ← Tutorial script and flows
├── SETTINGS.md           ← Settings reference
├── ACHIEVEMENTS.md       ← Achievement list with criteria
├── MODES.md              ← Unified mode guide
├── CHARACTERS.md         ← Full character encyclopedia
└── modules/              ← Code refactoring (optional)
    ├── audio.js
    ├── particles.js
    └── save.js
```

---

## Appendix B: Quick Reference

### Game Modes Summary
| Mode | Type | Difficulty | Unique Mechanic | Estimated Sessions |
|------|------|------------|-----------------|-------------------|
| Standard | Survival | 4 levels | Dynamic acceleration, power-ups | DONE |
| ChronoShift | Time Survival | 4 levels | Rewind, slow-mo, fast-forward | 2 |
| Sentinel Breach | Wave Defense | 4 levels | Coiling defense, wave combat | 2 |
| Firewall Breach | Environmental | 4 levels | Shrinking arena | 1 |
| Grid Warfare | Competitive | 4 levels | Two-player battle | 2 |
| Neural Fit | Rhythm/Puzzle | 6 drills | Path matching, combo system | 2 |

### Character Unlock Methods
| Method | Count | Examples |
|--------|-------|----------|
| Default | 5 | Neon Protocol, Void Walker, etc. |
| Food Milestone | 9 | 30/40/50/60/70/80/90/100+ food |
| Speedrun | 2 | Under 60s, under 45s |
| Shop Purchase | 3 | Princess, Arthropod, Kite Dragon |
| Secret Code | 1 | 9193 (1-2-3-4-5-6-7-8-0) |
| Achievement | 10 | 50 games, 500 deaths, etc. |
| Gameplay Milestone | 10 | Wave 10, top 3 leaderboards, etc. |
| Meta Progression | 10 | Season pass, 100 games, etc. |

---

*Document Version: 1.0 — 2026-05-31*
*Serpentine Development Team*
*End of Masterplan*