# Trace Protocol — Mode Design Document
> **Classification:** LEVEL 9 PROTOCOL
> **Mode Type:** ENDURANCE / WELLNESS SIMULATION
> **Canonical ID:** `neural_fit`

---

## 1. Concept & Vision

Trace Protocol reimagines Serpentine as a **neural exercise routine** — a calm, rhythmic game where the snake moves through a series of predetermined "drills" rather than hunting food freely. Each drill is a hand-crafted sequence of direction inputs that the player must mirror. A glowing **target trail** shows the path to follow; the player's snake must match it. Eating food is replaced by **hitting the correct poses** at the right time. The game is less about survival and more about **focus, precision, and flow state**.

The tone is deliberately different from other modes: meditative music, soft colors, gentle particle effects. The snake is serene and fluid, not aggressive. This is the "chill" mode.

**Core Feel:** A rhythm game crossed with Snake. Like following a yoga routine encoded in neon. Score is based on accuracy and timing, not speed or length.

---

## 2. Core Concept: The Drill

### 2.1 What is a Drill?
A **drill** is a predetermined path (a series of grid cells) that the target snake traces. The player must control their snake to match the target's path as closely as possible.

- **Target Snake:** A ghost snake rendered at 40% opacity, showing the exact path to follow. It moves automatically.
- **Player Snake:** Controlled by the player via WASD or Arrow Keys.
- **Accuracy Window:** Each cell of the target path has a "hit window" — if the player's snake head enters that cell within ±200ms of when the target did, it's a **HIT**.
- **Miss:** Entering a cell too early (more than 200ms early), too late (more than 200ms late), or entering the wrong cell entirely = **MISS**.

### 2.2 Drill Structure
```
DRILL: "Figure-8 Sweep"
Duration: 20 seconds
Cells: 30 waypoints
Difficulty: Easy

→ Start at center
→ Move right 3 cells
→ Curve up 2 cells
→ Curve left 3 cells
→ Curve down 2 cells
→ Repeat (continuous loop)
```

Drills are named, timed sequences of grid movements. A drill lasts 15–30 seconds and loops continuously until the drill time expires.

### 2.3 Drill Pool (Initial Set)

| Drill Name | Duration | Complexity | Description |
| :--- | :--- | :--- | :--- |
| **Warm Up** | 15s | Easy | Straight lines, cardinal directions only, 4-cell segments |
| **Figure-8 Sweep** | 20s | Medium | Curved path, both diagonals, loops back to start |
| **Zigzag Cascade** | 20s | Medium | Rapid alternation between up-right and down-right, tight cells |
| **Spiral In** | 25s | Hard | Clockwise inward spiral, each loop shorter, ends at center |
| **Serpentine Wave** | 25s | Hard | Sinusoidal wave pattern across the grid, 3 full periods |
| **The Gauntlet** | 30s | Insane | Rapid multi-directional changes, no repeating pattern |

### 2.4 Combo System
- **Perfect Hit:** Enter cell within ±50ms of target timing — **+20 points**, combo +1.
- **Good Hit:** Enter cell within ±100ms — **+10 points**, combo +1.
- **OK Hit:** Enter cell within ±200ms — **+5 points**, combo +1 (combo resets to 1 after 3 consecutive OKs).
- **Miss:** Wrong cell or timing outside ±200ms — **+0 points**, combo reset to 0.
- **Combo Multiplier:** Score × (1 + combo × 0.1). At combo 10, that's 2× multiplier. At combo 50, that's 6× multiplier.

---

## 3. Game Flow

### 3.1 Session Structure
```
[SELECT DRILL] → [3-2-1-GO countdown] → [Drill Active — 15-30s] → [Results Screen] → [SELECT NEXT DRILL or EXIT]
```

### 3.2 Session Menu
- The drill selection is the "character select" equivalent of Trace Protocol.
- A list of drills is shown, each with:
  - **Name** (e.g., "Figure-8 Sweep")
  - **Duration** (e.g., "20s")
  - **Difficulty badge** (EASY / MEDIUM / HARD / INSANE)
  - **Best Score** (if previously played)
  - **Lock status** (some drills require reaching thresholds on prior drills)
- Unlocked by default: Warm Up, Figure-8 Sweep.
- Locked: Zigzag Cascade (requires 80% accuracy on Figure-8).
- Locked: Spiral In (requires 85% accuracy on Zigzag Cascade).
- Locked: Serpentine Wave (requires 85% on Spiral In).
- Locked: The Gauntlet (requires 90% on Serpentine Wave).

### 3.3 In-Session Scoring
| Event | Points |
| :--- | :--- |
| Perfect Hit (±50ms) | +20 × combo multiplier |
| Good Hit (±100ms) | +10 × combo multiplier |
| OK Hit (±200ms) | +5 × combo multiplier |
| Miss | 0 |
| Complete drill with 0 misses | +500 bonus ("FLAWLESS") |
| Complete drill with ≤3 misses | +200 bonus ("CLEAN") |

