# CHRONOSHIFT — Mode Design Document
> **Classification:** LEVEL 9 PROTOCOL
> **Mode Type:** TIME-MANIPULATION SURVIVAL
> **Canonical ID:** `chronoshift`
> **Status:** FULLY DESIGNED

---

## 1. Concept & Vision

CHRONOSHIFT transforms Serpentine into a **strategic resource management game** where time itself is your greatest tool — and your most contested resource. A glowing **Chrono-Meter** fills as you collect gold time orbs scattered across the grid. When danger strikes, you spend that meter to bend time: **rewind** a near-death, **slow** a gauntlet of tight corners, or **fast-forward** through a food drought to breathe. The mode lives and dies by your decisions about *when to act* and *when to hold* — a skilled player with perfect timing will dominate, while panic-spending will leave you defenseless when it matters most.

**Core Feel:** Tactical, tense, and deeply replayable. Every run is a negotiation between fear and greed — do you spend your buffer now or hold for the inevitable? The temporal visual language (time echoes, ghost trails, temporal particles) makes the player feel like a speedrunner inside their own game, crafting highlight reels frame by frame.

---

## 2. Core Mechanic: The Chrono-Meter

### 2.1 Structure
- The Chrono-Meter is a **horizontal bar** displayed in the HUD below the score.
- **Maximum capacity:** 1000 units.
- **Starting value:** 0 (must collect time orbs to charge it).
- The meter is **persistent across a run** — it doesn't reset between deaths in the same run unless you die and use mercy.

### 2.2 Time Orbs
- Gold orbs spawn at random grid positions every **4 seconds**.
- Maximum **2 time orbs** on the grid at once.
- Collecting a time orb: **+200 chrono units**.
- Time orbs have a **pulsing gold glow** and a distinct **chime sound**.
- Time orbs do **NOT** grow the snake, do **NOT** affect speed, and do **NOT** add to score — pure temporal resource.

### 2.3 Temporal Actions
| Action | Cost | Effect | Duration |
| :--- | :--- | :--- | :--- |
| **REWIND** | 500 units | Roll back 3 seconds of snake movement. Snake, food, and power-ups all revert to state from 3 seconds prior. | Instant (0.5s animation) |
| **SLOW-MO** | 200 units | Game tick rate drops to ×0.4 speed. Snake, food, and enemies all slow. | 5 seconds |
| **FAST-FORWARD** | 300 units | Skip the next 5 seconds of real time. Food and time orb spawns are suppressed during skip. Snake movement continues at normal speed. | 5 seconds of in-game time |
| **TEMPORAL PULSE** | 150 units | All food on the grid simultaneously teleports to new random positions (not on snake). Clears a cluttered area instantly. | Instant |

