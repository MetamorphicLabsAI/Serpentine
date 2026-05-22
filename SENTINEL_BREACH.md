# SENTINEL BREACH — Mode Design Document
> **Classification:** LEVEL 9 PROTOCOL
> **Mode Type:** ASYMMETRIC SURVIVAL / HORDE DEFENSE
> **Canonical ID:** `sentinel_breach`

---

## 1. Concept & Vision

SENTINEL BREACH flips the Snake formula: you are the **static core** — a pulsating data nexus — and waves of hostile sentinel processes close in from all directions. Each sentinel is a miniature snake that moves with basic AI, hunting your position. Your snake coils defensively around the nexus, using the classic eat-to-grow mechanic to build a longer and longer barrier wall. The longer you survive, the more the screen fills with intertwining coils and hostile entities, creating escalating visual chaos and tactical depth.

**Core Feel:** Tower-defense tension meets neon arcade aesthetic. The screen starts sparse and ends as a claustrophobic weave of hostile code and your own defensive coils.

---

## 2. Core Mechanics

### 2.1 The Nexus (Player Core)
- The **Nexus** is a 3×3 cell glowing anchor point at the screen center.
- The player snake **originates from the Nexus** — its head begins at the center, body extends outward.
- Movement is **8-directional** (cardinal + diagonal) — WASD or Arrow Keys.
- **Eating food extends the snake** as in classic mode, but the purpose shifts: you grow to form a barrier, not to score.
- **Collision with any sentinel segment = GAME OVER.**
- **Own body collision is OFF** — your own coils are safe (you can wrap around the nexus freely).

### 2.2 Sentinels (Enemy Units)
Each sentinel is a **miniature snake** (head + 2–5 body segments) with basic hunting AI:

| Sentinel Type | Segments | Speed | Behavior | Visual |
| :--- | :--- | :--- | :--- | :--- |
| **PROBE** | 3 | Slow (250ms tick) | Moves toward nexus, turns randomly at walls | Blue, thin |
| **SWARMER** | 4 | Medium (180ms tick) | Pathfinds directly toward nexus with slight zigzag | Magenta, pulsing |
| **HUNTER** | 5 | Fast (120ms tick) | Actively predicts nexus movement, leads target | Red, sharp |
| **TITAN** | 8 | Slow (300ms tick) | Spawns less frequently; takes 3 hits to destroy (eat its food drop) | Orange, large head |

Sentinels **do not eat food**. They spawn from screen edges and die when their head is eaten by the player's snake. Eating a sentinel's head yields points but **does not grow the player**.

### 2.3 Wave System
```
Wave 1:  3 PROBEs
Wave 2:  5 PROBEs
Wave 3:  4 PROBEs + 2 SWARMERs
Wave 4:  3 PROBEs + 4 SWARMERs
Wave 5:  2 PROBEs + 3 SWARMERs + 1 HUNTER
Wave 6+: Scaling formula — +1 HUNTER every 2 waves, +1 TITAN every 5 waves
```

- **Inter-wave countdown:** 5 seconds between waves with a "WAVE X INCOMING" overlay.
- **Wave announcement:** A large text overlay flashes the wave number.
- **Difficulty scaling:** Sentinel tick rate decreases by 5ms per wave (min 80ms for HUNTER, 200ms for PROBE).

### 2.4 Food System
- Food spawns **every 2 seconds** at random unoccupied cells.
- Eating food: **+1 segment length**, **+10 points**.
- Food spawn rate does not increase (pressure comes from sentinel count, not food scarcity).
- **Gold food** (rare, ~10% chance): +3 segments, +50 points.

### 2.5 Scoring
| Event | Points |
| :--- | :--- |
| Eat food | +10 (standard), +50 (gold) |
| Eat sentinel head | +100 (PROBE), +200 (SWARMER), +500 (HUNTER), +2000 (TITAN) |
| Survive 30 seconds | +300 |
| Complete a wave | +1000 |

---

## 3. Player Snake Mechanics