### 3.4 Drill Accuracy
- `Accuracy = (PerfectHits × 1.0 + GoodHits × 0.8 + OKHits × 0.5) / TotalCells`
- Displayed at end of drill as a percentage.

---

## 4. The Target Trail (Ghost Snake)

### 4.1 Rendering
- Target snake is rendered at **40% opacity** in a distinct color (`#4a4a6a` — muted purple-grey).
- Each cell along the target path has a **faint pulse** — a small expanding ring that fades, indicating "enter here at this moment".
- The trail is rendered as a continuous line connecting all waypoints.
- Future cells (more than 3 cells ahead) are rendered at **20% opacity**.
- Current target cell (active hit window) has a **brighter glow** (`#8888ff` at 80% opacity).

### 4.2 Timing Visualization
- A **moving ring** travels along the target trail at the drill's defined speed.
- The player's snake head is a solid circle; the target is a ring.
- When the ring and circle overlap in the same cell with correct timing = HIT.
- When the ring passes without the player present = MISS.

---

## 5. Player Snake Mechanics

### 5.1 Movement
- **4-directional** (no diagonals) — WASD or Arrow Keys.
- **Tick rate:** Fixed per drill (not player-settable). EASY drills: 200ms/tick. INSANE drills: 100ms/tick.
- **Own-body collision:** Disabled in Trace Protocol — player snakes follow the path and their own body is always behind them.
- **Wall collision:** If the drill path goes to a wall, the drill is designed to turn before hitting the wall. If the player hits a wall: **MISS** for the next cell.
- **Reverse direction:** Not allowed (180° reversal = MISS).

### 5.2 Visual Design
| Element | Color |
| :--- | :--- |
| Player snake head | `#00ffcc` (standard) |
| Player snake body | `#00cc99` (gradient fade toward tail) |
| Target trail (ghost) | `#4a4a6a` at 40% opacity |
| Target active cell ring | `#8888ff` at 80% opacity, pulsing |
| Perfect hit flash | `#00ffcc` burst, 50ms |
| Good hit flash | `#88ff88` burst, 50ms |
| OK hit flash | `#ffff88` burst, 50ms |
| Miss indicator | `#ff4444` cell flash, 200ms |
| Background | `#050510` (slightly bluer than standard) |
| Grid lines | `#1a1a2e` (subtler than standard) |

---

## 6. Audio Design (Web Audio API)

### 6.1 Ambient (Drill Active)
- A **gentle generative pad** — slow LFO-modulated sine wave, very low volume (0.05 gain).
- Key: D minor (calm, introspective feel).
- Volume increases slightly on perfect streaks.

### 6.2 Sound Events
| Event | Sound |
| :--- | :--- |
| Perfect Hit | Soft chime (880Hz sine, 60ms, +10ms decay) |
| Good Hit | Softer chime (660Hz sine, 50ms) |
| OK Hit | Muted blip (440Hz sine, 40ms) |
| Miss | Low thud (120Hz sine, 30ms, slight distortion) |
| Combo milestone (10, 25, 50) | Ascending arpeggio (3 notes) |
| Flawless bonus | Bright chord swell (440Hz + 660Hz + 880Hz, 400ms) |
| Drill start (countdown tick) | Soft click (800Hz, 30ms) |
| Drill end | Gentle bell fade (1200Hz, 800ms decay) |

### 6.3 Music Integration
- Trace Protocol background uses a **generative sequenced pad** rather than a looping track.
- The pad's tempo matches the drill's tick rate.
- BPM = 60000 / tick_rate_ms. EASY (200ms) = 50 BPM. HARD (120ms) = 83 BPM.

---

## 7. Particle Effects

| Event | Effect |
| :--- | :--- |
| Perfect Hit | 8 small bright particles burst from snake head, fade in 300ms |
| Good Hit | 5 particles, shorter fade (200ms) |
| Miss | Red flash on the cell, no particles |
| Combo milestone | Golden ring expands outward from snake head, fades over 500ms |
| Flawless | 30 multi-color particles rain down from top, slow fall, 2s duration |
| Drill start | White ripple emanates from center, 3 pulses |
| Drill complete | Soft white particle swirl around snake, ascending |

---

## 8. UI & HUD

### 8.1 In-Drill HUD
```
┌─────────────────────────────────────────────────────────────┐
│ DRILL: Figure-8 Sweep              COMBO: 23 (2.3×)        │
│ ACCURACY: 94.2%                    TIME: ████░░░░░░ 14s    │
└─────────────────────────────────────────────────────────────┘
```
- Top bar: drill name, combo with multiplier, running accuracy %, time remaining bar.
- The combo multiplier updates in real-time with a subtle scale animation on increase.
- Accuracy updates every cell, not every frame.

