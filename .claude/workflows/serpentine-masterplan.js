export const meta = {
  name: 'serpentine-masterplan',
  description: 'Execute the full Serpentine OS v3.0 masterplan across all 4 phases',
  phases: [
    { title: 'Audit', detail: 'Scout current codebase state' },
    { title: 'Phase1', detail: 'Foundation: Tutorial, Settings, Mobile, Save v2' },
    { title: 'Phase 2', detail: 'Mode Expansion: ChronoShift, Sentinel, Grid Warfare, Breach, Trace Protocol' },
    { title: 'Phase 3', detail: 'Content: 30 new characters + Achievement System' },
    { title: 'Phase 4', detail: 'Polish: Audio, Meta-progression, Challenges, Replay, Final Polish' }
  ]
};

// Script body starts here — plain JavaScript only, no type annotations

phase('Audit');

const auditResult = await agent(`
You are a senior game developer auditing the Serpentine codebase at C:\\Users\\rickm\\Projects\\Serpentine.

MISSION: Perform a thorough audit of the current implementation to understand exactly what exists vs what's planned.

READ these files and produce a structured audit report:
1. index.html — entry point, DOM structure
2. style.css — all styling
3. script.js — main game engine (read fully, it's the core)

For each system, categorize status: IMPLEMENTED | PARTIAL | MISSING | DESIGNED_BUT_NOT_IMPLEMENTED

AUDIT CHECKLIST:
- Game modes: Which of Standard/ChronoShift/Sentinel Breach/Grid Warfare/Firewall Breach/Trace Protocol are working?
- Characters: How many of the 40 are implemented? List each one found.
- Audio: What tracks and SFX exist? Read the audio synthesis code.
- UI screens: Which menus/screens exist (main menu, game over, leaderboard, shop, character select, settings)?
- Persistence: What localStorage keys are used? What save system version?
- Particle system: How is it implemented?
- Controls: Keyboard, touch, swipe — what's wired up?
- Power-ups: Which types exist?
- Difficulty levels: Which tick rates?

Also grep for any TODO/FIXME/HACK comments and list them.

Output JSON with fields: implemented[], missing[], partial[], todoFixeHacks[], codeQuality, priorityFixes[], charactersFound[], audioTracks[], sfxCount, localStorageKeys[], gameModes[], powerUps[], difficulties[]
`, { label: 'audit:full-codebase', phase: 'Audit', schema: {
  type: 'object',
  properties: {
    implemented: { type: 'array' },
    missing: { type: 'array' },
    partial: { type: 'array' },
    todoFixeHacks: { type: 'array' },
    codeQuality: { type: 'string' },
    priorityFixes: { type: 'array' },
    charactersFound: { type: 'array' },
    audioTracks: { type: 'array' },
    sfxCount: { type: 'number' },
    localStorageKeys: { type: 'array' },
    gameModes: { type: 'array' },
    powerUps: { type: 'array' },
    difficulties: { type: 'array' }
  },
  required: ['implemented','missing','partial','charactersFound','audioTracks','localStorageKeys','gameModes','powerUps','difficulties']
}});

log('Audit complete. Found ' + (auditResult.charactersFound ? auditResult.charactersFound.length : 0) + ' characters, ' + (auditResult.gameModes ? auditResult.gameModes.length : 0) + ' game modes. Proceeding to Phase 1...');

// ── PHASE 1: Foundation (Sessions 1-4) ───────────────────────────────────────
phase('Phase 1');

