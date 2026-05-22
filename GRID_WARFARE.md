# GRID WARFARE — Mode Design Document
> **Classification:** LEVEL 9 PROTOCOL
> **Mode Type:** TERRITORY CONTROL / SNAKE VS. SNAKE
> **Canonical ID:** `grid_warfare`

---

## 1. Concept & Vision

GRID WARFARE transforms Serpentine from a solo survival experience into a **two-player local battle**. Two snakes occupy the same grid simultaneously, controlled by separate input sets (Player 1: WASD + Space; Player 2: Arrow Keys + Enter). The goal is to **outlast your opponent** by being the last snake alive. Eating food makes you longer and harder to avoid, but also creates more body to potentially collide with. Wrapping around the grid is disabled — walls are instant death for both players.

**Core Feel:** Arcade fighting game meets classic Snake. Fast, tense, and immediately competitive. Every piece of food is a contested resource. Every turn is a commitment.

---

## 2. Core Mechanics

### 2.1 The Grid & Arena
- **Grid size:** 20×20 cells (same as Standard mode).
- **Walls are lethal** — no wall wrapping. Hitting any wall = instant death for that snake.
- **No own-body immunity** — colliding with your own body = instant death.
- **Player-body collision:** Hitting the opponent's body = instant death for the offender.
- **Head-to-head collision:** Both snakes die = DRAW (no points awarded to either player).

### 2.2 Player Snake Configuration

| Attribute | Player 1 (Cyan) | Player 2 (Magenta) |
| :--- | :--- | :--- |
| **Starting Length** | 3 segments | 3 segments |
| **Starting Position** | Left side (cell 3, 10) | Right side (cell 16, 10) |
| **Direction** | Faces Right | Faces Left |
| **Control** | WASD (Space = confirm/start) | Arrow Keys (Enter = confirm/start) |
| **Color Head** | `#00ffcc` | `#ff0055` |
| **Color Body** | `#00cc99` | `#cc0044` |
| **Food Color** | `#ffd700` (Gold) | `#ffd700` (Gold) |

### 2.3 Food & Growth
- Food spawns at **random unoccupied cells** every 2 seconds.
- **Maximum 3 food items** on the grid at any time.
- Eating food: **+1 segment**, **+5 points** (per player).
- Food is **shared** — either player can eat it. The last to reach it gets the benefit.
- When a snake dies, all food eaten by that snake is **forfeited** (does not transfer to opponent).

### 2.4 Scoring
| Event | Points |
| :--- | :--- |
| Eat food | +5 |
| Opponent crashes into wall | +100 |
| Opponent crashes into own body | +100 |
| Opponent crashes into your body | +500 |
| Opponent crashes into head-to-head collision | 0 (draw) |
| Survive 30 seconds (draw round) | +25 |

### 2.5 Round System
- First to **5 rounds** wins the match.
- Each round is an independent game (snakes reset to starting positions).
- 3-second countdown between rounds with "ROUND X" announcement.
- Match winner screen shows final score and "PLAY AGAIN" / "MAIN MENU" options.

### 2.6 Speed & Tick Rate
- **Base tick rate:** 120ms (Medium difficulty baseline).
- **Tick rate does not change** during the match (no acceleration).
- Both snakes move **simultaneously** on each tick.

---

## 3. Movement & Controls

### 3.1 Player 1 Controls
| Key | Action |
| :--- | :--- |
| W | Move Up |
| A | Move Left |
| S | Move Down |
| D | Move Right |
| Space | Confirm / Start |

### 3.2 Player 2 Controls
| Key | Action |
| :--- | :--- |
| ↑ | Move Up |
| ← | Move Left |
| ↓ | Move Down |
| → | Move Right |
| Enter | Confirm / Start |

### 3.3 Direction Rules
- **No 180° reversal** — a snake cannot immediately reverse direction (e.g., moving right cannot instantly go left). This prevents instant self-collision from a single input mistake.
- **Queued input** — each player's next direction is queued on keypress and executed on the next tick. This prevents direction-change race conditions.
- **Simultaneous movement** — both snakes move at the same time per tick. No player acts first; both are processed in the same tick cycle.

---

## 4. Collision & Death