### 8.2 Results Screen
```
╔═════════════════════════════════════════════════════════════╗
║                   DRILL COMPLETE                           ║
╠═════════════════════════════════════════════════════════════╣
║  Figure-8 Sweep  •  HARD  •  20s                          ║
║                                                             ║
║  SCORE        8,340                                         ║
║  PERFECT      24                                            ║
║  GOOD         5                                             ║
║  OK           1                                             ║
║  MISS         0  ← FLAWLESS!                               ║
║                                                             ║
║  ACCURACY     100.0%  ← BEST                               ║
║  PREV BEST    87.3%                                        ║
║                                                             ║
║  [RETRY]  [OTHER DRILLS]  [MAIN MENU]                     ║
╚═════════════════════════════════════════════════════════════╝
```

### 8.3 Drill Selection Screen
- List view, not grid.
- Each drill card shows: Name, duration, difficulty badge, best score, best accuracy, lock icon if locked.
- Locked drills show requirement: "Requires 80% on Figure-8 Sweep".

---

## 9. Unlock & Progression

### 9.1 Unlock Tree
```
Warm Up (unlocked by default)
  └→ Figure-8 Sweep (unlocked by default)
        └→ Zigzag Cascade (requires 80% on Figure-8)
              └→ Spiral In (requires 85% on Zigzag Cascade)
                    └→ Serpentine Wave (requires 85% on Spiral In)
                          └→ The Gauntlet (requires 90% on Serpentine Wave)
```

### 9.2 Progression Rewards
- Completing a drill unlocks it with a **"NEW DRILL UNLOCKED"** popup (gold, pulsing).
- All progress stored in `serpentineUnlocked_neuralfit_drills` array in localStorage.
- Best score and best accuracy per drill stored in localStorage (`serpentineLB_neural_[drillname]`).

### 9.3 Shop Integration
- **UNLOCKED BY:** Not available in the shop. Pure skill-based progression.
- The shop item for Trace Protocol mode itself (if it were a purchasable mode) costs **50,000 PTS**. But since progression is skill-gated, it starts unlocked.

---

## 10. Point Bank Interaction

- Points earned in Trace Protocol **DO** contribute to the Point Bank.
- Each drill completion adds to `serpentineBank`.
- This is the primary reward loop — practice drills → earn points → unlock shop items for other modes.

---

## 11. Difficulty Across Drills

Each drill has its own inherent difficulty (tick rate):

| Drill | Tick Rate | Notes |
| :--- | :--- | :--- |
| Warm Up | 200ms | Slow, forgiving |
| Figure-8 Sweep | 160ms | Moderate |
| Zigzag Cascade | 140ms | Faster, tighter timing |
| Spiral In | 130ms | Tight curves |
| Serpentine Wave | 120ms | Long duration, consistent |
| The Gauntlet | 100ms | Maximum speed, no repeat pattern |

---

## 12. Visual Theme: Calm Neon

Trace Protocol uses a distinct visual language compared to the other modes:

| Element | Standard Mode | Trace Protocol |
| :--- | :--- | :--- |
| Background | `#050505` | `#050510` (slight blue tint) |
| Grid opacity | `rgba(26,26,46,0.5)` | `rgba(26,26,46,0.25)` (subtler) |
| Accent color | `#b026ff` | `#6677ff` (calmer purple) |
| Snake glow | `#00ffcc` | Soft white `rgba(0,255,204,0.5)` |
| Food (none in this mode) | `#ff0055` | N/A |
| Particles | Bright, explosive | Soft, slow-fading |

---

## 13. Technical Specifications

- **Grid:** 20×20 cells, 20px each, 400×400 canvas.
- **Target path:** Stored as array of `{x, y, targetTime}` — targetTime = ms since drill start when player should enter that cell.
- **Rendering:**
  - Background layer (static grid).
  - Target trail layer (ghost snake, updated every frame).
  - Target ring layer (moving indicator, animated with requestAnimationFrame).
  - Player snake layer (standard snake rendering).
  - Hit/miss FX layer (particles and flashes).
  - HUD layer (DOM overlay).
- **Input:** WASD / Arrow Keys, direction queued per tick.
- **Timing:** `performance.now()` for precise hit detection vs. target path times.
- **Collision:** No snake-to-snake collision in Trace Protocol. Grid boundary checked but drill is designed to avoid walls.
- **Audio:** Web Audio API, single AudioContext, generative pad + event sounds.
- **Persistence:** `serpentineLB_neural_[drillname]` for high scores; `serpentineUnlocked_neuralfit_drills` for drill unlock states.

---

## 14. Scope Assessment

| Component | Complexity | Notes |
| :--- | :--- | :--- |
| Drill path system | High | Predefined path arrays with timing metadata |
| Hit window timing | Medium | `performance.now()` vs. path cell target times |
| Ghost snake rendering | Medium | Opacity management, trailing, future-cell dimming |
| Combo/multiplier engine | Low | Simple score calculation |
| Unlock tree | Medium | Conditional unlock checking |
| Generative audio pad | Medium | LFO-modulated oscillator |
| Hit/Miss particle FX | Low | Reuses particle system |
| Results screen | Low | DOM overlay, score breakdown |
| Drill selection UI | Medium | List view with lock states and best scores |

**Estimated implementation:** 6–8 sessions of focused development (the generative audio and hit-timing precision are the most delicate components).

---

*Document Version: 1.0 — 2026-05-21*