// Fan out 4 parallel agents for the 4 foundation sessions
const [tutorial, settings, mobile, savev2] = await parallel([
  // Session 1: Tutorial System
  () => agent(`
You are a senior game developer implementing the Tutorial System for Serpentine (a cyberpunk snake arcade game).
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Sections 4 (Session 1)

CURRENT STATE: Audit found — game modes: ${JSON.stringify(auditResult.gameModes)}, characters: ${JSON.stringify(auditResult.charactersFound)}

TASK: Implement a complete first-time tutorial system.

SPEC:
1. BOOT SEQUENCE screen — "INITIALIZING SERPENTINE OS..." with fake progress bar, then transitions to welcome
2. WELCOME screen — "Welcome to Serpentine OS, Operator" with narrative framing
3. 4-step interactive tutorial:
   - Step 1: Movement (highlight WASD/Arrow keys, player moves freely for 5 moves)
   - Step 2: Eat Food ("Collect DATA FRAGMENTS", food spawns, player eats 1)
   - Step 3: Avoid Death ("Don't hit walls or your own code", show slow-mo death replay)
   - Step 4: Power-Ups ("Power-ups spawn occasionally", show each type briefly)
4. TUTORIAL COMPLETE screen — "You understand the basics. Good luck, Operator."
5. Store tutorial state in localStorage (serpentineTutorialComplete)
6. Skip button for returning players
7. Tutorial re-accessible from SETTINGS menu
8. All text uses OS/narrative framing ("DATA FRAGMENTS" not "food")

IMPLEMENTATION APPROACH:
- Add tutorial state machine to script.js
- Add tutorial HTML/CSS to index.html and style.css
- Use the existing canvas for tutorial step2 (food collection demo)
- Tutorial flow: BOOT → WELCOME → STEP1 → STEP2 → STEP3 → STEP4 → COMPLETE → GAME
- The game can be running in background during tutorial steps 1-2 (free movement)
- Step 3 triggers a simulated death with slow-mo replay
- Step 4 shows power-up icons with descriptions

CONSTRAINTS:
- Must work with existing game engine architecture
- Must preserve all existing functionality
- Tutorial must be completable in <3 minutes
- OS/narrative framing on ALL text

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase1:tutorial', phase: 'Phase 1', isolation: 'worktree' }),

  // Session 2: Accessibility & Settings
  () => agent(`
You are a senior game developer implementing the Settings & Accessibility System for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 4 (Session 2)

TASK: Implement a complete settings screen with full accessibility features.

SPEC — Settings Screen:
SETTINGS
├── AUDIO
│   ├── Music Volume: slider 0-100
│   ├── SFX Volume: slider 0-100
│   └── Mute on Focus Loss: ON/OFF
├── VIDEO
│   ├── Scanlines: ON/OFF
│   ├── Screen Shake: ON/OFF
│   ├── Particle Effects: HIGH/MEDIUM/LOW/OFF
│   └── Fullscreen: TOGGLE
├── CONTROLS
│   ├── Keyboard Scheme: WASD / ARROWS / CUSTOM
│   ├── Touch Controls: ON/OFF
│   ├── Swipe Sensitivity: LOW / MEDIUM / HIGH
│   └── Remap Controls: OPEN REMAPPER
├── ACCESSIBILITY
│   ├── Color Blind Mode: NONE / PROTANOPIA / DEUTERANOPIA / TRITANOPIA
│   ├── High Contrast Mode: ON/OFF
│   ├── Screen Reader: ON/OFF
│   └── Reduced Motion: ON/OFF
└── DATA
    ├── Export Save Data: DOWNLOAD
    ├── Import Save Data: UPLOAD
    ├── Reset Progress: DANGER ZONE — requires confirmation x2
    └── Version: v1.0.0

COLOR BLIND MODE IMPLEMENTATION:
- Apply SVG filter matrices to canvas (Protanopia/Deuteranopia/Tritanopia)
- Protanopia: #00ffcc → #00cccc, #ff0055 → #ffaa00
- Deuteranopia: #00ffcc → #00ccaa, #ff0055 → #ff9900
- Tritanopia: #00ffcc → #00ffaa, #ff0055 → #ff5599
- UI text gains underlines/color+icon combinations (never color alone for meaning)

REDUCED MOTION:
- When ON: disable screen shake, reduce particle counts, disable scanline animation
- Keep all gameplay functional

CONTROL REMAPPER:
- Allow rebinding: UP, DOWN, LEFT, RIGHT, PAUSE
- Show current bindings, click to rebind
- Validate no duplicate bindings

EXPORT/IMPORT:
- Export: serialize saveProfile to JSON, download as .serpentine file
- Import: file upload, validate JSON structure, apply to localStorage
- Reset: double-confirmation modal ("Are you sure?" → "This cannot be undone. Type RESET to confirm")

CONSTRAINTS:
- Settings must persist to localStorage immediately on change
- All settings must have working fallbacks if localStorage is unavailable
- Settings screen must be navigable via keyboard only
- No console errors

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase1:settings', phase: 'Phase 1', isolation: 'worktree' }),

  // Session 3: Mobile Optimization
  () => agent(`
You are a senior game developer implementing Mobile Optimization for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 4 (Session 3)

TASK: Optimize the game for mobile devices with touch controls and responsive layout.

SPEC:
1. DEDICATED TOUCH D-PAD OVERLAY
   - Show on-screen D-pad for mobile devices
   - Positioned at bottom of screen for thumb reach
   - Semi-transparent, neon-styled to match game aesthetic
   - 4 directional buttons in cross layout
   - Also a PAUSE button

2. SWIPE DEADZONE
   - Minimum 30px swipe before registering direction change
   - Prevents accidental direction changes
   - Configurable sensitivity in settings

3. HAPTIC FEEDBACK
   - navigator.vibrate() for food collection (10ms)
   - navigator.vibrate() for death (100ms pattern)
   - navigator.vibrate() for menu navigation (5ms)
   - Graceful fallback if vibration API unavailable

4. RESPONSIVE CANVAS
   - Scale canvas to fit mobile screen while maintaining aspect ratio
   - Detect mobile via: touch events, screen width < 768px, user agent
   - Show mobile-specific layout when mobile detected
   - Portrait mode: show "Please use landscape" prompt
   - Landscape mode: full game canvas

5. MOBILE MENU LAYOUT
   - Stack menu buttons vertically
   - Larger touch targets (min 48px height)
   - Bigger text for readability
   - Touch-friendly spacing

6. PERFORMANCE CAPS
   - Cap particles at 50 on mobile (vs 200 on desktop)
   - Reduce shadow blur on mobile
   - Cap requestAnimationFrame to 30fps on battery-saver mode
   - Detect low-end devices via navigator.hardwareConcurrency <= 4

7. FULLSCREEN API
   - Implement requestFullscreen() for immersive mobile play
   - Toggle button in settings and game HUD
   - Handle fullscreen change events gracefully
   - Show exit fullscreen button when in fullscreen

8. TOUCH BUTTON OVERLAY IN GAME
   - D-pad visible during gameplay
   - Semi-transparent (opacity: 0.6)
   - Position: bottom-left for left thumb, bottom-right for pause
   - Glow effect matching selected character colors

CONSTRAINTS:
- Must not break desktop keyboard/mouse controls
- Touch controls must not interfere with keyboard input
- Performance must stay above 30fps on low-end mobile
- All touch targets must be at least 44x44px

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase1:mobile', phase: 'Phase 1', isolation: 'worktree' }),

  // Session 4: Save System v2
  () => agent(`
You are a senior game developer implementing Save System v2 for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 4 (Session 4) and Section 10 (Save System & Persistence)

TASK: Implement a comprehensive v2 save system with profile structure, migration, and export/import.

SPEC — Profile Structure:
{
    meta: { version: "2.0", createdAt: timestamp, lastPlayedAt: timestamp, totalPlayTime: 0 },
    progress: { tutorialComplete: boolean, charactersUnlocked: [], achievementsUnlocked: [], currentStreak: number, longestStreak: number, lastPlayedDate: "YYYY-MM-DD" },
    scores: { standard: { easy: [], medium: [], hard: [], insane: [] }, chronoshift: { easy: [], medium: [], hard: [], insane: [] } },
    economy: { bank: number, shopPurchases: [] },
    settings: { musicVolume: 0.8, sfxVolume: 0.7 },
    stats: { totalGamesPlayed: number, totalFoodEaten: number, totalDeaths: number, highestSpeed: number, longestSnake: number, favoriteCharacter: characterId, hoursPerMode: {} },
    secrets: { cheatCodeUsed: boolean, masterRitualUsed: boolean, foundEasterEggs: [] }
}

SAVE OPERATIONS:
- Auto-save after every game over (non-blocking, runs after render)
- Save on tab close (beforeunload event)
- Export as JSON file download (.serpentine file)
- Import from file upload
- Validation on load — discard corrupted saves with user warning

MIGRATION STRATEGY:
- On first load of v2: read all v1 keys from localStorage
- Transform v1 format → v2 profile format
- Write v2 profile
- Keep v1 keys for 30 days (rollback safety)
- After 30 days, delete v1 keys

EXPORT FORMAT:
{ "serpentine_export": true, "version": "2.0", "exported_at": "ISO date", "profile": {} }

CONSTRAINTS:
- Must handle localStorage quota exceeded gracefully
- Must validate all imported data before applying
- Stats must update incrementally (not recalculate from raw data)
- Migration must be lossless (no data lost from v1)

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase1:savev2', phase: 'Phase 1', isolation: 'worktree' }),
]);

const p1Results = [tutorial, settings, mobile, savev2].filter(Boolean);
log('Phase 1 complete: ' + p1Results.length + '/4 foundation sessions implemented.');

// ── PHASE 2: Mode Expansion (Sessions 5-12) ───────────────────────────────────
phase('Phase 2');

// Fan out 4 parallel agents for the 4 mode expansion areas
const [chrono, sentinel, warfare, breachNeural] = await parallel([
  // Sessions 5-6: ChronoShift
  () => agent(`
You are a senior game developer implementing ChronoShift mode for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: CHRONOSHIFT.md (fully designed document — READ THIS FIRST)

AUDIT CONTEXT: Current game modes found: ${JSON.stringify(auditResult.gameModes)}

TASK: Implement the complete ChronoShift game mode.

KEY IMPLEMENTATION POINTS:

1. CHRONO-METER HUD
   - New HTML bar below score
   - Glowing cyan fill, max 1000 units
   - Four action buttons: Q (REWIND), W (SLOW-MO), E (FAST-FORWARD), R (PULSE)
   - Buttons grey out when insufficient chrono units
   - REWIND button pulses gold when >=500 units available

2. HISTORY BUFFER
   - Rolling array of last 25 game states
   - Each state: { snake: [{x,y}...], food: {x,y}, powerUpFood: {...}, timestamp }
   - Store every tick (120ms at medium)
   - Memory: <5KB per run

3. REWIND SYSTEM
   - Trigger: Q key when chrono >= 500
   - Animation: Freeze (0.3s) → Desaturate → "REVERSING..." → Ghost trail → State restore → 0.5s invincibility → Chrono -500
   - Score preserved, survival bonus if 10s passed

4. TIME ORBS
   - Gold pulsing orbs, distinct from food
   - Spawn every 4 seconds (medium), max 2 on grid
   - Collecting: +200 chrono units, +25 points
   - Chime sound (440Hz → 880Hz sweep, 200ms)

5. SLOW-MOTION MODE
   - Trigger: W key when chrono >= 200
   - Tick rate drops to x0.4 for 5 seconds
   - Cyan pulsing halo around snake head
   - "SLOW-MO: Xs" countdown in HUD

6. FAST-FORWARD MODE
   - Trigger: E key when chrono >= 300
   - Tick rate doubles for 5 seconds
   - Food/orb spawning suppressed
   - Blue-shift screen tint
   - "CAUGHT UP" flash on end

7. TEMPORAL PULSE
   - Trigger: R key when chrono >= 150
   - All food teleports to random new positions
   - Instant effect, no animation beyond flash

8. VISUAL THEME
   - Time trail afterimages (3 ghost segments at 20% opacity)
   - Background grid pulses cyan
   - Food gets orbit trail effect
   - Death effect: time-shatter (shards fly backward)

9. SEPARATE LEADERBOARD
   - serpentineLB_chrono_[difficulty]
   - 3-char initials, Top 10 per difficulty
   - ChronoShift scores contribute to Point Bank

10. MODE-SPECIFIC AUDIO
    - 60s procedural ambient track (A minor, tense)
    - Low bass drone, high arpeggios, reverse cymbals
    - Subtle heartbeat pulse every 4 bars
    - Distant clock ticking overlay

CONSTRAINTS:
- Must be a new mode selectable from the OS desktop
- Must not break existing Standard mode
- All chrono abilities must have clear visual/audio feedback
- History buffer must not cause memory leaks

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase2:chronoshift', phase: 'Phase 2', isolation: 'worktree' }),

  // Sessions 7-8: Sentinel Breach
  () => agent(`
You are a senior game developer implementing Sentinel Breach mode for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: SENTINEL_BREACH.md (fully designed document — READ THIS FIRST)

TASK: Implement the complete Sentinel Breach wave-defense game mode.

KEY IMPLEMENTATION POINTS:

1. MODE ENTRY
   - Available after ChronoShift unlock (or standalone in shop)
   - Mode select shows Sentinel Breach with wave-based preview

2. CORE LOOP
   - Player snake originates from center Nexus (3x3 glowing zone)
   - 8-directional movement (WASD or Arrow Keys)
   - Sentinels spawn from edges, move toward Nexus
   - Eat sentinel head → kill it (no growth)
   - Eat food → grow (defensive barrier building)
   - Any sentinel head reaching Nexus → GAME OVER

3. SENTINEL AI (4 Types)
   - PROBE: 3 segments, 250ms tick, random wandering, blue
   - SWARMER: 4 segments, 180ms tick, pathfinds to Nexus, magenta
   - HUNTER: 5 segments, 120ms tick, leads target by 2 cells, red
   - TITAN: 8 segments, 300ms tick, takes 3 food-hits to kill, orange

4. WAVE SYSTEM
   - Wave 1: 3 PROBEs
   - Wave 2: 5 PROBEs
   - Wave 3: 4 PROBEs + 2 SWARMERs
   - Wave 4: 3 PROBEs + 4 SWARMERs
   - Wave 5: 2 PROBEs + 3 SWARMERs + 1 HUNTER
   - Wave 6+: Scaling (+1 HUNTER every 2 waves, +1 TITAN every 5 waves)

5. OWN-BODY COLLISION OFF
   - Critical for defensive coiling strategy
   - Players spiral around Nexus to form barrier walls

6. NEW HUD
   - Wave number, score, sentinel count
   - Nexus health rings (optional — may simplify to 0)

7. DISTINCT AUDIO
   - Low 60Hz hum for Nexus idle
   - Digital chirp on sentinel spawn
   - Crunch on sentinel death
   - Ascending sweep on wave complete

8. SEPARATE LEADERBOARD
   - serpentineLB_sentinel_[difficulty]
   - Wave-based scoring: points per sentinel x wave multiplier

CONSTRAINTS:
- Must integrate with existing game engine architecture
- Sentinels must not spawn on player or food positions
- Wave transitions must have clear audio/visual announcement
- Performance must handle 10+ sentinels on screen

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase2:sentinel', phase: 'Phase 2', isolation: 'worktree' }),

  // Sessions 9-10: Grid Warfare
  () => agent(`
You are a senior game developer implementing Grid Warfare mode for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: GRID_WARFARE.md (fully designed document — READ THIS FIRST)

TASK: Implement the complete Grid Warfare two-player battle mode.

KEY IMPLEMENTATION POINTS:

1. TWO-SNAKE SIMULTANEOUS GAME LOOP
   - Player 1: WASD + Space
   - Player 2: Arrow Keys + Enter
   - Both snakes move simultaneously each tick
   - Walls are lethal (no wrapping)
   - Own-body collision enabled (high stakes)

2. COLLISION RESOLUTION PER TICK (in order)
   1. Check wall collision → death if out of bounds
   2. Check opponent body collision → death
   3. Check own body collision → death
   4. Check head-to-head → both die = DRAW

3. ROUND SYSTEM
   - First to 5 round wins takes the match
   - 3-second countdown between rounds
   - Independent score tracking per round

4. AI OPPONENT (Single Player)
   - Easy: Random wandering, gravitates toward food within 5 cells
   - Medium: Pathfinds to food, avoids opponent body, occasional mistakes
   - Hard: Optimal BFS pathfinding, predicts opponent, rarely mistakes

5. CHARACTER SELECT (2-Player)
   - Both players choose independently before match
   - All unlocked characters available
   - Visual distinction maintained per character

6. SCORING
   - Eat food: +5 points
   - Opponent crashes wall/self: +100 points
   - Opponent crashes YOUR body: +500 points
   - Draw (head-to-head): 0 points, both get +25 survival

7. VISUAL DISTINCTNESS
   - Cyan snake vs Magenta snake (or their character colors)
   - Center divider line
   - Wall border glow
   - Win pips (filled circles for wins out of 5)

8. SEPARATE LEADERBOARD
   - serpentineLB_warfare_[difficulty]
   - Track match wins, not individual round scores

CONSTRAINTS:
- Must support both 2-player local and 1-player vs AI
- AI difficulty selectable before match
- Input buffering must handle simultaneous keypresses
- Visual clarity: both snakes must be instantly distinguishable

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase2:warfare', phase: 'Phase 2', isolation: 'worktree' }),

  // Sessions 11-12: Firewall Breach + Trace Protocol
  () => agent(`
You are a senior game developer implementing Firewall Breach and Trace Protocol modes for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: NEURAL_FIT.md (fully designed document — READ THIS FIRST) and concepts.md Section "FIREWALL BREACH"

TASK A: Implement Firewall Breach mode.

FIREWALL BREACH SPEC:
- Red pulsing "firewall" border moves inward 1 unit every 10 seconds
- Eating food "hacks" firewall, pushing it back 1 unit
- Firewall speeds up as score increases
- Game over when playable space shrinks to nothing
- Visual: Pulsing red glow, crackling particle static, alarm-drone audio
- Separate leaderboard: serpentineLB_breach_[difficulty]
- Audio: 20s pulsing alarm track

TASK B: Implement Trace Protocol mode.

Trace Protocol SPEC:
- Pre-defined drill paths (ghost trail shows target path)
- Player must match path with correct timing
- Combo system: Perfect/Good/OK/Miss ratings
- Score x combo multiplier
- 6 drills with unlock tree: Warm Up → Figure-8 → Zigzag → Spiral → Wave → Gauntlet
- Generative ambient audio pad (D minor, calm)
- Results screen with accuracy breakdown
- Separate leaderboard: serpentineLB_neural_[difficulty]

DRILL DEFINITIONS:
1. WARM UP: Simple straight lines, 30s, 8 targets
2. FIGURE-8: Figure-8 pattern, 45s, 12 targets
3. ZIGZAG: Sharp zigzag, 40s, 10 targets
4. SPIRAL: Expanding spiral from center, 60s, 15 targets
5. WAVE: Sine wave pattern, 50s, 12 targets
6. GAUNTLET: Combination of all patterns, 90s, 20 targets

COMBO SYSTEM:
- Perfect (within 10px, correct timing): x4 multiplier, +100 points
- Good (within 20px, correct timing): x2 multiplier, +50 points
- OK (within 30px, timing +/-500ms): x1 multiplier, +25 points
- Miss: x0 multiplier, streak reset, no points

CONSTRAINTS:
- Both modes must be selectable from OS desktop
- Must not break existing SVG filter/color blind support
- Trace Protocol must have clear path preview that doesn't obscure gameplay
- Firewall Breach visual effects must not cause performance issues

Output: Full implementation with file-level diffs for both modes. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase2:breach-neural', phase: 'Phase 2', isolation: 'worktree' }),
]);

const p2Results = [chrono, sentinel, warfare, breachNeural].filter(Boolean);
log('Phase 2 complete: ' + p2Results.length + '/4 mode expansion areas implemented.');

// ── PHASE 3: Content Depth (Sessions 13-20) ───────────────────────────────────
phase('Phase 3');

const [chars11_20, chars21_30, chars31_40, achievements] = await parallel([
  // Sessions 13-14: Characters 11-20 (Food Milestones)
  () => agent(`
You are a senior game developer implementing Characters 11-20 for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 6 (Sessions 13-14) and Section 8 (Character Roster)

TASK: Implement characters 11-20 as food-milestone unlocks.

CHARACTERS TO IMPLEMENT:
| ID | Name | Unlock | Color Pattern | Notes |
|11 | Crimson Fang | 30 food Standard | Deep Red #8B0000 / Black | Aggressive, sharp angular head |
| 12 | Cobalt Grid | 40 food Standard | Cobalt #0047AB / Silver | Cold, geometric, angular |
| 13 | Emerald Core | 50 food Standard | Bright Green #00FF00 / Lime | Organic, flowing animation |
| 14 | Void Star | 60 food Standard | Pitch Black #000000 / Violet Strobe | Inverted colors, strobe effect |
| 15 | Plasma Hydra | 70 food Standard | Hot Orange #FF4500 / Purple | Multi-head visual (one actual head, decorative tails) |
| 16 | Monochrome | 80 food Standard | White/Gray/Black #FFFFFF | Classic retro computer aesthetic |
| 17 | Molten Core | 90 food Standard | Yellow-Orange #FF8C00 / Red | Glowing ember particles |
| 18 | Titanium Coil | 100+ food Standard | Chrome #C0C0C0 / Steely Blue | Reflective metallic sheen |
| 19 | Quicksilver | Complete Standard under 60s | Liquid Silver #C0C0C0 / Cyan | Speed lines particle effect |
| 20 | Photon Dash | Complete Standard under 45s | Blinding White #FFFFFF / Yellow | Light streak trail |

FOR EACH CHARACTER:
1. Add to CHARACTER_REGISTRY in script.js
2. Define color palette object
3. Implement character-specific draw function (canvas rendering)
4. Implement character-specific animation (idle, moving, eating, death)
5. Add unlock condition to game logic
6. Add unlock notification/celebration effect
7. Add to character select screen
8. Add lore text for character select screen

SPECIAL RENDERING NOTES:
- Void Star: strobe effect (opacity oscillates 0.3-1.0 at 4Hz), violet glow
- Plasma Hydra: 3 decorative tail segments that follow the main body
- Monochrome: classic 8-bit aesthetic, blocky head shape
- Molten Core: ember particles emit from body continuously
- Quicksilver: horizontal speed lines behind head
- Photon Dash: vertical light streak trail, white with yellow glow

CONSTRAINTS:
- All characters must render at 60fps
- All characters must work with existing color blind modes
- All characters must have valid collision hitboxes
- Unlock animations must be celebratory but not cause performance issues

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase3:chars11-20', phase: 'Phase 3', isolation: 'worktree' }),

  // Sessions 15-16: Characters 21-30 (Secret/Easter Egg)
  () => agent(`
You are a senior game developer implementing Characters 21-30 (Secret/Easter Egg characters) for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 6 (Sessions 15-16) and Section 8 (Character Roster)

TASK: Implement characters 21-30 as secret/easter egg unlocks.

CHARACTERS TO IMPLEMENT:
| ID | Name | Unlock | Color Pattern | Notes |
| 21 | Nokia Nostalgia | Play 50 games | Pea Soup #84B500 / Dark LCD | Classic green-on-black aesthetic |
| 22 | Konami Code | Input Konami Code (Up Up Down Down...) | Red/Blue classic arcade | Pixel art snake |
| 23 | MissingNo | 500 consecutive deaths | Static Glitch / Broken Pink | Intentionally glitchy, screen tear effect |
| 24 | Dogecoin | Collect 10000 bank points total | Shiba Gold #D4A017 / IEB Blue | Comic sans font overlay |
| 25 | Binary Constrictor | Reach 500 food eaten total | Matrix Green #00FF00 | Trail leaves 0s and 1s |
| 26 | The Dev | Unlock all other characters | Glowing Gold / Royal Purple | Crown on head, most elaborate animation |
| 27 | Error 404 | Visit 404 error page (hidden URL) | Translucent / Blinking text | Snake flickers in/out |
| 28 | Blue Screen | Die 100 times | BSOD Blue #0000AA / White | Full-screen death effect |
| 29 | Scanline Samurai | Clear 10 levels in Sentinel Breach | Red #FF0000 / Phosphor Green | Katana tail appendage |
| 30 | Synthesizer | Listen to full menu song 5 times | Waveform gradient | Body ripples to audio beat |

FOR EACH CHARACTER:
1. Add to CHARACTER_REGISTRY
2. Define color palette object
3. Implement character-specific draw function
4. Implement character-specific animation
5. Add unlock condition (some are secret — no notification until unlocked)
6. Add to character select screen (some hidden until unlocked)
7. Add lore text

SPECIAL MECHANICS:
- Nokia Nostalgia: LCD pixel grid effect, limited color palette
- Konami Code: Listen for cheat code sequence globally
- MissingNo: Screen tear effect, random color glitches, broken sprite
- Dogecoin: Comic Sans overlay on all UI text, shiba face drawn
- Binary Constrictor: Trail renders "1011010" text pattern
- The Dev: Crown jewel — most detailed animation, golden particles
- Error 404: Snake flickers in/out of existence (opacity randomization)
- Blue Screen: Death triggers full BSOD animation before game over
- Scanline Samurai: Katana-shaped tail appendage drawn behind body
- Synthesizer: Body segments animate to audio beat (analyze audio data)

CONSTRAINTS:
- Secret characters must NOT appear in shop or character select until unlocked
- Konami Code must work even during gameplay
- The Dev unlock must be verified against all 29 other characters
- MissingNo glitch effects must not crash the game

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase3:chars21-30', phase: 'Phase 3', isolation: 'worktree' }),

  // Sessions 17-19: Characters 31-40 + Skins
  () => agent(`
You are a senior game developer implementing Characters 31-40, skins, variants, and seasonal characters for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 6 (Sessions 17-19) and Section 8 (Character Roster)

TASK A: Implement characters 31-40.

SPEEDRUN CHARACTERS (31-35):
| ID | Name | Unlock | Color Pattern |
| 31 | Mach Mach | Complete Insane mode under 90s | Red / Blur |
| 32 | Sonic Boom | Complete Hard mode under 60s | Shocking Blue / White |
| 33 | Quantum Leap | Complete ChronoShift without rewind | Magenta / Cyan Pulse |
| 34 | Warp Python | Complete ChronoShift Insane under 120s | Deep Purple / Starlight |
| 35 | Flash Protocol | Clear Sentinel Breach Wave 20 | Bright Yellow / Red |

SURVIVAL/ENDLESS CHARACTERS (36-40):
| ID | Name | Unlock | Notes |
| 36 | Aegis Defender | Survive 500 seconds in one Standard run | Shield icon, golden accents |
| 37 | Phoenix Protocol | Die and come back 10 times in one session | Respawn animation |
| 38 | Juggernaut | Reach 200 segments length | Slow, massive, intimidating |
| 39 | Infinity Scale | Complete 100 Standard games | Prismatic iridescent |
| 40 | Zenith Serpent | Reach top 3 on all leaderboards | Diamond crown, blazing trail |

TASK B: Implement character skins and variants.

ARTHROPOD SKINS:
- VENOMOUS (green) — already implemented
- INFERNO (fire) — particle trail effect
- PHANTOM (ghostly purple) — transparency effect

CHARACTER VARIANTS:
- Neon Protocol → Neon Classic (original green), Neon Pulse (bright white)
- Void Walker → Void Shadow (darker), Void Nova (bright burst on move)
- Glitch-Wave → Glitch Classic (solid magenta), Glitch Debug (RGB split)

TASK C: Implement seasonal characters.

SEASONAL CHARACTERS (time-limited availability):
- Pumpkin Protocol (Halloween, Oct 1-31) — Orange/black jack-o-lantern head
- Frost Serpent (Winter, Dec 1-Jan 7) — Ice blue/white, snowflake particles
- Heart Core (Valentine's, Feb 1-14) — Red/pink, heart-shaped patterns

SEASONAL LOGIC:
- Check current date on character select load
- Show seasonal characters only during their availability window
- "Seasonal" badge on character card
- If not in season: show "Available during [SEASON]" instead of unlock button

CONSTRAINTS:
- All 40 characters must be renderable
- Speedrun timers must be accurate to the millisecond
- Seasonal date checks must handle timezone correctly
- All variants must use the same base hitbox as parent character

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase3:chars31-40', phase: 'Phase 3', isolation: 'worktree' }),

  // Session 20: Achievement System
  () => agent(`
You are a senior game developer implementing the Achievement System for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 6 (Session 20) and Section 6 (Achievement Categories)

TASK: Implement a complete achievement system with categories, tracking, and rewards.

ACHIEVEMENT CATEGORIES:

MASTERY — Get good at Standard Mode
- "APPRENTICE" — Complete your first Standard run
- "COMPETENT" — Reach 100 points in Medium
- "EXPERT" — Reach 500 points in Hard
- "MASTER" — Reach 1000 points in Insane
- "LEGEND" — Reach 2000 points in Insane

CHRONOSHIFT — Time manipulation mastery
- "TEMPORAL" — Complete ChronoShift run
- "REWINDER" — Use rewind 5 times in one run
- "TIMELORD" — Survive 5 minutes in ChronoShift

COMBAT — Sentinel Breach mastery
- "GUARDIAN" — Clear Wave 10 in Sentinel Breach
- "DEFENDER" — Clear Wave 25 in Sentinel Breach
- "LEGENDARY" — Clear Wave 50 in Sentinel Breach

COMPETITIVE — Grid Warfare mastery
- "DUELIST" — Win a Grid Warfare match
- "CHAMPION" — Win 10 Grid Warfare matches
- "UNDISPUTED" — Win 50 Grid Warfare matches

COLLECTOR — Unlock all characters
- "COMPLETIST" — Unlock 10 characters
- "HARDCORE" — Unlock 25 characters
- "EVERYTHING" — Unlock all 40 characters

CHALLENGES — Special feats
- "PERFECTIONIST" — Complete a Standard run with 0 deaths
- "SPEEDRUNNER" — Complete Standard under 30 seconds
- "UNDYING" — Use mercy 10 times in one day

ACHIEVEMENT REWARDS:
- Each achievement unlocks a badge (displayed on profile)
- Every 5 achievements: +10,000 bonus bank points
- Milestone achievements (10/20/30/40): +50,000 bonus points
- Some achievements unlock characters directly (The Dev, MissingNo, etc.)

IMPLEMENTATION:

1. ACHIEVEMENT REGISTRY
   - All achievements defined with: id, name, description, category, icon, condition, reward
   - Stored in ACHIEVEMENTS object

2. TRACKING SYSTEM
   - Hook into game events (game over, food eaten, wave cleared, etc.)
   - Check achievement conditions after each relevant event
   - Increment counters for count-based achievements

3. NOTIFICATION SYSTEM
   - Toast notification when achievement unlocked
   - Achievement fanfare sound
   - Celebration particle burst
   - "NEW ACHIEVEMENT" banner on main menu

4. ACHIEVEMENTS SCREEN
   - Accessible from OS desktop
   - Grid of all achievements (locked and unlocked)
   - Locked achievements show "???" with hint
   - Progress bars for count-based achievements
   - Category tabs

5. BADGE DISPLAY
   - Badges shown on profile
   - Badges shown next to player name on leaderboards
   - Profile page shows all earned badges

CONSTRAINTS:
- Achievement checks must not impact game performance
- All achievements must be achievable through normal gameplay
- No achievements require real-money purchase
- Unlock notifications must not block gameplay

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase3:achievements', phase: 'Phase 3', isolation: 'worktree' }),
]);

const p3Results = [chars11_20, chars21_30, chars31_40, achievements].filter(Boolean);
log('Phase 3 complete: ' + p3Results.length + '/4 content depth areas implemented.');

// ── PHASE 4: Polish& Systems (Sessions 21-26) ────────────────────────────────
phase('Phase 4');

const [audio, metaProgression, challenges, replayPolish] = await parallel([
  // Session 21: Audio Expansion
  () => agent(`
You are a senior game developer implementing Audio Expansion for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 7 (Session 21) and Section 9 (Audio Architecture)

TASK: Implement new procedural audio tracks and SFX.

NEW TRACKS (Procedural, Web Audio API):

Chrono Ambient: 60s loop, Tense/time-dilated mood. Low bass drone, high arpeggios, reverse cymbals.
Sentinel Combat: 40s loop, Aggressive/driving. Distorted bass, snare hits, alarm synth.
Firewall Alarm: 20s loop, Claustrophobic/urgent. Pulsing red alarm, compressed bass, static.
Neural Calm: 80s loop, Meditative/flowing. Soft pad, gentle piano, nature sounds.
Victory Fanfare: 3s, Triumphant. Full chord sweep, brass approximation.
Game Over Requiem: 4s, Melancholic. Descending minor chord, delay.

SFX EXPANSION:
- powerup_spawn: chime when power-up appears on grid
- mercy_activate: heartbeat pulse when mercy used
- achievement_unlock: triumphant multi-voice arpeggio
- wave_complete: ascending three-tone announcement
- mode_transition: swoosh when switching modes
- button_hover: subtle blip on menu item hover
- character_unlock_cascade: multi-note sequence for character unlocks
- easter_egg_discovered: mysterious chord
- rewind: reverse sweep with static (880→220Hz, 500ms)
- slowmo_activate: doppler whoosh (200→800→200Hz, 300ms)
- fastforward_activate: speed-up sweep
- pulse_activate: instant ping
- nexus_hum: low 60Hz drone for Sentinel Breach
- sentinel_spawn: digital chirp (200→400Hz triangle, 100ms)
- sentinel_death: noise burst crunch (150ms)
- chrono_collect: chime (440→880Hz sine, 200ms)
- food_spawn: subtle spawn sound

AUDIO CONTEXT MANAGEMENT:
class SerpentineAudio {
 constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
    }
    setMasterVolume(v) { this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    setMusicVolume(v) { this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    setSFXVolume(v) { this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
    playTrack(trackName) { /* switch on trackName */ }
    stopTrack() { /* stop all oscillators */ }
    playSFX(name, options) { /* play one-shot sound effect */ }
}

CONSTRAINTS:
- All audio must be procedurally generated (no external files except princess_bark.mp3)
- All audio must respect volume settings
- Audio context must handle autoplay restrictions gracefully
- All tracks must loop seamlessly
- No audio memory leaks (oscillators must be stopped/destroyed)

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase4:audio', phase: 'Phase 4', isolation: 'worktree' }),

  // Session 22: Meta-Progression
  () => agent(`
You are a senior game developer implementing Meta-Progression System for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 7 (Session 22) and Section 6 (Profile Titles)

TASK: Implement season pass, profile titles, and meta-progression.

SEASON PASS CONCEPT (No Real Money, Points-Only):

SEASON 1: "SYSTEM LAUNCH"
- 50 tiers of rewards
- Every 10,000 bank points earned = 1 tier progress
- Track shows unlock progress visually

TIER REWARDS:
1-10: Bank point bonuses (+5,000 per tier)
11-20: New character skins (+3 per tier)
21-30: New character variants (+3 per tier)
31-40: Audio tracks unlocked for jukebox (+2 per tier)
41-50: Legendary characters, profile badges, title

MILESTONE BONUSES:
- Tier 10: +100,000 bank points
- Tier 25: +250,000 bank points
- Tier 50: +500,000 bank points + "Serpentine Pioneer" profile badge

PROFILE TITLES (displayed on leaderboards):
- "APPRENTICE" — Complete first game
- "COMPETENT" — Reach 500 points
- "EXPERT" — Reach 1000 points
- "MASTER" — Reach 2000 points
- "LEGEND" — Reach 3000 points
- "SERPENTINE PIONEER" — Tier 50 season pass
- "COLLECTOR" — All characters unlocked
- "TEMPORAL WIZARD" — 100 ChronoShift rewinds
- "SENTINEL HUNTER" — Clear Wave 50
- "COMPETITOR" — Win 50 Grid Warfare matches
- "ACHIEVER" — Unlock 40 achievements

IMPLEMENTATION:

1. SEASON TRACK UI
   - Visual track with 50 tier nodes
   - Current tier highlighted
   - Progress bar showing points to next tier
   - Claimed vs unclaimed tier states
   - Locked tiers shown greyed out

2. TIER REWARDS
   - Each tier has a specific reward
   - Unclaimed rewards shown with notification dot
   - Click to claim (instant application)
   - Tier 50: "Serpentine Pioneer" badge + title unlock

3. POINTS EARNING
   - Track all points earned across all modes
   - Every 10,000 points = 1 tier progress
   - Show "Progress: X/10,000 to next tier"
   - Points persist across sessions

4. TITLE SYSTEM
   - Player has one active title
   - Titles unlock based on achievements
   - Title appears on leaderboard next to initials
   - "Serpentine Pioneer" is the ultimate title

5. BADGE SYSTEM
   - Badges displayed on profile page
   - Badges shown on leaderboard
   - Badge categories match achievement categories

CONSTRAINTS:
- Season track must be accessible from main menu
- Progress must update in real-time as points are earned
- Unclaimed rewards must persist across sessions
- All rewards must be achievable through gameplay only

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase4:meta', phase: 'Phase 4', isolation: 'worktree' }),

  // Session 23: Daily/Weekly Challenges
  () => agent(`
You are a senior game developer implementing Daily and Weekly Challenges for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 7 (Session 23)

TASK: Implement daily and weekly challenge system.

DAILY CHALLENGE:
- One challenge per day, resets at midnight local time
- Examples:
  - "Complete a Standard run on Insane"
  - "Collect 50 food in ChronoShift"
  - "Reach Wave 15 in Sentinel Breach"
  - "Win 3 rounds in Grid Warfare"
- Reward: +25,000 bank points + special badge

WEEKLY CHALLENGE:
- One challenge per week, resets Monday
- Examples:
  - "Reach 5000 total points"
  - "Survive 10 minutes in ChronoShift"
  - "Clear Wave 30 in Sentinel Breach"
  - "Win 10 rounds in Grid Warfare"
- Reward: +100,000 bank points + exclusive character

CHALLENGE STORAGE:
{ daily: { date: "YYYY-MM-DD", challengeId: string, completed: boolean, progress: number }, weekly: { weekStart: "YYYY-MM-DD", challengeId: string, completed: boolean, progress: number } }

CHALLENGE DEFINITIONS (at least 20 each):

DAILY TEMPLATES:
- Complete Standard on [difficulty]
- Collect X food in one run
- Reach Wave X in Sentinel Breach
- Win X rounds in Grid Warfare
- Survive X seconds in ChronoShift
- Eat X power-ups in one run
- Complete a run with [character]
- Reach X score in [mode]

WEEKLY TEMPLATES:
- Complete X Standard runs
- Clear Wave X in Sentinel Breach
- Win X Grid Warfare matches
- Earn X bank points
- Unlock X characters
- Play for X total minutes
- Reach X total food eaten
- Use rewind X times in ChronoShift

IMPLEMENTATION:

1. CHALLENGE SELECTION
   - Deterministic based on date (seeded random)
   - Same challenge for all players on same day
   - Prevents gaming the system

2. PROGRESS TRACKING
   - Update progress in real-time during gameplay
   - Show progress bar on challenge card
   - "X/Y" format (e.g., "15/50 food")

3. CHALLENGE SCREEN
   - Accessible from main menu
   - Shows today's daily challenge
   - Shows current week's weekly challenge
   - Countdown to next reset
   - Completion celebration

4. REWARDS
   - Bank points added immediately on completion
   - Badge awarded
   - Exclusive character unlocked (weekly only)
   - Celebration animation and sound

5. RESET LOGIC
   - Daily: check date on game load, reset if new day
   - Weekly: check week number on game load, reset if new week

CONSTRAINTS:
- Challenges must be completable in a reasonable session
- Progress must persist across page refreshes
- Reset must happen at the correct time regardless of play session
- No challenge requires real-money purchase

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase4:challenges', phase: 'Phase 4', isolation: 'worktree' }),

  // Sessions 24-26: Replay System + Polish
  () => agent(`
You are a senior game developer implementing the Replay System and Final Polish for Serpentine.
Project: C:\\Users\\rickm\\Projects\\Serpentine
Reference: MASTERPLAN.md Section 7 (Sessions 24-26)

TASK A: Implement Replay System.

GHOST REPLAY DATA:
- Store the last 3 runs as "ghost data"
- Ghost appears in-game as translucent overlay showing your previous run
- Toggle ghost mode in settings
- Ghost data: ~500 bytes per run (snake path as compressed array of directions)

SHAREABLE REPLAYS:
- Encode run as base64 string (compressed)
- "Copy Replay Code" button on game over
- Replay code pasted on main menu plays back run as cinematic
- Replay format: { version, mode, difficulty, character, score, frames[], foodPositions[], date }

TASK B: Implement Per-Mode Tutorials.

CHRONOSHIFT TUTORIAL:
- Step 1: "The Chrono-Meter charges as you collect time orbs"
- Step 2: "REWIND (Q) rolls back 3 seconds — use it when in trouble"
- Step 3: "SLOW-MO (W) gives you more reaction time"
- Step 4: "FAST-FORWARD (E) skips bad situations"
- Step 5: "TEMPORAL PULSE (R) scrambles food positions"

SENTINEL BREACH TUTORIAL:
- Step 1: "Defend the Nexus at the center"
- Step 2: "Sentinels spawn from edges and hunt you"
- Step 3: "Eat sentinel heads to destroy them"
- Step 4: "Eat food to grow your defensive barrier"
- Step 5: "Your own coils are safe — coil around the Nexus"

GRID WARFARE TUTORIAL:
- Step 1: "Two snakes — one grid"
- Step 2: "Player 1: WASD, Player 2: Arrow Keys"
- Step 3: "First to 5 rounds wins"
- Step 4: "Head-to-head = DRAW"
- Step 5: "Trap your opponent in their own body"

TASK C: Final Polish Pass.

QUALITY CHECKLIST:
- All text has consistent terminology (OS language)
- All buttons have hover/active/disabled states
- All audio has volume controls
- All visual effects have LOW/OFF alternative
- All modes have working leaderboards
- All characters have unique animations
- All screens work on mobile
- No console errors in production
- All localStorage keys have fallback defaults
- Performance: 60fps on mid-range devices
- Accessibility: passes color blind simulation
- Touch: all interactions work with touch
- Fullscreen: works on all browsers
- Save export/import: tested successfully
- Tutorial: completable in <3 minutes

OS DESKTOP METAPHOR:
- Replace flat menu with desktop window metaphor
- "SERPENTINE OS v3.0" title bar
- Window-style program icons (STANDARD.exe, CHRONOSHIFT.exe, etc.)
- Taskbar at bottom with time, score, bank balance
- Minimize/maximize/close buttons on windows
- All UI framed as "programs" in the OS

CONSTRAINTS:
- Replay codes must be shareable and parseable
- Ghost data must not cause memory issues
- All polish items must be verified working
- OS desktop must be cohesive and polished

Output: Full implementation with file-level diffs. Mark each file changed with [FILE: filename] and show the code to add.
`, { label: 'phase4:replay-polish', phase: 'Phase 4', isolation: 'worktree' }),
]);

const p4Results = [audio, metaProgression, challenges, replayPolish].filter(Boolean);
log('Phase 4 complete: ' + p4Results.length + '/4 polish areas implemented.');

// ── FINALIZE ──────────────────────────────────────────────────────────────────
log('All 4 phases complete. Synthesizing final implementation summary...');

const summary = {
  audit: {
    charactersFound: auditResult.charactersFound ? auditResult.charactersFound.length : 0,
    gameModesFound: auditResult.gameModes ? auditResult.gameModes.length : 0,
    audioTracks: auditResult.audioTracks ? auditResult.audioTracks.length : 0,
    localStorageKeys: auditResult.localStorageKeys ? auditResult.localStorageKeys.length : 0
  },
  phase1: { sessions: 4, areas: ['Tutorial System', 'Settings& Accessibility', 'Mobile Optimization', 'Save System v2'] },
  phase2: { sessions: 8, areas: ['ChronoShift', 'Sentinel Breach', 'Grid Warfare', 'Firewall Breach + Trace Protocol'] },
  phase3: { sessions: 8, areas: ['Characters 11-20', 'Characters 21-30', 'Characters 31-40 + Skins', 'Achievement System'] },
  phase4: { sessions: 6, areas: ['Audio Expansion', 'Meta-progression', 'Daily/Weekly Challenges', 'Replay System + Final Polish'] },
  totalSessions: 26,
  estimatedHours: 52
};

return summary;
