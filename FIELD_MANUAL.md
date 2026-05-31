# 📂 Serpentine: Field Manual (v1.1)
> **STATUS:** [FULLY UPDATED — Power-Ups, Mercy System, Shop Demo Mode]
> **CLASSIFICATION:** LEVEL 9 ACCESS

This manual serves as the definitive reference for the Serpentine OS, documenting all active characters, system secrets, and operational protocols.

---

## 🐍 Character Database (Standard Units)

Each character profile (Program) has unique visual aesthetics and lore.

### [NEON PROTOCOL]
- **ID:** `neon`
- **Lore:** The original OS baseline. Reliable, bright, and fiercely fast.
- **Aesthetics:** Cyan head/body (`#00ffcc`), Magenta food (`#ff0055`), Purple accents.
- **Access:** Initial Loadout.

### [VOID WALKER]
- **ID:** `void`
- **Lore:** Born in the corrupted null-sectors of the mainframe. Siphons energy from the background.
- **Aesthetics:** Deep Purple body (`#8a2be2`), Cyan food (`#00ffff`), Magenta accents.
- **Access:** Initial Loadout.

### [GOLD-FI]
- **ID:** `gold`
- **Lore:** A luxury data-packet miner. Runs hot, blindingly bright, and leaves a trail of pure wealth.
- **Aesthetics:** Golden body (`#ffd700`), Red-Orange food (`#ff4500`), White accents.
- **Access:** Initial Loadout.

### [GLITCH-WAVE]
- **ID:** `glitch`
- **Lore:** An unstable remnant of a deleted game file. It doesn't play by the rules.
- **Aesthetics:** Magenta body (`#ff0055`), Cyan food (`#00ffcc`), Yellow accents.
- **Access:** Initial Loadout.

### [MECHA-SERPENT]
- **ID:** `mecha`
- **Lore:** Military-grade intrusion software. Designed to violently overwrite hostile firewalls.
- **Aesthetics:** Slate Grey body (`#708090`), Red food (`#ff0000`), Orange accents.
- **Access:** Initial Loadout.

---

## 🔓 Encrypted Entities (Unlockables)

Profiles that require specific milestones to decrypt.

### [CHROMATIC PUNCH]
- **ID:** `spectrum`
- **Lore:** A multi-colored shifting anomaly. Smells like fruit punch.
- **Unlock Condition:** Survive and ingest **20 units of food** in a single **Standard** attempt.
- **Special Ability:** `isShifting` enabled. The colors cycle through the HSL spectrum dynamically.

### [9193]
- **ID:** `9193`
- **Lore:** ERROR: Entity 9193 is not a snake. It is an exploit. A backdoor left open by the original developer.
- **Unlock Condition:** Input the sequence `1-2-3-4-5-6-7-8-0` on the **Main Menu**.
- **Special Status:** `isCheater` enabled.
- **Unique Stats:**
    - **Fixed Starting Length:** 9 segments (Head + 8 body).
    - **Scoring Value:** +90 per food unit.
    - **Locked Speed:** 50ms (Permanent Insane-level speed).
    - **Portal Override:** Walls act as portals; 9193 wraps to the opposite side instead of failing.
    - **Self-Phase:** 9193 can safely pass through its own segments without collision.
    - **Growth:** Does not grow past 9 segments.
    - **Leaderboard Signature:** Initials are permanently set to `CTR` (Yellow).

### [PRINCESS]
- **ID:** `princess`
- **Lore:** A brindle dachshund guest protocol. Short legs, long body, infinite loyalty. 
- **Unlock Condition:** Decrypt via the **System Shop** for `50,000 PTS`.
- **Unique Stats:** 
    - Custom Canvas-rendered anatomy (floppy ears, elongated snout, legs, wagging tail).
    - Replaces standard digital 'eat' sounds with a real **mp3-sampled** double-bark SFX.
- **Character Options:**
    - **PLAY STYLE:** Toggle between `SERPENTINE` (Classic) and `REALISTIC` (Caps growth at 5 segments).

### [ARTHROPOD]
- **ID:** `arthropod`
- **Lore:** An ancient arthropod virus with a thousand legs and no mercy. Each segment pulses with predatory instinct.
- **Unlock Condition:** Decrypt via the **System Shop** for `75,000 PTS`.
- **Aesthetics:** Neon green exoskeleton with animated legs on every segment and a stinger tail.
- **Character Options:**
    - **SKIN:** Toggle between `VENOMOUS` (Green), `INFERNO` (Fire), and `PHANTOM` (Ghostly Purple).