### 4.1 Collision Priority (per tick, evaluated simultaneously)
1. Check each snake head against the **grid boundary** (walls) — **death** if out of bounds.
2. Check each snake head against the **opponent's body segments** (head included) — **death** if hit.
3. Check each snake head against its **own body segments** (excluding the newest segment — the current head) — **death** if self-collision.
4. Check **head-to-head collision** — both snakes die = DRAW, no points awarded.

### 4.2 Death Visuals
- Dead snake's body segments **scatter** as particles and fade over 1 second.
- Screen does a **small shake** (3px amplitude, 200ms).
- The winning snake (if any) gets a brief **brightness flash**.
- Dead snake's remaining food drops are **removed** from the grid.

### 4.3 Draw Conditions
- Both snakes die in the same tick (head-to-head, simultaneous wall+body collision).
- No winner for the round. Both players get +25 survival bonus. Round does not count toward win total.

---

## 5. Food Mechanics

### 5.1 Spawning Rules
- Food spawns at **random unoccupied cells** (not on any snake body, not on walls).
- Spawn interval: **every 2000ms**.
- Maximum on grid: **3 items**.
- Minimum distance from any snake head: **3 cells**.

### 5.2 Food Visuals
- Standard food: **Gold `#ffd700`**, circular, pulsing glow.
- Both players see the same food (no split inventory).

### 5.3 Collision Resolution
- If both snake heads arrive on the same food cell in the same tick: **drawers** (both get +5 points and +1 segment).

---

## 6. Visual & Audio Design

### 6.1 Arena Layout
- The arena is the same 400×400 canvas (20×20 grid, 20px cells).
- Walls are rendered as a **1-cell thick border** with a distinct color (`#333333`) and glow.
- The center line is marked with a **subtle dashed line** (`rgba(255,255,255,0.1)`) to give players a visual reference for the split.

### 6.2 Color Palette
| Element | Color |
| :--- | :--- |
| Background | `#050505` |
| Grid lines | `#1a1a2e` |
| Wall border | `#444444` with `#222222` glow |
| Player 1 head | `#00ffcc` |
| Player 1 body | `#00cc99` → `#006655` (gradient along length) |
| Player 2 head | `#ff0055` |
| Player 2 body | `#cc0044` → `#660022` (gradient along length) |
| Food | `#ffd700` (pulsing glow `#ff0055`) |
| Center divider | `rgba(255,255,255,0.08)` dashed line |

### 6.3 HUD (In-Game)
```
┌─────────────────────────────────────────────────────────────┐
│  P1: 0 (0)      ROUND 1/5      P2: 0 (0)                    │
│  ████████░░░░░░░░░░░░░░░░░░  vs  ░░░░░░░░░░░░░░░░░░░████    │
│  WINS: 0                          WINS: 0                    │
└─────────────────────────────────────────────────────────────┘
```
- Top bar split: Player 1 score on left, round info center, Player 2 score on right.
- Win pips below each score (filled circles for wins out of 5).
- Semi-transparent black background.

### 6.4 Particle Effects
| Event | Effect |
| :--- | :--- |
| Snake death | 40 particles burst from each body segment, fade over 1s |
| Food eaten | 12 gold particles burst outward |
| Round start countdown | 3-2-1 large centered text with scale animation |
| Victory (match win) | 100 multi-color particles rain from top, 3s duration |

### 6.5 Audio Design (Web Audio API)
| Event | Sound |
| :--- | :--- |
| Snake move tick | Subtle tick (click, 20ms, very low volume) |
| Eat food | Bright dual-tone blip (660Hz + 880Hz, 100ms, both players) |
| Snake death | Crash noise (noise burst, 300ms decay) |
| Round win | Ascending tone (300Hz → 600Hz sweep, 300ms) |
| Match win | Fanfare (three-note chord: 440Hz + 550Hz + 660Hz, 600ms) |
| Countdown tick | Click (1000Hz, 50ms) |
| Countdown GO | Higher pitched blip (1200Hz, 150ms) |

---

## 7. Pre-Match & Post-Match

### 7.1 Character Select (Same as Standard)
Each player selects a snake character independently before the match:
- **NEON PROTOCOL** (Cyan)
- **VOID WALKER** (Purple)
- **GOLD-FI** (Gold)
- **GLITCH-WAVE** (Magenta)
- **MECHA-SERPENT** (Grey)
- **CHROMATIC PUNCH** (if unlocked — cycling colors)
- **9193** (if unlocked — cheater snake)
- **PRINCESS** (if unlocked)
- **ARTHROPOD** (if unlocked)
- **KITE DRAGON** (if unlocked)

