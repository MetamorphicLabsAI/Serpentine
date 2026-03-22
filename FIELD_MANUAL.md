# 📂 Serpentine: Field Manual (v1.0)
> **STATUS:** [FULLY UPDATED]  
> **CLASSIFICATION:** LEVEL 9 ACCESS REQUIRED

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
- **SPEED TOGGLE (9193 ONLY):** Press `9` to toggle between **90ms** and **900ms**.

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
| **SNAKES** | [EMPTY] - Future decryption available. |
| **MODES** | [EMPTY] - Future decryption available. |
| **OTHER** | Contains classified system hints/codes. |

### [OTHER INVENTORY]
- **900,000 PTS:** Decrypts the secret `9193` unlock sequence.
- **9,000,000 PTS:** Decrypts the `Master Ritual` sequence for full system access.

---

## 💾 Classified Data (Master Ritual)

### [THE 9x9 RITUAL]
To bypass all system encryptions and unlock everything:
1.  **Unlock 9193** (Cheat code: `1-2-3-4-5-6-7-8-0`).
2.  **Select 9193** in the Character Menu.
3.  Navigate to the **Main Menu**.
4.  Push **`9` exactly nine times** in a row.
5.  **HALT ALL INPUT.** Wait for **9 seconds** without touching any keys or clicking the mouse.
6.  **RESULT:** All snakes and features will be permanently decrypted.

---

## 🔧 Engineering Specifications

- **Display:** HTML5 Canvas API (Grid-based 2D rendering).
- **Physics:** Frame-independent particle system (`requestAnimationFrame`).
- **Audio:** Custom native Web Audio API synthesizer (Oscillator/Gain/Filter).
- **Persistence:** LocalStorage API for High Scores and Unlock States.
- **Aesthetics:** CSS3 Variable-driven theming with hardware-accelerated filters.