### [KITE DRAGON]
- **ID:** `dragon`
- **Lore:** A legendary articulated festival-kite protocol. Constructed from living pixel-silk and crystalline spikes, it glides through the grid with geometric grace.
- **Unlock Condition:** Decrypt via the **System Shop** for `100,000 PTS`.
- **Aesthetics:** Crystalline star-head, overlapping triangular spikes, and articulated crawling limbs.
- **Special Effect:** Emits flickering ember particles from the head during movement.

---

## ⚙️ Operational Modes

### [STANDARD MODE]
The baseline gameplay experience across four severity levels.

| Level | Tick Rate (Speed) | Acceleration |
| :--- | :--- | :--- |
| **EASY** | 180ms | Dynamic increase (min 90ms) |
| **MEDIUM** | 120ms | Dynamic increase (min 60ms) |
| **HARD** | 80ms | Dynamic increase (min 40ms) |
| **INSANE** | 50ms | Dynamic increase (min 25ms) |

---

## 🕹️ Control Matrix

### [MENU NAVIGATION]
- **NAVIGATE:** `WASD` / `Arrow Keys`
- **SELECT/CONFIRM:** `Spacebar` / `Enter`
- **GO BACK:** `Escape` / `Backspace`
- **SCAN CHARACTERS:** `A/D` or `Left/Right Arrows` (Character Select Only)

### [IN-GAME]
- **DIRECTIONAL:** `WASD` / `Arrow Keys`
- **TOUCH:** Screen-wide fluid swipe detection.

---

## 🏆 Leaderboard Protocols

The system maintains a **Top 10** local board for each difficulty.

1. **Qualification:** Achieve a score higher than the 10th slot on the relevant difficulty board.
2. **Initials Entry:** 3-character slot system.
    - `Up/Down` to cycle alphabet.
    - `Left/Right` to switch slots.
    - `Enter/Space` to submit.
3. **Storage:** Persisted locally via `serpentineLB_[difficulty]` in `localStorage`.

---

## 🏦 System Shop & Point Bank

Points earned across all game sessions are accumulated into a global **Point Bank**.

### [BANK PROTOCOLS]
- **Accumulation:** Total from every `SYSTEM FAILURE` (Game Over) is added to `serpentineBank`.
- **Persistence:** Local browser storage.

### [SHOP SUB-SECTORS]
| Sector | Inventory |
| :--- | :--- |
| **SNAKES** | Includes `PRINCESS`, `ARTHROPOD`, and `KITE DRAGON`. |
| **MODES** | Includes `CHRONOSHIFT`, `FIREWALL BREACH`, `SENTINEL BREACH`, `GRID WARFARE`, `Trace Protocol`. All currently in testing/available status. |
| **OTHER** | Contains classified system hints/codes. |

### [SHOP DEMO MODE]
Each mode in the MODES shop has a **DEMO** button that plays a 15-second automated showcase of that mode's core mechanics. Demos run on a canvas overlay with a progress bar and SKIP button. No user input required — pure cinematic preview to help players understand a mode before committing.

| Mode | Demo Highlights |
| :--- | :--- |
| **CHRONOSHIFT** | Snake auto-playing, chrono meter charging, SLOW-MO activation at ~5s, REWIND at ~10s with ghost trail and screen flash |
| **SENTINEL BREACH** | Sentinels spawning from edges and closing in on center nexus, player snake coiling defensively |
| **GRID WARFARE** | Two AI snakes (cyan vs magenta) battling over food, arena borders and center line |
| **Trace Protocol** | Ghost trail drill path with active target ring, player snake tracking a figure-8 pattern |
| **FIREWALL BREACH** | Firewall pushing from top, breach pattern animating, snake eating to push it back |

### [OTHER INVENTORY]
- **900,000 PTS:** Decrypts the secret `9193` unlock sequence.
- **9,000,000 PTS:** Decrypts the `Master Ritual` sequence for full system access.

---

## ⚡ Power-Up System

Power-ups spawn as glowing orbs on the grid alongside regular food. When collected, they grant a timed enhancement to the snake's capabilities. Only **one power-up can be active at a time** — collecting a new one replaces the current.

### [POWER-UP TYPES]

| Type | Color | Duration | Effect |
| :--- | :--- | :--- | :--- |
| **SHIELD** | Blue `#4488ff` | 10 seconds | Own-body collision disabled — snake can safely pass through its own segments |
| **SPEED BOOST** | Yellow `#ffdd00` | 8 seconds | Tick rate multiplied by ×1.5 — snake moves significantly faster |
| **GHOST** | White `#ffffff` | 5 seconds | Snake rendered at 45% opacity and can pass through its own segments and walls |
| **MAGNET** | Purple `#aa44ff` | 8 seconds | Food is gravitationally attracted to the snake's head within a 5-cell radius, easing collection |
| **DOUBLE EAT** | Green `#44ff88` | 10 seconds | Eating food awards double score points and double segment growth per food consumed |

