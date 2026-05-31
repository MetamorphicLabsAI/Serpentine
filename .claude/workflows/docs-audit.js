export const meta = {
  name: 'docs-audit',
  description: 'Audit Serpentine codebase and overhaul all documentation',
  phases: [
    { title: 'Audit', detail: 'Scan entire codebase and existing docs' },
    { title: 'Plan', detail: 'Design new docs structure' },
    { title: 'Write', detail: 'Create/update all documentation' },
    { title: 'Verify', detail: 'Verify docs accuracy' }
  ]
};

// ── PHASE 1: AUDIT ───────────────────────────────────────────────────────────────
phase('Audit');

log('Starting documentation audit...');

// Agent 1: Game State Audit - what actually exists in the code
const gameAudit = await agent(`
You are auditing the Serpentine game at C:\\Users\\rickm\\Projects\\Serpentine.

MISSION: Produce a comprehensive audit of what the game actually contains.

1. READ these files and extract ALL information:
   - index.html (the full DOM structure - every screen/button/menu)
   - script.js (the full game engine)
   - style.css (all styling)
   - audio_system.js
   - achievements.js
   - tutorial.js
   - mode_tutorials.js
   - replay_system.js
   - os_desktop.js

2. AUDIT CHECKLIST:

   A. GAME MODES - Find ALL game modes implemented:
      - Standard Mode (existing)
      - ChronoShift (time manipulation)
      - Sentinel Breach (wave defense)
      - Grid Warfare (2-player battle)
      - Firewall Breach (shrinking arena)
      - Trace Protocol (rhythm/path matching)
      For each: What buttons launch it? What HTML screens exist? What JS logic runs it?

   B. CHARACTERS - Find ALL characters in snakeProfiles or character registry:
      - Count them all
      - List each character ID, name, unlock condition
      - Note any special mechanics

   C. POWER-UPS - List all power-up types with their effects

   D. UI SCREENS - List ALL screens/overlays in index.html:
      - Every div with id, every button with id
      - Menu structure
      - Settings screens
      - Tutorial screens
      - Achievement screens

   E. AUDIO - What tracks exist? What SFX?

   F. SAVE SYSTEM - What does SaveManager persist?

   G. ACHIEVEMENTS - List all achievements and categories

   H. FEATURES - Any other notable features (challenges, season track, replay, etc.)

3. PRODUCE AUDIT REPORT as structured JSON:
{
  gameModes: [{ id, name, description, howToLaunch, htmlScreen, jsLogic }],
  characters: [{ id, name, color, unlockMethod, specialMechanic }],
  powerUps: [{ id, name, effect, color }],
  screens: [{ id, name, buttons: [] }],
  audio: { tracks: [], sfx: [] },
  achievements: [{ category, achievements: [] }],
  features: [{ name, description }],
  saveSystem: { whatItPersists: [] },
  stats: { totalCharacters, totalModes, totalAchievements, totalScreens }
}
`, { label: 'audit:game-state', phase: 'Audit', schema: {
  type: 'object',
  properties: {
    gameModes: { type: 'array' },
    characters: { type: 'array' },
    powerUps: { type: 'array' },
    screens: { type: 'array' },
    audio: { type: 'object' },
    achievements: { type: 'array' },
    features: { type: 'array' },
    stats: { type: 'object' }
  }
}});

// Agent 2: Existing Documentation Audit
const docsAudit = await agent(`
You are auditing documentation at C:\\Users\\rickm\\Projects\\Serpentine.

MISSION: Read ALL existing documentation files and assess their accuracy.

1. READ every .md file in the project:
   - README.md
   - MASTERPLAN.md
   - CLAUDE.md
   - FIELD_MANUAL.md
   - concepts.md
   - CHRONOSHIFT.md
   - SENTINEL_BREACH.md
   - GRID_WARFARE.md
   - NEURAL_FIT.md
   - AUDIO_MANIFEST.md
   - Any other .md files

2. For each doc, note:
   - What game version it describes
   - What it covers accurately
   - What's outdated or wrong
   - What's missing

3. PRODUCE:
{
  docsReviewed: [{ filename, status: 'current|outdated|missing', issues: [], notes: '' }],
  missingDocs: [filename],
  currentVersion: 'what version the game is at'
}
`, { label: 'audit:docs', phase: 'Audit', schema: {
  type: 'object',
  properties: {
    docsReviewed: { type: 'array' },
    missingDocs: { type: 'array' },
    currentVersion: { type: 'string' }
  }
}});