### 2.4 Usage Rules
- Only **one temporal action active at a time** (can't stack SLOW-MO + FAST-FORWARD).
- REWIND cannot be used if fewer than 3 seconds of game history have elapsed.
- If chrono meter is insufficient, the action button is **grayed out with a "NEED X MORE"** tooltip.
- Temporal actions are triggered by **Q (REWIND) / W (SLOW-MO) / E (FAST-FORWARD) / R (TEMPORAL PULSE)**.

---

## 3. Rewind System — The Crown Jewel

### 3.1 How It Works
When REWIND is triggered, the game **reconstructs state from the previous 3 seconds** of recorded history.

The game maintains a **rolling 3-second history buffer** stored as:
```javascript
historyBuffer = [
  { time: timestamp, snake: [...], food: {x,y}, powerUp: {...}, headPos: {x,y} },
  // ... one entry per tick, max ~25 entries for 3 seconds at 120ms tick
]
```

On REWIND trigger:
1. Gameplay **freezes** (0.3s).
2. A **visual rewind effect** plays — the snake flashes, the screen desaturates, and a "REVERSING..." text flashes.
3. The game state is popped from the history buffer and restored.
4. The chrono-meter is **permanently reduced** by 500 units.
5. If the snake was in a "dead" state at any point within the rewind window, **collision is suppressed for 0.5s** after rewind to prevent instant re-death.

### 3.2 Rewind History Visual
During a rewind, a **ghost trail** shows the snake's last 3 positions fading from bright to transparent — like a temporal echo. This effect is purely cosmetic and helps the player understand what just happened.

### 3.3 Scoring with Rewind
- **Rewinds do NOT affect score.** Score is preserved across rewind.
- Every rewind used adds a **"TEMPORAL COMEBACK"** badge to the run stats.
- Extra reward: If you rewind and then **survive for 10 more seconds**, earn **+500 bonus points**.
- This prevents rewind from being a "free escape" — you still have to play well after.

---

## 4. Slow-Motion Mode

### 4.1 Effect
- All game logic (snake movement, food spawning, time orb spawning) runs at **40% of normal speed**.
- Food and time orb animations still look smooth (interpolated) but the underlying tick is slower.
- The **SLOW-MO ring** is visible around the snake head — a cyan pulsing halo that visually communicates the mode is active.
- The HUD displays a **"SLOW-MO: Xs"** countdown with a blue progress bar.

### 4.2 Strategy
- Best used in **dense corridors** where reaction time matters most.
- Combined with a power-up (e.g., activate SHIELD then SLOW-MO), creates a powerful defensive window.
- Costs 200 chrono units — cheap enough to use proactively in tight sections.

---

## 5. Fast-Forward Mode

### 5.1 Effect
- **Time itself accelerates** — the next 5 seconds of game tick rate doubles (×2 speed).
- The screen gets a **subtle blue-shift tint** and the background grid pulses faster.
- **No food or time orbs spawn** during the skip period.
- The snake moves normally but the world around it moves faster.
- After 5 seconds, speed returns to normal. A **"CAUGHT UP"** flash appears.

### 5.2 Strategy
- Use when the grid is cluttered with food in bad positions — wait it out without risking movement.
- Can be used to **rush past a difficult section** by skipping the reaction demands.
- Best combined with high chrono reserves — it's the most "expensive" non-rewind action.

---

## 6. Temporal Pulse

### 6.1 Effect
- Instantly **scrambles all food positions** — each food item teleports to a new random unoccupied cell.
- No chrono cost refund, no score change.
- Good for when food has clustered in dangerous positions.

---

## 7. Temporal Echo Visual Theme

CHRONOSHIFT uses a distinct visual identity to sell the time-manipulation fantasy:

| Element | Normal | ChronoShift Active |
| :--- | :--- | :--- |
| Snake head glow | Solid | Pulsing with faint ring |
| Background grid | `#1a1a2e` static lines | Lines pulse outward from center, subtle cyan |
| Food | Standard pulse | Extra glow, faint orbit trail |
| Time orbs | Gold static orb | Gold orb with rotating ring particle |
| HUD bar | Hidden | Glowing cyan border, pulsing fill |
| Screen tint | None | 5% cyan overlay when SLOW-MO or FF active |
| Death effect | Particle burst | Time-shatter effect (shards fly backward) |

### 7.1 Time Trail Effect
When the snake moves, a **faint afterimage** follows the head — 3 ghost segments at 20% opacity showing where the head was 1, 2, and 3 ticks ago. This gives a physical sense of "temporal presence" and helps justify why rewind is possible visually.

### 7.2 Chrono-Meter HUD
```
CHRONO ████████████░░░░░░░░ 680/1000
[SLOW-MO: Q] [FF: W] [PULSE: E] [REWIND: R]
```
- Bar fills left-to-right with a glowing cyan gradient.
- Action labels shown on buttons below bar.
- Insufficient-cost actions are **grayed out** and show required units.
- When meter is ≥500 (rewind available), the REWIND button **pulses gold**.

---

## 8. Game Flow

### 8.1 Start of Run
- Snake starts at center, 3 segments, same as Standard mode.
- **Chrono-Meter starts at 0** — the first ~10 seconds of the run are "charging up."
- Time orbs spawn every 4s, so the first orb arrives around 4s, second at 8s.
- First meaningful rewind possible around **14 seconds into the run** (two orbs collected).

### 8.2 Running Gameplay Loop
```
Collect Time Orbs → Build Chrono Reserve → Decide: Spend or Save?
                                                    ↓
Use Rewind → Survive 10s → +500 bonus ──→ More confidence to spend next time
Use Slow-Mo → Navigate tight section → Save life without full rewind cost
Use Fast-Forward → Skip bad food layout → Reset tactical situation
                                                    ↓
                                          Higher score → More risk-taking
                                          Lower reserve → More conservative play
```

### 8.3 Death and Mercy Interaction
- If you die with chrono meter > 0 and use **MERCY** (continue), the chrono meter **carries over at its current value** — you don't lose your temporal resource.
- This makes mercy more strategically interesting — you keep your buffer.
- If you die with 0 chrono and no mercy left, run ends with final score.

---

## 9. Difficulty Scaling

### 9.1 Easy
- Time orbs spawn every 3 seconds (faster charging).
- Maximum 3 time orbs on grid.
- REWIND cost reduced to 400 units.
- Starting chrono meter: 200 units.

### 9.2 Medium
- Standard timing (orbs every 4s, max 2 on grid).
- REWIND: 500 units.
- Starting chrono meter: 0.

### 9.3 Hard
- Time orbs spawn every 5 seconds.
- Maximum 1 time orb on grid.
- REWIND cost increased to 600 units.
- Slow-Mo and FF durations reduced to 4 seconds.

### 9.4 Insane
- Time orbs spawn every 6 seconds.
- Maximum 1 time orb on grid.
- REWIND: 700 units.
- Temporal Pulse disabled.
- Snake speed accelerates 20% faster than Standard mode.

---

## 10. Scoring

| Event | Points |
| :--- | :--- |
| Eat food | +10 (standard) |
| Collect time orb | +25 (incentive to grab orbs, not purely altruistic) |
| Use REWIND | +0 (but survival rewards later) |
| Survive 10s after rewind | +500 |
| SLOW-MO active | +5 per second (passive score accumulation) |
| FAST-FORWARD completed | +200 |
| Temporal Pulse | +0 |
| Complete run (no mercy) | +1000 |
| Use all 4 action types in one run | +300 (temporal mastery bonus) |

---

## 11. Power-Up Interaction

Power-ups (from the Standard mode power-up system) **stack with temporal actions**:

| Combo | Effect |
| :--- | :--- |
| SHIELD + SLOW-MO | Slow + invincible — full 5s of safe navigation |
| GHOST + SLOW-MO | Slow + phasing — pass through everything |
| SPEED BOOST + REWIND | Rewind while moving fast — reposition after rewind is dramatic |
| DOUBLE EAT + FAST-FORWARD | Fast-forward through food drought, then double-eat on resuming |

This creates layered strategy for players who understand the systems deeply.

---

## 12. Visual Demo Mode

For players who haven't tried CHRONOSHIFT, the **MODES shop entry** includes a "DEMO" button that plays a 15-second automated showcase:

1. Snake navigates a cluttered grid.
2. Chrono meter charges to 500.
3. Snake approaches its own body (near-death).
4. REWIND triggers — screen desaturates, ghost trail plays, state reverts.
5. Snake survives — "TEMPORAL COMEBACK +500" flashes.
6. "TRY CHRONOSHIFT" CTA appears.

This auto-playable demo (no user input required) makes the mode immediately understandable before committing.

---

## 13. Unlock Condition

- **UNLOCKED BY:** 75,000 PTS in the System Shop.
- **LEADERBOARD:** CHRONOSHIFT has its own Top 10 per difficulty, tracked separately from Standard.
- **Separate bank contribution** — ChronoShift scores add to `serpentineBank` normally.

---

## 14. Technical Specifications

- **History Buffer:** Rolling array of last 25 game states (3 seconds at 120ms). Each state stores: `{ snake: [{x,y}...], food: {x,y}, powerUpFood: {...}, timestamp }`. Memory: ~25 × (snake array + 2 objects) ≈ <5KB per run.
- **Rendering:** Standard canvas + additional layer for time-trail ghost segments (drawn at 20% opacity, same snake draw path but reversed z-order).
- **Temporal Actions:** `Q/W/E/R` keys bound to `useChronoAction(type)` which checks meter and fires.
- **Fast-Forward:** Multiplies the effective tick speed by 2 via a speed multiplier variable, suppresses `placeFood()` calls.
- **Persistence:** `serpentineLB_chrono_[difficulty]` for leaderboards; `serpentineUnlocked_chrono` flag.

---

## 15. Design Philosophy — Why It Works

CHRONOSHIFT succeeds because it operates on **two emotional axes simultaneously**:

1. **Fear** — The chrono meter is your safety net, but spending it is irreversible. Every use is a gamble.
2. **Hope** — You always have something in the tank. Death isn't final if you've been disciplined.

This creates a **risk-reward loop** that rewards both conservative players (big reserves = big plays available) and aggressive players (spent meter = no safety net = tension). The mode's signature moment is the **"almost-dead rewind"** — when you see the collision coming, hit REWIND, and watch the last 3 seconds unravel in reverse and then replay on a better path. That moment, when it works, is the most satisfying thing in the game.

---

## 16. Scope Assessment

| Component | Complexity | Notes |
| :--- | :--- | :--- |
| Chrono-meter HUD + history buffer | Medium | New bar UI, rolling state array |
| REWIND state reconstruction | High | Must restore full game state, handle edge cases |
| SLOW-MO / FF speed modifiers | Low | Existing speed variable, easy multiplier |
| Temporal Pulse | Low | Teleport food, simple function |
| Time orb spawner | Low | Timer-based, max count guard |
| Temporal visual theme | Medium | Time trails, screen tints, ring effects |
| Demo mode | Low | Automated keyframe playback |
| Leaderboard | Low | New storage key, same 3-char system |

**Estimated implementation:** 6–8 sessions of focused development (REWIND reconstruction and temporal visuals are the hardest parts).

---

*Document Version: 1.0 — 2026-05-22*