### [SPAWN RULES]
- Power-ups spawn with a **~15% probability** each time food is placed.
- Only **one power-up item** can exist on the grid at any time.
- Power-up items are drawn as **pulsing glowing orbs** with a distinct color per type and a bright white inner core.
- Power-ups **do not affect** the Chrono-Meter or any other temporal systems.

### [ACTIVE POWER-UP HUD]
When a power-up is collected, the header displays:
- A **POWER-UP** label showing the active power-up's name in its color
- A **countdown bar** that depletes in real-time, colored to match the active power-up type

### [PICKUP EFFECTS]
- **Sound:** Ascending sine wave sweep (440Hz → 1320Hz, 200ms)
- **Particles:** 25-particle burst in the power-up's color
- **Popup:** Power-up name + "ACTIVATED" displayed as a centered scale-in/scale-out notification

### [INTERACTION WITH OTHER SYSTEMS]
- **SHIELD** and **GHOST** both disable own-body collision, stacking no additional effect when combined.
- **DOUBLE EAT** applies before the growth cap check (e.g., Princess in Realistic mode), meaning two segments are added then the cap is enforced.
- **SPEED BOOST** interacts with the per-food acceleration curve — both the base speed and the boost multiplier apply simultaneously, making late-game SPEED BOOST extremely fast.
- Power-up state **persists through mercy** — if you use mercy, the active power-up is cleared and must be re-collected.

---

## ⚖️ Mercy System

The Mercy System provides a single second chance per run when the snake dies, allowing the player to continue rather than ending the run immediately.

### [CONTINUE BUTTON]
- On **SYSTEM FAILURE** (game over), if `score > 0`, a "CONTINUE (½ SCORE)" button appears on the overlay.
- If score is `0`, the button is hidden — no mercy available for zero-score runs.

### [ON ACTIVATION — WHAT RESETS]
When "CONTINUE" is pressed:

| Attribute | After Mercy |
| :--- | :--- |
| **Score** | Halved (rounded down) — `score = Math.floor(score / 2)` |
| **Snake** | Reset to 3 segments — head stays at current position, 2 body segments placed ahead in current direction |
| **Speed** | Reset to base difficulty tick rate |
| **Power-up** | Cleared — `deactivatePowerUp()` called, HUD indicator hidden |
| **Mercy flag** | `mercyAvailable = false` — cannot be used again this run |

### [ON ACTIVATION — WHAT PERSISTS]
| Attribute | Unchanged |
| :--- | :--- |
| **Chrono-Meter** | Carries over at current value (CHRONOSHIFT only) |
| **High Score** | Already saved at point of death |
| **Bank** | Already accumulated at point of death |
| **Unlocked characters** | Full state preserved |

### [RUN RESET]
When a new game starts (`startGame()` called):
- `mercyAvailable` is set to `false`
- `activePowerUp` and `powerUpFood` are cleared
- `deactivatePowerUp()` hides the HUD indicator

### [STRATEGIC NOTES]
- Mercy is designed to feel **fair but costly** — halving score is a real consequence, not a free pass.
- The reset to 3 segments means the player must rebuild their defensive length.
- Speed resets remove the late-game velocity that may have contributed to the death.
- Mercy carrying the Chrono-Meter forward (CHRONOSHIFT) makes the mercy choice more interesting — a player with a full chrono buffer has real strategic reason to use mercy over a clean restart.

---

## 💾 Classified Data (Master Ritual)

### [THE 9x9 RITUAL]
To bypass all system encryptions and unlock everything:
1.  **Unlock 9193** (Cheat code: `1-2-3-4-5-6-7-8-0`).
2.  **Select 9193** in the Character Menu.
3.  Navigate to the **Main Menu**.
4.  **Hold the `9` key for 9 seconds** without pressing any other keys or mouse clicks.
5.  **RESULT:** All snakes and features will be permanently decrypted.

---

## 🔧 Engineering Specifications

- **Display:** HTML5 Canvas API (Grid-based 2D rendering).
- **Physics:** Frame-independent particle system (`requestAnimationFrame`).
- **Audio:** Custom native Web Audio API synthesizer (Oscillator/Gain/Filter).
- **Persistence:** LocalStorage API for High Scores and Unlock States.
- **Aesthetics:** CSS3 Variable-driven theming with hardware-accelerated filters.