// ── PHASE 2: PLAN ────────────────────────────────────────────────────────────────
phase('Plan');

// Agent: Design new docs structure
const docsPlan = await agent(`
You are planning documentation for Serpentine OS game.

AUDIT RESULTS:
Game has ${gameAudit.stats.totalModes} modes, ${gameAudit.stats.totalCharacters} characters, ${gameAudit.stats.totalAchievements} achievements, ${gameAudit.stats.totalScreens} screens.

EXISTING DOCS:
${docsAudit.docsReviewed.map(d => d.filename + ' (' + d.status + ')').join(', ')}

MISSION: Design the ideal documentation structure.

1. What docs should a complete game have?
2. README.md should cover: What is this game? How do I play? What modes exist? What are the controls? What are the features?
3. What other docs are essential?

4. PROPOSE new docs structure:
[
  { filename: 'README.md', purpose: '...', sections: ['...'] },
  { filename: 'CONTROLS.md', purpose: '...', sections: ['...'] },
  ...
]

Return as JSON:
{
  proposedDocs: [{ filename, purpose, sections: [] }],
  readmeOutline: 'detailed outline for README.md'
}
`, { label: 'plan:docs-structure', phase: 'Plan', schema: {
  type: 'object',
  properties: {
    proposedDocs: { type: 'array' },
    readmeOutline: { type: 'string' }
  }
}});

// ── PHASE 3: WRITE ────────────────────────────────────────────────────────────────
phase('Write');

// Fan out 4 parallel agents to write docs
const [readme, controls, modes, characters] = await parallel([
  // README.md - The main game overview
  () => agent(`
You are writing the README.md for Serpentine OS at C:\\Users\\rickm\\Projects\\Serpentine.

Use these AUDIT RESULTS (the game actually has this):

GAME MODES: ${JSON.stringify(gameAudit.gameModes)}
CHARACTERS: ${JSON.stringify(gameAudit.characters)}
POWER-UPS: ${JSON.stringify(gameAudit.powerUps)}
ACHIEVEMENTS: ${JSON.stringify(gameAudit.achievements)}
FEATURES: ${JSON.stringify(gameAudit.features)}
AUDIO: ${JSON.stringify(gameAudit.audio)}

MUST INCLUDE:
- What is Serpentine? (cyberpunk snake arcade game)
- Screenshots/animated ASCII art (describe the visual style)
- Quick start (how to run it - just open index.html)
- Game modes overview (all 5+ modes)
- Character roster (all characters with unlock methods)
- Power-up system
- Achievement system
- Save system
- Controls (keyboard + touch)
- How to play Standard Mode (the core loop)
- Technical architecture (zero assets, procedural audio, Web Audio API)
- Browser requirements
- Contributing / License

STYLE: Write as an exciting game README. Use ASCII art/badges for visual flair. Make it readable as plain markdown.

OUTPUT: Write the COMPLETE README.md file to C:\\Users\\rickm\\Projects\\Serpentine\\README.md

Return the full file content in your response.
`, { label: 'write:readme', phase: 'Write' }),

  // CONTROLS.md - How to play
  () => agent(`
You are writing CONTROLS.md for Serpentine at C:\\Users\\rickm\\Projects\\Serpentine.

AUDIT RESULTS:
Game modes: ${JSON.stringify(gameAudit.gameModes)}
Screens: ${JSON.stringify(gameAudit.screens)}

MUST COVER:
- Keyboard controls for Standard Mode
- Keyboard controls for ChronoShift (QWER for time abilities)
- Keyboard controls for Sentinel Breach
- Keyboard controls for Grid Warfare
- Keyboard controls for Trace Protocol
- Touch controls for mobile
- Menu navigation
- Pause/unpause
- Mercy system
- Any special key combos (cheat codes, etc.)

FORMAT: Markdown table for each mode showing keys and actions.

OUTPUT: Write the COMPLETE CONTROLS.md file to C:\\Users\\rickm\\Projects\\Serpentine\\CONTROLS.md

Return the full file content in your response.
`, { label: 'write:controls', phase: 'Write' }),

  // MODES.md - Deep dive on all game modes
  () => agent(`
You are writing MODES.md for Serpentine at C:\\Users\\rickm\\Projects\\Serpentine.

AUDIT RESULTS:
GAME MODES: ${JSON.stringify(gameAudit.gameModes)}

MUST INCLUDE a section for each game mode:
For each mode:
- What is it?
- How do you win/lose?
- Unique mechanics
- Scoring system
- Difficulty levels
- Tips and strategies

MODES COVERED:
- Standard Mode
- ChronoShift
- Sentinel Breach
- Grid Warfare
- Firewall Breach
- Trace Protocol

FORMAT: Deep dive markdown doc, use headers, lists, and clear explanations.

OUTPUT: Write the COMPLETE MODES.md file to C:\\Users\\rickm\\Projects\\Serpentine\\MODES.md

Return the full file content in your response.
`, { label: 'write:modes', phase: 'Write' }),

  // CHARACTERS.md - Full character encyclopedia
  () => agent(`
You are writing CHARACTERS.md for Serpentine at C:\\Users\\rickm\\Projects\\Serpentine.

AUDIT RESULTS:
CHARACTERS: ${JSON.stringify(gameAudit.characters)}

MUST INCLUDE:
- Introduction to the character system
- Full roster table with columns: ID, Name, Unlock Method, Color, Special Mechanic
- Group characters by unlock type (Default, Shop, Milestone, Secret, Seasonal)
- Lore snippets for default characters
- Special character mechanics explained

FORMAT: Encyclopedia-style markdown doc with tables and headers.

OUTPUT: Write the COMPLETE CHARACTERS.md file to C:\\Users\\rickm\\Projects\\Serpentine\\CHARACTERS.md

Return the full file content in your response.
`, { label: 'write:characters', phase: 'Write' }),
]);