Each player's character selection changes their visual appearance in the match.

### 7.2 Match End Screen
- Winner announcement: "PLAYER X WINS THE MATCH!"
- Final scores for both players.
- "PLAY AGAIN" button (restarts with same characters).
- "NEW CHARACTERS" button (returns to character select).
- "MAIN MENU" button.

---

## 8. Difficulty Tiers

### 8.1 Easy
- Tick rate: 180ms (slower, more reaction time).
- Maximum food on grid: 5 items.
- Player 2 (Arrow Keys) uses simpler AI fallback if no input detected for 3 seconds.

### 8.2 Medium
- Tick rate: 120ms.
- Maximum food on grid: 3 items.
- No AI assistance.

### 8.3 Hard
- Tick rate: 80ms (very fast, split-second reactions).
- Maximum food on grid: 2 items.
- Player 2 is AI-controlled at Medium difficulty (see AI section).

### 8.4 Insane
- Tick rate: 50ms (maximum speed).
- Maximum food on grid: 1 item.
- Player 2 is AI-controlled at Hard difficulty.

---

## 9. AI Opponent (Single Player Mode)

### 9.1 When Active
- AI is used when Player 2 controls are idle OR when difficulty is set to Hard/Insane with no second player.

### 9.2 AI Behavior
| Difficulty | Behavior |
| :--- | :--- |
| **Easy** | Wanders randomly, avoids immediate collisions, gravitates toward food within 5 cells |
| **Medium** | Pathfinds toward nearest food, avoids opponent body, makes occasional mistakes |
| **Hard** | Optimal pathfinding to food, actively predicts opponent position, rarely makes mistakes |

### 9.3 AI Visual Distinction
- When AI is controlling Player 2, the snake has a **subtle pulsing outline** (`#ffffff` at 30% opacity) to indicate non-human control.

---

## 10. Unlock Condition
- **UNLOCKED BY:** 100,000 PTS in the System Shop.
- **LEADERBOARD:** GRID WARFARE has its own separate Top 10 per difficulty, tracking match wins (not round wins or points).

---

## 11. Interaction With Other Modes

- GRID WARFARE does **NOT** contribute to the Point Bank (no points earned — it's a competitive vs. mode, not a survival mode).
- **Character unlocks** from Standard mode apply to GRID WARFARE.
- **Shop unlocks** (PRINCESS, ARTHROPOD, KITE DRAGON, SENTINEL BREACH) apply as character options.
- **ChronoShift** (planned time-manipulation mode) could interact: slow the opponent's tick rate.

---

## 12. Technical Specifications

- **Grid:** 20×20 cells, 20px each, 400×400 total canvas.
- **Rendering:** HTML5 Canvas, per-frame render of both snakes + food + HUD.
- **Tick system:** `setInterval` at difficulty-based rate. Both snakes processed per tick.
- **Input:** `keydown` event listeners with direction queue per player.
- **Collision:** Grid-based O(1) lookup per snake head position against all opponent segments + own segments.
- **AI:** Timer-driven decision making at same tick rate. BFS pathfinding to food on Hard difficulty.
- **Audio:** Web Audio API oscillator pool.
- **Persistence:** `serpentineLB_gridwar_[difficulty]` for leaderboard; `serpentineUnlocked_gridwarfare` flag.

---

## 13. Scope Assessment

| Component | Complexity | Notes |
| :--- | :--- | :--- |
| Two-snake game loop | Medium | Shared tick system, simultaneous processing |
| Simultaneous collision resolution | High | Head-to-head, body-body, wall-body all in one tick |
| 8-directional input per player | Low | WASD + Arrows, two separate queues |
| Character select (2-player) | Medium | Two independent selections |
| AI opponent | High | BFS pathfinding, three difficulty tiers |
| Round/match system | Low | Counter-based state machine |
| HUD split display | Low | DOM overlay |
| Audio design | Medium | ~8 distinct sounds |
| Leaderboard | Low | Same 3-char system, new storage key |

**Estimated implementation:** 8–10 sessions of focused development (AI is the most time-consuming component).

---

*Document Version: 1.0 — 2026-05-21*