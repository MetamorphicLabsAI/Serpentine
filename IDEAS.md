# Serpentine — Future Feature Ideas

> **Saved:** 2026-05-22
> **Status:** BACKLOG

---

## 🔮 Power-Up System
> **Priority:** HIGH — Implement now

Food occasionally drops colored power-up items with timed effects.

| Power-Up | Color | Duration | Effect |
| :--- | :--- | :--- | :--- |
| **SHIELD** | Blue `#4488ff` | 10s | Own-body collision disabled |
| **SPEED BOOST** | Yellow `#ffdd00` | 8s | Faster tick rate (×1.5 speed) |
| **GHOST** | White `#ffffff` | 5s | Pass through own body and walls |
| **MAGNET** | Purple `#aa44ff` | 8s | Food gravitates toward head within 5-cell radius |
| **DOUBLE EAT** | Green `#44ff88` | 10s | Eating food counts as 2 segments |

- Power-ups spawn as rare variants of regular food (~15% chance per food spawn)
- Only one power-up active at a time (new one replaces current)
- Active power-up shown in HUD with countdown timer bar
- Distinct sound and particle effect on pickup
- Visual glow/shield effect on snake while active

---

## ⚖️ Mercy System
> **Priority:** HIGH — Implement now

"Continue" option on game over to keep the run going.

| Attribute | Value |
| :--- | :--- |
| **Cost** | 50% of current score |
| **Uses** | Once per run |
| **On Continue** | Snake resets to starting length (3 segments), score halved, same difficulty/tick |
| **UI** | "CONTINUE (½ SCORE)" button on game over overlay, grayed out if score is 0 |

---

## 🎯 Combo Multiplier
> **Priority:** MEDIUM

Chain consecutive eats within 3 seconds to build a score multiplier.

| Combo | Multiplier |
| :--- | :--- |
| 3 eats | ×1.5 |
| 5 eats | ×2.0 |
| 10 eats | ×3.0 |
| 20 eats | ×4.0 |

- Combo timer resets on each eat (3-second window)
- Combo breaks if timer expires without eating
- Combo counter displayed in HUD
- Combo break triggers a visual "pop" effect
- Combo milestone sounds (×2, ×3, ×4)

---

## 🎨 Seasonal Arena Modifiers
> **Priority:** MEDIUM

Holiday-themed grid overlays and effects that cycle.

| Season | Effect | Extra |
| :--- | :--- | :--- |
| **Halloween** | Fog overlay (opacity gradient from edges), slower ambient particles | Score ×1.1 |
| **Christmas** | Snow particles falling, wrapping speed ×1.2 | Gift power-ups |
| **Summer** | Heat shimmer (CSS animation on canvas), longer/brighter days | Score ×1.0 (neutral) |
| **Valentines** | Pink grid tint, heart particles | Food spawns +20% |

- CSS overlay on canvas wrapper
- Particles rendered in a dedicated layer above canvas
- Season auto-detected from system date OR manually toggleable
- Season badge in main menu corner

---

## 🏆 Achievement Unlocks
> **Priority:** MEDIUM

Side goals beyond high scores, stored per-character and global.

| Achievement | Condition | Reward |
| :--- | :--- | :--- |
| **Speed Demon** | Clear a Hard run under 60 seconds | Unlock "FAST" mode variant |
| **Perfectionist** | Complete a full game without a single wasted segment (exact length to win) | Gold snake skin |
| **Collector** | Eat 50 total food across all sessions (per character) | `+5,000 PTS` |
| **No Mercy** | Win without using the mercy system | "Hardcore" badge |
| **Hot Streak** | Get combo ×5 or higher | "Combo King" badge |

- Achievements stored in `serpentineAchievements` localStorage object
- Achievement popup on unlock (gold burst + text)
- Achievements panel in main menu (separate from leaderboard)
- Each achievement has unique particle burst signature

---

## 🛒 Shop Expansion — Hints & Codes
> **Priority:** LOW

Classified system hints purchasable with PTS.

| Item | Cost | Effect |
| :--- | :--- | :--- |
| **Character Lore** | 5,000 PTS | Reveals full backstory for a locked character |
| **Speed Tip** | 3,000 PTS | Adds `×1.1` score multiplier permanently |
| **Hidden Room Hint** | 10,000 PTS | Reveals the 9193 cheat code hint in the shop |
| **Sentinel Weakness** | 8,000 PTS | SENTINEL BREACH: Sentinels move 10% slower |

- Hint items persist once bought (`bought*Hint` flags)
- Hint text displayed as special overlay when visiting character select
- "HINT ACQUIRED" popup on purchase

---

## 🕐 ChronoShift (Mode)
> **Priority:** LOW — See CHRONOSHIFT.md

Time manipulation mode where the snake can:
- **Rewind** — Go back 3 seconds (costs 500 points)
- **Slow-Mo** — Slow game speed ×0.5 for 5 seconds (costs 200 points)
- **Fast-Forward** — Skip 5 seconds of food spawns (costs 300 points)

Resources are earned by collecting gold time orbs during gameplay.

---

## 📊 Quality-of-Life
> **Priority:** ONGOING

- **Pause menu** — `Escape` or `P` pauses, shows resume/quit/options
- **Quick restart** — `R` key to instantly restart current character/difficulty
- **Sound toggle** — M key mutes all audio, persists via localStorage
- **Touch controls** — Mobile-friendly swipe detection (already partially in)
- **Mute individual channels** — Music vs SFX separate volume control
- **High score persistence** — Per-character, per-difficulty high scores stored separately
- **Leaderboard export** — Option to export leaderboard as text/copy to clipboard