// Wait for Phase 3 agents
const p3Results = [readme, controls, modes, characters].filter(Boolean);
log('Phase 3 docs written: ' + p3Results.length + '/4');

// ── PHASE 4: VERIFY ────────────────────────────────────────────────────────────
phase('Verify');

// Agent: Verify all docs are present and accurate
const verifyResult = await agent(`
You are verifying documentation at C:\\Users\\rickm\\Projects\\Serpentine.

1. READ all newly written docs:
   - README.md
   - CONTROLS.md
   - MODES.md
   - CHARACTERS.md

2. CHECK:
   - Each doc exists
   - Each doc has substantial content (>500 chars)
   - No placeholder text like "TODO" or "FILL THIS IN"
   - All internal links/reference work
   - Markdown renders correctly (proper headers, lists, code blocks)

3. ALSO UPDATE any existing docs that need updating based on the audit:
   - MASTERPLAN.md - update version number, mark completed phases
   - CLAUDE.md - update if game structure changed
   - FIELD_MANUAL.md - update if mechanics changed

4. FINAL REPORT:
{
  docsCreated: [filename, lineCount],
  docsUpdated: [filename],
  docsWithIssues: [filename: issues],
  isComplete: boolean
}
`, { label: 'verify:docs', phase: 'Verify', schema: {
  type: 'object',
  properties: {
    docsCreated: { type: 'array' },
    docsUpdated: { type: 'array' },
    docsWithIssues: { type: 'object' },
    isComplete: { type: 'boolean' }
  }
}});

// ── FINALIZE ─────────────────────────────────────────────────────────────────
log('Documentation audit complete');

return {
  gameAudit: { modes: gameAudit.gameModes?.length, characters: gameAudit.characters?.length },
  docsAudit: { reviewed: docsAudit.docsReviewed?.length, missing: docsAudit.missingDocs?.length },
  docsPlan: { proposed: docsPlan.proposedDocs?.length },
  verify: verifyResult
};