### 3.1 Movement
- **8-directional movement** with WASD or Arrow Keys.
- Diagonal movement allowed — snake moves on a per-cell grid but direction is 8-way.
- **Tick rate:** 120ms (consistent — does not accelerate in this mode).
- **Reverse direction** is allowed (no 180° instant turn prevention in this mode — your own coils are safe anyway).
- Snake cannot move outside the grid boundaries.

### 3.2 Collision Rules
| Collision | Outcome |
| :--- | :--- |
| Snake head → Sentinel segment | GAME OVER |
| Snake head → Sentinel head | GAME OVER |
| Snake head → Own body | **SAFE** (disabled in this mode) |
| Snake head → Wall | Blocked (cannot exit grid) |
| Sentinel → Own body | Sentinel is destroyed, +bonus points |

### 3.3 Defensive Wrapping
The strategic depth of SENTINEL BREACH comes from **coiling around the nexus defensively**. Since own-body collision is disabled, players can:
- Spiral outward from the nexus to form a protective barrier.
- Weave between sentinel paths to block their approach.
- Use long coils to create maze-like walls that sentinels cannot path through.

---

## 4. Spawning & Pathfinding

### 4.1 Sentinel Spawn Logic
- Sentinels spawn from **random edge cells** (top/bottom/left/right walls).
- Sentinels cannot spawn within **5 cells** of the nexus.
- Maximum active sentinels: **20** at any time (older sentinels that can't path are culled).

### 4.2 Basic AI Pathfinding
- PROBE: Random direction change on wall collision or random 20% chance per tick.
- SWARMER: Moves toward nexus with ±1 cell perpendicular jitter per tick.
- HUNTER: Computes direct line to nexus; moves toward nexus but leads by 2 cells in predicted nexus direction.
- TITAN: Slow direct movement toward nexus, ignores jitter.

### 4.3 Sentinel vs. Player Coil Interaction
- Sentinels treat **player body segments as solid walls** — they pathfind around coils.
- This means long defensive coils actively route sentinel movement, creating strategic channeling.
- If a sentinel becomes completely boxed in by coils with no valid move, it **dies** (dissolves in a particle burst) and awards no points.

---

## 5. Visual & Audio Design

### 5.1 Color Palette
| Element | Color |
| :--- | :--- |
| Nexus core | `#ffffff` with `#ffd700` outer glow (pulsing) |
| Player snake head | `#00ffcc` |
| Player snake body | `#00cc99` → `#006655` gradient along length |
| PROBE sentinel | `#4488ff` with `#2244aa` body |
| SWARMER sentinel | `#ff00aa` with `#aa0077` body |
| HUNTER sentinel | `#ff2200` with `#aa1100` body |
| TITAN sentinel | `#ff8800` with `#cc5500` body, larger head |
| Standard food | `#ff0055` (pulsing glow) |
| Gold food | `#ffd700` (bright pulse) |
| Background grid | `#1a1a2e` lines on `#050505` |

### 5.2 Particle Effects
- **Nexus pulse:** Continuous golden particle emission at 0.5s intervals, 8 particles per burst.
- **Sentinel death:** 20 particles burst in sentinel color, fade over 0.8s.
- **Food eat:** 15 particles burst in food color, expand outward.
- **Wave start:** Screen-edge sweep of white particles, 50 total.
- **TITAN hit:** Screen flash red (50ms), camera shake.

### 5.3 Audio Design (Web Audio API)
| Event | Sound |
| :--- | :--- |
| Nexus idle | Low 60Hz hum, constant, very subtle |
| Sentinel spawn | Digital chirp (200Hz → 400Hz sweep, 100ms) |
| Sentinel death | Crunch noise (noise oscillator, 150ms decay) |
| Eat food | Soft blip (440Hz sine, 80ms) |
| Eat gold food | Bright chord (440Hz + 660Hz + 880Hz, 150ms) |
| Wave complete | Ascending three-tone sweep (200→300→400Hz, 300ms) |
| Game over | Low descending sweep (400Hz → 60Hz, 800ms), distortion |
| Near-miss (sentinel within 1 cell) | Short high-pitched ping (1200Hz, 50ms) |

---

## 6. UI & HUD

### 6.1 In-Game HUD
```
┌─────────────────────────────────────────────────────────────┐
│ WAVE: 5    SCORE: 12,450    HIGH: 28,300    SENTINELS: 8   │
└─────────────────────────────────────────────────────────────┘
```
- Fixed top bar, translucent black background.
- Wave number, score, session high score, active sentinel count.

### 6.2 Nexus Health / Shield (Optional TBD)
- Nexus has **3 shield points** visualized as orbiting rings around the nexus.
- Taking a hit (sentinel reaches nexus center) loses 1 shield.
- At 0 shields, next sentinel contact = GAME OVER.
- **This is a TBD mechanic** — may simplify to instant GAME OVER on any sentinel reaching the nexus.

### 6.3 Pause / Game Over Overlays
- **Pause:** Darkened overlay with "SENTINEL BREACH — PAUSED" and RESUME / QUIT buttons.
- **Game Over:** Full overlay with final score, wave reached, high score comparison, initials leaderboard entry (3-character slot), RETRY / MAIN MENU buttons.

---

## 7. Difficulty Tiers

### 7.1 Easy
- Sentinel speeds: +40ms slower than base.
- Wave 1 starts at Wave 3 difficulty.
- Maximum 10 active sentinels.

### 7.2 Medium
- Base speeds as specified above.
- Maximum 20 active sentinels.

### 7.3 Hard
- Sentinel speeds: -10ms faster.
- Maximum 25 active sentinels.
- TITAN appears from Wave 3 (not Wave 5).

### 7.4 Insane
- All sentinel speeds: -20ms faster.
- Maximum 30 active sentinels.
- HUNTER leads target by 4 cells (was 2).
- Gold food disabled.

---

## 8. Unlock Condition
- **UNLOCKED BY:** 75,000 PTS in the System Shop.
- **LEADERBOARD:** Separate board for SENTINEL BREACH, Top 10 per difficulty.

---

## 9. Interaction With Other Modes

- **SENTINEL BREACH does NOT share leaderboards** with Standard mode.
- **Shop purchase of SENTINEL BREACH** unlocks the mode permanently.
- **Bank points** accumulate across all modes including SENTINEL BREACH sessions.
- **ChronoShift** (planned): A mode that manipulates time. Could interact by slowing sentinel tick rate. Low priority cross-mode integration.

---

## 10. Technical Specifications

- **Grid:** Same 20×20 grid as Standard mode (400 cells).
- **Rendering:** HTML5 Canvas, 20px cell size, 400×400 canvas.
- **Tick system:** `setInterval` per entity type (player snake at 120ms, sentinels individually timed).
- **Sentinel AI:** Runs every sentinel tick. Simple vector math for pathfinding.
- **Collision detection:** Grid-based lookup (O(1) per tick per entity).
- **Audio:** Web Audio API — single AudioContext, oscillator pool pattern for overlapping sounds.
- **Persistence:** `serpentineLB_sentinel_[difficulty]` for leaderboards; `serpentineUnlocked_sentinel` flag.

---

## 11. Scope Assessment

| Component | Complexity | Notes |
| :--- | :--- | :--- |
| Core game loop | Medium | Shares much infrastructure with Standard mode |
| 8-directional movement | Low | Single direction flag change |
| Sentinel AI | Medium | 4 behavior types, simple vector math |
| Wave spawning | Low | Timer-based, formula-driven |
| Particle system | Low | Existing particle infrastructure reused |
| Audio | Medium | 8 distinct sounds, Web Audio API |
| HUD | Low | DOM overlay, existing score display pattern |
| Leaderboard | Low | Same 3-char slot system, new storage key |

**Estimated implementation:** 5–7 sessions of focused development.

---

*Document Version: 1.0 — 2026-05-21*