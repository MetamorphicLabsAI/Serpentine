const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const mainMenu = document.getElementById('main-menu');
const modeSelect = document.getElementById('mode-select');
const diffSelect = document.getElementById('difficulty-select');
const startScreen = document.getElementById('start-screen');
const controlsScreen = document.getElementById('controls-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

// Game Core Configuration
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const initialSpeed = 120;
let currentDifficultySpeed = 120; // Default Medium

// Thematic Colors mapped from CSS
const colors = {
    bg: '#0a0a0f',
    grid: '#1a1a2e',
    snakeHead: '#00ffcc',
    snakeBody: '#00ffcc',
    snakeGlow: 'rgba(0, 255, 204, 0.5)',
    food: '#ff0055',
    foodGlow: 'rgba(255, 0, 85, 0.8)',
    accent: '#b026ff'
};

/* --- Snake Profiles --- */
let unlockedSpectrum = localStorage.getItem('serpentineUnlockedSpectrum') === 'true';
let unlocked9193 = localStorage.getItem('serpentineUnlocked9193') === 'true';
let unlockedPrincess = localStorage.getItem('serpentineUnlockedPrincess') === 'true';
// Legal Rename: old 'Centipede' is now 'Arthropod'. Check both keys for legacy support.
let unlockedArthropod = (localStorage.getItem('serpentineUnlockedArthropod') === 'true') || (localStorage.getItem('serpentineUnlockedCentipede') === 'true');
let unlockedDragon = localStorage.getItem('serpentineUnlockedDragon') === 'true';

const snakeProfiles = [
    { id: "neon", name: "NEON PROTOCOL", lore: "The original OS baseline. Reliable, bright, and fiercely fast.", head: "#00ffcc", body: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)", food: "#ff0055", foodGlow: "rgba(255, 0, 85, 0.8)", accent: "#b026ff" },
    { id: "void", name: "VOID WALKER", lore: "Born in the corrupted null-sectors of the mainframe. Siphons energy from the background.", head: "#8a2be2", body: "#8a2be2", glow: "rgba(138, 43, 226, 0.8)", food: "#00ffff", foodGlow: "rgba(0, 255, 255, 0.8)", accent: "#ff00ff" },
    { id: "gold", name: "GOLD-FI", lore: "A luxury data-packet miner. Runs hot, blindingly bright, and leaves a trail of pure wealth.", head: "#ffd700", body: "#ffd700", glow: "rgba(255, 215, 0, 0.6)", food: "#ff4500", foodGlow: "rgba(255, 69, 0, 0.8)", accent: "#ffffff" },
    { id: "glitch", name: "GLITCH-WAVE", lore: "An unstable remnant of a deleted game file. It doesn't play by the rules.", head: "#ff0055", body: "#ff0055", glow: "rgba(255, 0, 85, 0.6)", food: "#00ffcc", foodGlow: "rgba(0, 255, 204, 0.8)", accent: "#ffff00" },
    { id: "mecha", name: "MECHA-SERPENT", lore: "Military-grade intrusion software. Designed to violently overwrite hostile firewalls.", head: "#708090", body: "#708090", glow: "rgba(112, 128, 144, 0.5)", food: "#ff0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#ffaa00" },
    { id: "spectrum", name: "CHROMATIC PUNCH", lore: "A multi-colored shifting anomaly unlocked by eating 20 food in a standard run. Smells like fruit punch.", head: "#ff0055", body: "#ff0055", glow: "rgba(255, 0, 85, 0.6)", food: "#00ffcc", foodGlow: "rgba(0, 255, 204, 0.8)", accent: "#ffff00", isShifting: true, locked: !unlockedSpectrum, unlockCondition: "Survive and ingest 20 food units in a single standard attempt." },
    { id: "9193", name: "9193", lore: "ERROR: Entity 9193 is not a snake. It is an exploit. A backdoor left open by the original developer. 9 length. 90 per byte. No rules.", head: "#ffd700", body: "#ffd700", glow: "rgba(255, 215, 0, 0.6)", food: "#ffd700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#ffd700", locked: !unlocked9193, unlockCondition: "???", isCheater: true },
    { id: "princess", name: "PRINCESS", lore: "A brindle dachshund protocol. Short legs, long body, infinite loyalty. Features floppy ears and a wagging tail.", head: "#8B4513", body: "#5D2E0B", glow: "rgba(139, 69, 19, 0.8)", food: "#A0522D", foodGlow: "rgba(160, 82, 45, 0.8)", accent: "#8B4513", locked: !unlockedPrincess, unlockCondition: "DECRYPT IN SYSTEM SHOP (50,000 PTS)",
        characterOptions: [
            { key: 'playStyle', label: 'PLAY STYLE', values: ['SERPENTINE', 'REALISTIC'], defaultValue: 'SERPENTINE' }
        ]
    },
    { id: "arthropod", name: "ARTHROPOD", lore: "An ancient arthropod virus with a thousand legs and no mercy. Each segment pulses with predatory instinct.", head: "#39FF14", body: "#2E8B00", glow: "rgba(57, 255, 20, 0.6)", food: "#ff0055", foodGlow: "rgba(255, 0, 85, 0.8)", accent: "#39FF14", locked: !unlockedArthropod, unlockCondition: "DECRYPT IN SYSTEM SHOP (75,000 PTS)",
        characterOptions: [
            { key: 'skin', label: 'SKIN', values: ['VENOMOUS', 'INFERNO', 'PHANTOM'], defaultValue: 'VENOMOUS' }
        ]
    },
    { id: "dragon", name: "KITE DRAGON", lore: "A legendary articulated festival-kite protocol. Constructed from living pixel-silk and crystalline spikes, it glides through the grid with geometric grace.", head: "#FF4500", body: "#228B22", glow: "rgba(255, 69, 0, 0.7)", food: "#FFD700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#FF6347", locked: !unlockedDragon, unlockCondition: "DECRYPT IN SYSTEM SHOP (100,000 PTS)" }
];
let selectedProfileIndex = 0;

/* --- Character Options Framework --- */
function getCharOption(profileId, key) {
    const stored = localStorage.getItem(`serpentineOpt_${profileId}_${key}`);
    if (stored !== null) return stored;
    const profile = snakeProfiles.find(p => p.id === profileId);
    if (profile && profile.characterOptions) {
        const opt = profile.characterOptions.find(o => o.key === key);
        if (opt) return opt.defaultValue;
    }
    return null;
}

function setCharOption(profileId, key, value) {
    localStorage.setItem(`serpentineOpt_${profileId}_${key}`, value);
}

/* --- 9193 Cheat Code Listener --- */
const CHEAT_SEQUENCE = ['1','2','3','4','5','6','7','8','0'];
let cheatBuffer = [];

/* --- Leaderboard System --- */
const DIFFICULTY_KEYS = ['easy', 'medium', 'hard', 'insane'];
let currentDifficultyLabel = 'medium';

function getLeaderboard(diff) {
    const data = localStorage.getItem(`serpentineLB_${diff}`);
    return data ? JSON.parse(data) : [];
}

function saveLeaderboard(diff, board) {
    localStorage.setItem(`serpentineLB_${diff}`, JSON.stringify(board.slice(0, 10)));
}

function isHighScore(diff, score) {
    if (score <= 0) return false;
    const board = getLeaderboard(diff);
    return board.length < 10 || score > board[board.length - 1].score;
}

function addHighScore(diff, initials, score, isCheater) {
    const board = getLeaderboard(diff);
    board.push({ initials, score, cheater: isCheater || false });
    board.sort((a, b) => b.score - a.score);
    saveLeaderboard(diff, board.slice(0, 10));
}

function renderLeaderboard(diff) {
    const list = document.getElementById('leaderboard-list');
    const board = getLeaderboard(diff);
    
    // Update active tab
    document.querySelectorAll('.btn-lb-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.btn-lb-tab[data-diff="${diff}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    if (board.length === 0) {
        list.innerHTML = '<div class="lb-empty">NO RECORDS</div>';
        return;
    }
    list.innerHTML = board.map((entry, i) => `
        <div class="lb-row">
            <span class="lb-rank">${i + 1}.</span>
            <span class="lb-initials" style="color: ${entry.cheater ? '#ffd700' : '#fff'};">${entry.initials}</span>
            <span class="lb-score">${entry.score}</span>
        </div>
    `).join('');
}

/* --- Initials Entry System --- */
const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let initialsChars = [0, 0, 0]; // indices into ALPHABET
let initialsSlot = 0;
let pendingHighScoreDiff = null;
let pendingHighScoreValue = 0;

/* --- 9193 Master Unlock Ritual --- */
let nineBuffer = 0; // counts consecutive '9' presses on main menu
let masterUnlockTimer = null;

function unlockEverything() {
    // Unlock all snakes
    snakeProfiles.forEach(p => {
        if (p.locked) p.locked = false;
    });
    // Persist all unlocks
    localStorage.setItem('serpentineUnlockedSpectrum', 'true');
    localStorage.setItem('serpentineUnlocked9193', 'true');
    localStorage.setItem('serpentineUnlockedPrincess', 'true');
    localStorage.setItem('serpentineUnlockedArthropod', 'true');
    localStorage.setItem('serpentineUnlockedDragon', 'true');
    // Future-proof: any new unlockable IDs can be added here
    
    playUnlockSound();
    for(let i = 0; i < 9; i++) {
        setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, '#ffd700', 50), i * 100);
    }
}

function resetMasterUnlock() {
    nineBuffer = 0;
    if (masterUnlockTimer) { clearTimeout(masterUnlockTimer); masterUnlockTimer = null; }
}

function updateProfileStyle() {
    const profile = snakeProfiles[selectedProfileIndex];
    let isLocked = profile.locked;

    if (isLocked) {
        document.documentElement.style.setProperty('--snake-color', '#555555');
        document.documentElement.style.setProperty('--snake-glow', `0 0 10px #555555, 0 0 20px #555555`);
        document.documentElement.style.setProperty('--food-color', '#888888');
        document.documentElement.style.setProperty('--accent-color', '#333333');
        
        document.getElementById('char-name').textContent = '???';
        
        const loreElement = document.getElementById('char-lore');
        loreElement.textContent = profile.unlockCondition || 'CLASSIFIED';
        loreElement.style.color = '#ffd700'; // Yellow
        
        document.getElementById('char-name').style.color = '#555555';
        document.getElementById('char-name').style.textShadow = `0 0 10px #555555`;
        
        colors.snakeHead = '#777777';
        colors.snakeBody = '#555555';
        colors.snakeGlow = `rgba(85, 85, 85, 0.5)`;
        colors.food = '#888888';
        colors.foodGlow = `rgba(136, 136, 136, 0.8)`;
        colors.accent = '#333333';
    } else {
        // Dynamic color overrides for certain characters (Skins)
        let bodyColor = profile.body;
        let headColor = profile.head;
        let glowColor = profile.glow;
        let foodColor = profile.food;
        let accentColor = profile.accent;

        if (profile.id === 'arthropod') {
            const skin = ARTHROPOD_SKINS[getCharOption('arthropod', 'skin') || 'VENOMOUS'];
            bodyColor = skin.shell;
            headColor = skin.segment;
            glowColor = skin.glow;
            accentColor = skin.segment;
        }

        document.documentElement.style.setProperty('--snake-color', bodyColor);
        document.documentElement.style.setProperty('--snake-glow', `0 0 10px ${bodyColor}, 0 0 20px ${bodyColor}`);
        
        if (foodColor) document.documentElement.style.setProperty('--food-color', foodColor);
        if (accentColor) document.documentElement.style.setProperty('--accent-color', accentColor);
        
        document.getElementById('char-name').textContent = profile.name;
        
        const loreElement = document.getElementById('char-lore');
        loreElement.textContent = profile.lore;
        loreElement.style.color = ''; // clear overriding color
        
        document.getElementById('char-name').style.color = bodyColor;
        document.getElementById('char-name').style.textShadow = `0 0 10px ${bodyColor}`;
        
        if (!profile.isShifting) {
            colors.snakeHead = headColor;
            colors.snakeBody = bodyColor;
            colors.snakeGlow = glowColor;
        }
        if (foodColor) colors.food = foodColor;
        if (profile.foodGlow) colors.foodGlow = profile.foodGlow;
        if (accentColor) colors.accent = accentColor;
    }
    
    const lockText = document.getElementById('char-lock-status');
    const selectBtn = document.getElementById('btn-select-char');
    if (lockText && selectBtn) {
        if (isLocked) {
            lockText.classList.remove('hidden');
            selectBtn.style.opacity = '0.5';
            selectBtn.style.pointerEvents = 'none';
            selectBtn.textContent = 'LOCKED';
        } else {
            lockText.classList.add('hidden');
            selectBtn.style.opacity = '1';
            selectBtn.style.pointerEvents = 'auto';
            selectBtn.textContent = 'SELECT';
        }
    }
    
    // Show/hide OPTIONS button
    const optionsBtn = document.getElementById('btn-char-options');
    if (optionsBtn) {
        const hasOptions = !isLocked && profile.characterOptions && profile.characterOptions.length > 0;
        if (hasOptions) {
            optionsBtn.classList.remove('hidden');
        } else {
            optionsBtn.classList.add('hidden');
        }
    }
}

// State Variables
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('serpentineHighScore') || 0;
let isPlaying = false;
let isEnteringInitials = false;
let lastRenderTime = 0;
let particles = [];
let currentSpeed = currentDifficultySpeed;
let pendingDirection = null; // Prevent double-turn death
let foodEaten = 0; // Track food consumed per round
let barkCounter = 3; // Track when princess barks
let bank = parseInt(localStorage.getItem('serpentineBank')) || 0;
let bought9193Hint = localStorage.getItem('bought9193Hint') === 'true';
let boughtMasterHint = localStorage.getItem('boughtMasterHint') === 'true';
let isPaused = false;

// Initial DOM Setup
highScoreElement.textContent = highScore;
const initialsScreen = document.getElementById('initials-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const shopMenu = document.getElementById('shop-menu');
const shopSnakes = document.getElementById('shop-snakes');
const shopModes = document.getElementById('shop-modes');
const shopOther = document.getElementById('shop-other');
const pauseScreen = document.getElementById('pause-screen');

// --- Audio Engine (Synthesizer & Sampler) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();
let musicGain = null;
let musicInterval = null;
let currentMenuStep = 0;

let princessBarkBuffer = null;
async function loadPrincessBark() {
    try {
        const response = await fetch('./resources/sounds/princess_bark.mp3');
        const arrayBuffer = await response.arrayBuffer();
        princessBarkBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.warn("Could not load Princess bark sound.", e);
    }
}
loadPrincessBark();

// Logic for Menu UI Sounds
function playMenuNavSound() {
    playTone(1800, 'square', 0.05, 0.03); // Precision high-freq blip
}

function playMenuSelectSound() {
    // Gritty Tactical Thud (No Mario-jump vibes)
    playTone(180, 'sawtooth', 0.25, 0.12); 
    // Add a very short high-freq digital click for "snap"
    playTone(3000, 'square', 0.02, 0.05);
}

function playMenuBackSound() {
    // Whooshing downward frequency shift
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playEatSound() {
    playTone(800, 'square', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'square', 0.15, 0.1), 50);
}

function playBarkSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (princessBarkBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = princessBarkBuffer;
        
        // Cartoonify effect! Pitch it up and randomize it slightly for variation
        const pitchShift = 1.3 + Math.random() * 0.4; // Ranges from 1.3x to 1.7x speed
        source.playbackRate.value = pitchShift;
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.7; // Tame the volume of the raw file
        
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
    } else {
        // Fallback to synthetic bark if the file is still loading or failed
        const now = audioCtx.currentTime;
        let osc1 = audioCtx.createOscillator();
        let gain1 = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);

        let osc2 = audioCtx.createOscillator();
        let gain2 = audioCtx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(650, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(320, now + 0.22);
        gain2.gain.setValueAtTime(0.12, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.22);
    }
}

function playDeathSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
}

function playUnlockSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    // Triumphant major arpeggio
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + (index * 0.1));
        gain.gain.linearRampToValueAtTime(0.1, now + (index * 0.1) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (index * 0.1) + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + (index * 0.1));
        osc.stop(now + (index * 0.1) + 0.3);
    });

    // Beautiful sustained major chord
    const finalTime = now + 0.4;
    [220, 277.18, 329.63].forEach(freq => { // A3, C#4, E4
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, finalTime);
        gain.gain.linearRampToValueAtTime(0.05, finalTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, finalTime + 2.0);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(finalTime);
        osc.stop(finalTime + 2.0);
    });
}

// --- Sequencer Core Data ---
const SEQUENCER_STEPS = 256; // 38.4 seconds loop at 150ms per step
let currentStep = 0;

function getBassFreq(step) {
    // 1 bar = 8 steps. Progression: Am(4 bars) -> F(4) -> C(4) -> G(4)
    const measure = Math.floor(step / 32) % 4;
    let root = 110; // A2
    if (measure === 1) root = 87.31; // F2
    if (measure === 2) root = 130.81; // C3
    if (measure === 3) root = 98.00; // G2
    
    // Synthwave galloping bass pattern (Root-Root-Octave-Root)
    const pattern = [0, 0, 12, 0, 0, 0, 12, 0];
    return root * Math.pow(2, pattern[step % 8] / 12);
}

function getMelodyFreq(step) {
    // Introduce melody synth only in the second half of the track!
    if (step < 128) return null;
    
    const measure = Math.floor(step / 32) % 4;
    let root = 440; // A4
    if (measure === 1) root = 349.23; // F4
    if (measure === 2) root = 523.25; // C5
    if (measure === 3) root = 392.00; // G4
    
    // Driving retro arpeggio pattern
    const pattern = [0, 3, 7, 12, null, 7, 3, null];
    const val = pattern[step % 8];
    if (val === null) return null;
    return root * Math.pow(2, val / 12);
}

// Dedicated Drum Synths
function playKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Punchy pitch drop
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    // Fast decay
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(time);
    osc.stop(time + 0.1);
}

function playSnare(time) {
    // White noise snare approximation via triangle wave fm modulation
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(time);
    osc.stop(time + 0.2);
}

// Generic Tone Generator for Bass and Melody
function playSynthTone(freq, type, length, vol, filterFreq, time) {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + length);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    
    osc.start(time);
    osc.stop(time + length);
}

function startMusic() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopMusic(); // Clear any existing music
    
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.4;
    musicGain.connect(audioCtx.destination);
    currentStep = 0;
    
    musicInterval = setInterval(() => {
        if (!isPlaying) return;
        
        const time = audioCtx.currentTime;
        playSynthTone(getBassFreq(currentStep), 'sawtooth', 0.15, 0.6, 800, time);
        const melFreq = getMelodyFreq(currentStep);
        if (melFreq) playSynthTone(melFreq, 'square', 0.15, 0.25, 1200, time);
        if (currentStep % 4 === 0) playKick(time);
        if (currentStep % 8 === 4) playSnare(time);
        currentStep = (currentStep + 1) % SEQUENCER_STEPS;
    }, 150); 
}

function startMenuMusic() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopMusic(); 
    
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(audioCtx.destination);
    currentMenuStep = 0;
    
    musicInterval = setInterval(() => {
        const time = audioCtx.currentTime;
        
        // --- 64-Step Menu Progression ---
        // 0-31: Deep Atmospheric Drone
        // 32-63: "The Drop" (Rhythmic Bass + Arp)
        const isDroning = currentMenuStep < 32;
        const progression = [110, 87.31, 130.81, 98]; 
        const root = progression[Math.floor(currentMenuStep / 8) % 4] / 2;

        // 1. Bass: Persistent low pulse
        if (currentMenuStep % 2 === 0) {
            const vol = isDroning ? 0.35 : 0.55;
            const length = isDroning ? 0.6 : 0.15;
            playSynthTone(root, 'sawtooth', length, vol, isDroning ? 300 : 600, time);
        }
        
        // 2. Lead: Subtle arpeggio (only during the "Drop" half)
        if (!isDroning) {
            const arp = [0, 7, 12, 19]; // Root, 5th, Octave, 12th
            const note = root * 2 * Math.pow(2, arp[currentMenuStep % 4] / 12);
            playSynthTone(note, 'square', 0.1, 0.15, 1200, time);
        }

        // 3. Kick: Soft kick every 4 steps
        if (!isDroning && currentMenuStep % 4 === 0) {
            playKick(time);
        }

        currentMenuStep = (currentMenuStep + 1) % 64;
    }, 175); // Faster tempo for better momentum
}

function stopMusic() {
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = null;
    if (musicGain) {
        musicGain.disconnect();
        musicGain = null;
    }
}

// --- Particle Engine Implementation ---
class Particle {
    constructor(x, y, color) {
        this.x = x * gridSize + gridSize / 2;
        this.y = y * gridSize + gridSize / 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 4 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.color = color || (Math.random() > 0.5 ? colors.snakeBody : colors.food);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.radius = Math.max(0, this.radius - 0.05); // shrink over time
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function burstParticles(x, y, color = null, amount = 20) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// --- Core Game Functions ---

function initGrid() {
    const profile = snakeProfiles[selectedProfileIndex];
    const cx = Math.floor(tileCount / 2);
    const cy = Math.floor(tileCount / 2);
    
    // 9193 starts at fixed 9 length
    if (profile.isCheater) {
        snake = [];
        for (let i = 0; i < 9; i++) {
            snake.push({ x: cx, y: cy + i });
        }
        currentSpeed = 50; // Always Insane speed for 9193
    } else {
        snake = [{ x: cx, y: cy }];
        currentSpeed = currentDifficultySpeed;
    }
    
    dx = 0;
    dy = -1; // Moving up to start
    pendingDirection = { dx, dy };
    score = 0;
    foodEaten = 0;
    scoreElement.textContent = score;
    scoreElement.style.color = colors.snakeBody;
    placeFood();
    particles = [];
}

function placeFood() {
    let newFoodPosition;
    let foodIsOnSnake = true;
    
    while (foodIsOnSnake) {
        newFoodPosition = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        // Ensure food doesn't spawn ON the snake
        foodIsOnSnake = snake.some(segment => 
            segment.x === newFoodPosition.x && segment.y === newFoodPosition.y
        );
    }
    food = newFoodPosition;
}

// Loop controlled via requestAnimationFrame for smooth drawing
function main(currentTime) {
    window.requestAnimationFrame(main);
    
    // Draw elements that require smooth framerates (Particles, Glow pulses)
    draw();
    
    if (!isPlaying || isPaused) return;
    
    const secondsSinceLastLogic = (currentTime - lastRenderTime) / 1000;
    
    // Logic updates happen at dynamic intervals (game speed)
    if (secondsSinceLastLogic >= currentSpeed / 1000) {
        lastRenderTime = currentTime;
        updateLogic();
    }
}

function updateLogic() {
    // Apply pending direction
    if (pendingDirection) {
        dx = pendingDirection.dx;
        dy = pendingDirection.dy;
        pendingDirection = null;
    }

    const profile = snakeProfiles[selectedProfileIndex];
    let head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 1. Collision Check - Walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        if (profile.isCheater) {
            // Portal warp - comes out on the other side
            if (head.x < 0) head.x = tileCount - 1;
            else if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            else if (head.y >= tileCount) head.y = 0;
        } else {
            triggerGameOver();
            return;
        }
    }
    
    // 2. Collision Check - Self
    // 9193 (isCheater) can safely pass through its own segments
    if (!profile.isCheater && (dx !== 0 || dy !== 0)) {
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                triggerGameOver();
                return;
            }
        }
    }
    
    // Move Head Forward
    snake.unshift(head); 
    
    // 3. Collision Check - Food
    if (head.x === food.x && head.y === food.y) {
        const profile = snakeProfiles[selectedProfileIndex];
        const pointsPerFood = profile.isCheater ? 90 : 10;
        score += pointsPerFood;
        foodEaten++;
        scoreElement.textContent = score;
        
        // Growth cap check (e.g., Princess in Realistic mode = max 5 segments)
        const maxLen = getMaxSnakeLength(profile);
        if (maxLen && snake.length > maxLen) {
            snake.pop(); // Pop the tail to maintain the cap
        }
        
        // UI Juice: Pop the score element
        scoreElement.style.transform = 'scale(1.4)';
        setTimeout(() => scoreElement.style.transform = 'scale(1)', 150);
        
        // Sound and Visual effects
        if (profile.id === 'princess') {
            barkCounter--;
            if (barkCounter <= 0) {
                playBarkSound();
                barkCounter = Math.floor(Math.random() * 3) + 3; // Randomly 3 to 5
            } else {
                playEatSound();
            }
        } else {
            playEatSound();
        }

        burstParticles(food.x, food.y);
        placeFood();
        
        // 9193 keeps fixed speed, normal snakes accelerate
        if (!profile.isCheater) {
            currentSpeed = Math.max(currentDifficultySpeed / 2, currentDifficultySpeed - (score * 0.5));
        }
        
        // Unlock Spectrum check (20 food eaten)
        if (foodEaten >= 20 && localStorage.getItem('serpentineUnlockedSpectrum') !== 'true') {
            localStorage.setItem('serpentineUnlockedSpectrum', 'true');
            const spectrum = snakeProfiles.find(p => p.id === 'spectrum');
            if (spectrum) spectrum.locked = false;
            
            playUnlockSound();
            for(let i=0; i<6; i++) {
               setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, `hsl(${Math.random()*360},100%,50%)`, 40), i * 150);
            }
        }
    } else {
        // Pop Tail if we didn't eat
        // 9193 never grows past 9
        const profile = snakeProfiles[selectedProfileIndex];
        if (profile.isCheater && snake.length > 9) {
            snake.pop();
        } else if (!profile.isCheater) {
            snake.pop();
        }
    }
}

// Draw the static grid
function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

let previewAngle = 0;
function drawPreviewSnake() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 20; 
    const radius = 100;
    
    previewAngle += 0.08;
    
    // Infinity loop path
    for (let i = 50; i >= 0; i--) {
        const theta = previewAngle - (i * 0.08);
        const x = cx + Math.sin(theta) * radius * 1.8; 
        const y = cy + Math.sin(theta * 2) * (radius * 0.9);
        
        ctx.save();
        const isHead = (i === 0);
        if (isHead) {
            ctx.fillStyle = colors.snakeHead;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
        } else {
            const opacity = Math.max(0.05, 1 - (i / 50) * 0.95);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = colors.snakeBody;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.snakeGlow;
        }
        
        ctx.beginPath();
        const size = isHead ? (gridSize) : (gridSize - 4);
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Main rendering pass
function draw() {
    const profile = snakeProfiles[selectedProfileIndex];
    if (profile.isShifting && !profile.locked) {
        const time = Date.now() / 15;
        const shiftHue = time % 360;
        colors.snakeBody = `hsl(${(shiftHue + 30) % 360}, 100%, 50%)`;
        colors.snakeHead = `hsl(${shiftHue}, 100%, 60%)`;
        colors.snakeGlow = `hsla(${shiftHue}, 100%, 50%, 0.6)`;
        document.documentElement.style.setProperty('--snake-color', colors.snakeBody);
        document.documentElement.style.setProperty('--snake-glow', `0 0 10px ${colors.snakeBody}, 0 0 20px ${colors.snakeBody}`);
    }

    // Fill Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    if (!isPlaying) {
        drawPreviewSnake();
        return; // Don't draw the actual game logic if we are on the menu!
    }
    
    // --- Update and Draw Particles ---
    particles = particles.filter(p => {
        p.update();
        return p.life > 0;
    });
    particles.forEach(p => p.draw(ctx));
    
    // --- Draw Food with Pulsating Effect ---
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.foodGlow;
    ctx.fillStyle = colors.food;
    
    const time = Date.now();
    const pulse = Math.sin(time / 150) * 1.5;
    const padding = 2;
    const foodSize = gridSize - padding * 2 + pulse;
    
    // Center the pulsing origin
    const offset = pulse / 2;
    
    if (profile.id === 'princess') {
        const cx = food.x * gridSize + gridSize / 2;
        const cy = food.y * gridSize + gridSize / 2;
        ctx.save();
        ctx.translate(cx, cy);
        
        // Spin the bone slowly
        ctx.rotate(time / 400);
        
        // Realistic bone dimensions and colors
        ctx.fillStyle = "#FFF8DC"; // Ivory/Cornsilk bone color
        ctx.shadowColor = "rgba(255, 248, 220, 0.7)"; // Custom bone glow
        ctx.shadowBlur = 12;

        const bw = 16 + pulse;    // Wider bone shaft
        const bh = 5 + pulse/2;   // Thicker bone shaft
        const knob = 4.5 + pulse/2; // Larger ear knobs
        
        const offsetW = bw/2;
        const offsetH = bh/2;

        ctx.beginPath();
        // Central shaft
        ctx.rect(-offsetW, -offsetH, bw, bh);
        
        // 4 knobs on the corners for the classic bone look
        ctx.arc(-offsetW, -offsetH, knob, 0, Math.PI * 2);
        ctx.arc(-offsetW, offsetH, knob, 0, Math.PI * 2);
        ctx.arc(offsetW, -offsetH, knob, 0, Math.PI * 2);
        ctx.arc(offsetW, offsetH, knob, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark inner stroke/texture to make it distinct
        ctx.strokeStyle = "rgba(139, 115, 85, 0.4)"; 
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-offsetW + 3, 0);
        ctx.lineTo(offsetW - 3, 0);
        ctx.stroke();
        
        ctx.restore();
    } else {
        ctx.beginPath();
        ctx.roundRect(
            food.x * gridSize + padding - offset, 
            food.y * gridSize + padding - offset, 
            foodSize, 
            foodSize, 
            6 // border radius
        );
        ctx.fill();
    }
    ctx.restore();
    
    // --- Draw Snake ---
    // Reverse loop: Draw tail-to-head so the Head renders ON TOP of the body segments
    for (let index = snake.length - 1; index >= 0; index--) {
        const segment = snake[index];
        ctx.save();
        const isHead = index === 0;
        const isTail = index === snake.length - 1;
        const profile = snakeProfiles[selectedProfileIndex];

        if (profile.id === 'princess') {
            drawPrincess(segment, index, isHead, isTail);
        } else if (profile.id === 'arthropod') {
            drawArthropod(segment, index, isHead, isTail);
        } else if (profile.id === 'dragon') {
            drawDragon(segment, index, isHead, isTail);
        } else {
            if (isHead) {
                ctx.fillStyle = colors.snakeHead;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffffff';
            } else {
                // Apply a slight gradient/fade effect down the tail
                const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.8);
                ctx.globalAlpha = opacity;
                ctx.fillStyle = colors.snakeBody;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colors.snakeGlow;
            }
            
            const pad = 1;
            ctx.beginPath();
            ctx.roundRect(
                segment.x * gridSize + pad, 
                segment.y * gridSize + pad, 
                gridSize - pad * 2, 
                gridSize - pad * 2,
                isHead ? 5 : 3
            );
            ctx.fill();
            
            // Add "eyes" to the head for character
            if (isHead) {
                drawEyes(segment.x, segment.y);
            }
        }
        
        ctx.restore();
    }
}

function drawPrincess(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    
    ctx.save();
    
    let isLegSegment = false;
    if (i === 1) isLegSegment = true; // Front legs / shoulders
    else if (i > 1 && isTail) isLegSegment = true; // Back legs / hips

    // 1. Calculate rotation angle for current segment
    let sDx = dx, sDy = dy;
    if (i > 0) {
        sDx = Math.sign(snake[i-1].x - seg.x);
        sDy = Math.sign(snake[i-1].y - seg.y);
    }
    if (sDx === 0 && sDy === 0) { sDy = -1; }
    
    let angle = 0;
    if (sDx === 1) angle = Math.PI / 2;
    else if (sDx === -1) angle = -Math.PI / 2;
    else if (sDy === 1) angle = Math.PI;
    else if (sDy === -1) angle = 0;

    // 2. Base Body & Shoulders/Hips
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.fillStyle = "#8B4513"; // Primary Brindle Brown
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    if (isHead) {
        // Neck base (standard size)
        ctx.roundRect(-gridSize/2, -gridSize/2, gridSize, gridSize, 4);
    } else if (isLegSegment) {
        // Broad rounded shoulders/hips (slightly wider, heavily rounded)
        ctx.roundRect(-gridSize/2 - 2, -gridSize/2 - 1, gridSize + 4, gridSize + 2, gridSize/2);
    } else {
        // Medium tubular body (95% width)
        const w = gridSize * 0.95;
        const h = gridSize + 2; // slightly longer to ensure sections overlap seamlessly
        ctx.roundRect(-w/2, -h/2, w, h, 6);
    }
    ctx.fill();

    // 3. Brindle "Striping" Texture
    ctx.strokeStyle = "rgba(45, 20, 5, 0.4)"; 
    ctx.lineWidth = 3;
    ctx.beginPath();
    const wLimit = isLegSegment ? gridSize/2 : (gridSize * 0.95)/2;
    ctx.moveTo(-wLimit/1.5, -gridSize/4);
    ctx.lineTo(wLimit/1.5, gridSize/4);
    ctx.moveTo(-wLimit/1.5, gridSize/4 - 2);
    ctx.lineTo(wLimit/1.5, gridSize/4 + 6);
    ctx.stroke();

    // 4. Stumpy Legs
    if (isLegSegment) {
        ctx.fillStyle = "#3D1E07"; // Dark brown paws
        ctx.beginPath();
        // Left Paw
        ctx.roundRect(-18, -4, 8, 8, 4); 
        ctx.fill();
        ctx.beginPath();
        // Right Paw
        ctx.roundRect(10, -4, 8, 8, 4);  
        ctx.fill();
    }
    ctx.restore();

    if (isHead) {
        ctx.save();
        ctx.translate(cx, cy);
        
        // Face the forward direction
        let angle = 0;
        let cDx = dx, cDy = dy;
        if (cDx === 0 && cDy === 0) { cDy = -1; }
        if (cDx === 1) angle = Math.PI / 2;
        else if (cDx === -1) angle = -Math.PI / 2;
        else if (cDy === 1) angle = Math.PI;
        else if (cDy === -1) angle = 0;
        
        ctx.rotate(angle);

        // A. Head base (To anchor the snout smoothly)
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // B. Extended Wiener Dog Snout (pushed forward significantly)
        ctx.fillStyle = "#A0522D"; // Lighter snout bridge
        ctx.beginPath();
        // Extra Long vertical ellipse for the muzzle to make it undeniably a dachshund
        ctx.ellipse(0, -11, 5, 14, 0, 0, Math.PI * 2); 
        ctx.fill();

        // C. Large Floppy Dachshund Ears (Dropped to the sides and slightly back)
        ctx.fillStyle = "#4B280A";
        ctx.beginPath();
        // Left Ear: Leaning outward and dropping down
        ctx.ellipse(-8, 3, 4, 12, -Math.PI/6, 0, Math.PI * 2); 
        ctx.fill();
        ctx.beginPath();
        // Right Ear: Leaning outward and dropping down
        ctx.ellipse(8, 3, 4, 12, Math.PI/6, 0, Math.PI * 2);  
        ctx.fill();

        // D. Big Black Nose (At the very tip of the extended snout)
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(0, -25, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // E. Eyes (Inquisitive dots on the snout bridge)
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-3.5, -6, 2, 0, Math.PI*2); ctx.fill(); // Left eye
        ctx.beginPath(); ctx.arc(3.5, -6, 2, 0, Math.PI*2); ctx.fill(); // Right eye

        ctx.restore();
    }

    if (isTail) {
        ctx.save();
        ctx.translate(cx, cy);
        
        let sDx = dx, sDy = dy;
        if (snake.length > 1) {
            sDx = Math.sign(snake[snake.length-2].x - seg.x);
            sDy = Math.sign(snake[snake.length-2].y - seg.y);
        }
        if (sDx === 0 && sDy === 0) { sDy = -1; }
        
        let angle = 0;
        if (sDx === 1) angle = Math.PI / 2;
        else if (sDx === -1) angle = -Math.PI / 2;
        else if (sDy === 1) angle = Math.PI;
        else if (sDy === -1) angle = 0;
        
        ctx.rotate(angle);

        // E. Long Doxie Tail (Wagging)
        const wag = Math.sin(Date.now() / 70) * 10;
        ctx.strokeStyle = "#4B280A"; // Darker brown tail
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        
        ctx.beginPath();
        ctx.moveTo(0, 0); // Base of tail in the center
        // Curve back out behind the dog varying left to right
        ctx.quadraticCurveTo(wag, 10, wag * 1.5, 20); 
        ctx.stroke();
        
        ctx.restore();
    }

    ctx.restore();
}

/* --- ARTHROPOD RENDERER --- */
const ARTHROPOD_SKINS = {
    VENOMOUS: { shell: '#1B5E00', segment: '#39FF14', legs: '#00FF00', eye: '#FF0000', glow: 'rgba(57,255,20,0.5)', mandible: '#7CFC00', antenna: '#ADFF2F' },
    INFERNO:  { shell: '#8B0000', segment: '#FF4500', legs: '#FF6600', eye: '#FFD700', glow: 'rgba(255,69,0,0.5)', mandible: '#FF8C00', antenna: '#FF4500' },
    PHANTOM:  { shell: '#2E0854', segment: '#9B59B6', legs: '#C39BDB', eye: '#E0E0FF', glow: 'rgba(155,89,182,0.4)', mandible: '#D2B4DE', antenna: '#BB8FCE' }
};

function drawArthropod(seg, i, isHead, isTail) {
    const skin = ARTHROPOD_SKINS[getCharOption('arthropod', 'skin') || 'VENOMOUS'];
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    const time = Date.now();

    // Direction calc
    let sDx = dx, sDy = dy;
    if (i > 0) { sDx = Math.sign(snake[i-1].x - seg.x); sDy = Math.sign(snake[i-1].y - seg.y); }
    if (sDx === 0 && sDy === 0) sDy = -1;
    let angle = 0;
    if (sDx === 1) angle = Math.PI / 2;
    else if (sDx === -1) angle = -Math.PI / 2;
    else if (sDy === 1) angle = Math.PI;
    else if (sDy === -1) angle = 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Animated leg wiggle
    const legPhase = Math.sin(time / 60 + i * 1.2) * 15;

    // Legs on EVERY segment (except head)
    if (!isHead) {
        ctx.strokeStyle = skin.legs;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        // Left leg pair
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-14, -4 + legPhase * 0.3);
        ctx.lineTo(-16, 2 + legPhase * 0.5);
        ctx.stroke();
        // Right leg pair
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.lineTo(14, -4 - legPhase * 0.3);
        ctx.lineTo(16, 2 - legPhase * 0.5);
        ctx.stroke();
        // Second set of legs (staggered)
        ctx.beginPath();
        ctx.moveTo(-5, 3);
        ctx.lineTo(-13, 5 - legPhase * 0.4);
        ctx.lineTo(-15, 9 - legPhase * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, 3);
        ctx.lineTo(13, 5 + legPhase * 0.4);
        ctx.lineTo(15, 9 + legPhase * 0.3);
        ctx.stroke();
    }

    // Exoskeleton segment body
    ctx.fillStyle = skin.shell;
    ctx.shadowBlur = 6;
    ctx.shadowColor = skin.glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Segment inner plate
    ctx.fillStyle = skin.segment;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Segment ridge line
    ctx.strokeStyle = skin.shell;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();

    if (isHead) {
        // Mandibles
        ctx.strokeStyle = skin.mandible;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const mandibleWiggle = Math.sin(time / 100) * 3;
        ctx.beginPath();
        ctx.moveTo(-3, -8);
        ctx.quadraticCurveTo(-6 - mandibleWiggle, -16, -2, -18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -8);
        ctx.quadraticCurveTo(6 + mandibleWiggle, -16, 2, -18);
        ctx.stroke();

        // Antennae
        ctx.strokeStyle = skin.antenna;
        ctx.lineWidth = 1.5;
        const antWiggle = Math.sin(time / 80) * 5;
        ctx.beginPath();
        ctx.moveTo(-4, -7);
        ctx.quadraticCurveTo(-8 + antWiggle, -20, -3 + antWiggle, -24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, -7);
        ctx.quadraticCurveTo(8 - antWiggle, -20, 3 - antWiggle, -24);
        ctx.stroke();
        // Antenna tips
        ctx.fillStyle = skin.segment;
        ctx.beginPath(); ctx.arc(-3 + antWiggle, -24, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3 - antWiggle, -24, 1.5, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = skin.eye;
        ctx.shadowBlur = 4;
        ctx.shadowColor = skin.eye;
        ctx.beginPath(); ctx.arc(-4, -5, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -5, 2.5, 0, Math.PI * 2); ctx.fill();
        // Pupils
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(-4, -5.5, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -5.5, 1, 0, Math.PI * 2); ctx.fill();
    }

    if (isTail) {
        // Tail stinger
        ctx.fillStyle = skin.mandible;
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(0, 16);
        ctx.lineTo(3, 8);
        ctx.fill();
    }

    ctx.restore();
}

/* --- INFERNAL WYRM RENDERER (CRYSTALLINE APEX) --- */
function drawDragon(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    const time = Date.now();
    const len = snake.length;

    // Rotation
    let sDx = dx, sDy = dy;
    if (i > 0) { sDx = Math.sign(snake[i-1].x - seg.x); sDy = Math.sign(snake[i-1].y - seg.y); }
    if (sDx === 0 && sDy === 0) sDy = -1;
    let angle = 0;
    if (sDx === 1) angle = Math.PI / 2;
    else if (sDx === -1) angle = -Math.PI / 2;
    else if (sDy === 1) angle = Math.PI;
    else if (sDy === -1) angle = 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const wiggle = Math.sin(time / 130 + i * 0.5) * 4;
    
    // 1. ANATOMICAL SEGMENTATION
    let bodyW = 16;
    if (isHead) bodyW = 20;
    else if (i < 5) bodyW = 18;
    else bodyW = 16 - (i/len) * 10; // Tapering

    // Core Segment Underlay
    ctx.fillStyle = '#0B2010'; // Deep Emerald
    ctx.beginPath();
    ctx.roundRect(-bodyW/2 + wiggle, -10, bodyW, 20, 4);
    ctx.fill();

    // 2. CRYSTALLINE OVERLAPPING SCALES (Multi-Spike)
    // Every segment has 3 overlapping triangular spikes pointing backward
    ctx.fillStyle = '#1A472A';
    [-1, 0, 1].forEach(offset => {
        ctx.beginPath();
        const sx = (offset * bodyW/3) + wiggle;
        ctx.moveTo(sx - 4, -4);
        ctx.lineTo(sx, 12); // Pointing back
        ctx.lineTo(sx + 4, -4);
        ctx.closePath();
        ctx.fill();
        // Golden Highlights on scale edges
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    });

    // 3. ARTICULATED CLAWS (Front & Mid pairs)
    if (i === 2 || i === 6) {
        const crawl = Math.sin(time/150 + i) * 8;
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.scale(side, 1);
            ctx.strokeStyle = '#1A472A';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(bodyW/2 + wiggle, -2);
            ctx.lineTo(bodyW/2 + 10 + wiggle, -8 + crawl); // Elbow up
            ctx.lineTo(bodyW/2 + 14 + wiggle, 2 + crawl);  // Tip down
            ctx.stroke();
            // Claw tips
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(bodyW/2 + 14 + wiggle, 2 + crawl, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        });
    }

    // 4. THE CRYSTAL SKULL (Based on reference)
    if (isHead) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF4500';
        
        // Main Head Star
        ctx.fillStyle = '#1A472A';
        ctx.beginPath();
        ctx.moveTo(0, -25); // Top spike
        ctx.lineTo(-12, -10);
        ctx.lineTo(-8, 8);
        ctx.lineTo(8, 8);
        ctx.lineTo(12, -10);
        ctx.closePath();
        ctx.fill();

        // Secondary Crystalline Facets (Horns)
        ctx.fillStyle = '#0D3318';
        // Left
        ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-20, -18); ctx.lineTo(-12, -2); ctx.fill();
        // Right
        ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(20, -18); ctx.lineTo(12, -2); ctx.fill();
        // Back spikes
        ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(-10, 16); ctx.lineTo(0, 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, 8); ctx.lineTo(10, 16); ctx.lineTo(0, 10); ctx.fill();

        // Glowing Slit Eyes
        const pulse = Math.sin(time/200) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.beginPath(); ctx.arc(-5, -6, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -6, 2.5, 0, Math.PI*2); ctx.fill();
        
        // Pupil slits
        ctx.fillStyle = '#000';
        ctx.fillRect(-5.5, -7.5, 1, 3);
        ctx.fillRect(4.5, -7.5, 1, 3);

        // Fire embers from nose crystal
        ctx.shadowBlur = 0;
        for (let p=0; p<5; p++) {
            const px = (Math.random()-0.5) * 8;
            const py = -25 - Math.random()*10;
            ctx.fillStyle = '#FF4500';
            ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // 5. THE CRYSTALLINE TAIL SPADE
    if (isTail) {
        const tWag = Math.sin(time/100) * 12;
        ctx.fillStyle = '#FF4500'; // Heat core
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF0000';
        
        // Multi-pointed Crystal Spade
        ctx.beginPath();
        ctx.moveTo(tWag, 25); // Top
        ctx.lineTo(tWag - 12, 10);
        ctx.lineTo(tWag - 6, 28);
        ctx.lineTo(tWag - 18, 40); // Max spread Left
        ctx.lineTo(tWag, 55);      // Tip
        ctx.lineTo(tWag + 18, 40); // Max spread Right
        ctx.lineTo(tWag + 6, 28);
        ctx.lineTo(tWag + 12, 10);
        ctx.closePath();
        ctx.fill();
        
        // Secondary Crystal layer
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.moveTo(tWag, 30);
        ctx.lineTo(tWag - 8, 40);
        ctx.lineTo(tWag, 50);
        ctx.lineTo(tWag + 8, 40);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

function drawEyes(x, y) {
    ctx.fillStyle = colors.bg;
    ctx.shadowBlur = 0; // Turn off glow for eyes
    
    const eyeSize = 2;
    let eye1X, eye1Y, eye2X, eye2Y;
    
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const offset = 4;
    
    // Determine eye position based on movement direction
    let drawDx = dx;
    let drawDy = dy;
    
    // Default looking up if stationary initially
    if (drawDx === 0 && drawDy === 0) {
        drawDx = 0; drawDy = -1;
    }

    if (drawDx === 1) { // Right
        eye1X = centerX + 3; eye1Y = centerY - offset;
        eye2X = centerX + 3; eye2Y = centerY + offset;
    } else if (drawDx === -1) { // Left
        eye1X = centerX - 3; eye1Y = centerY - offset;
        eye2X = centerX - 3; eye2Y = centerY + offset;
    } else if (drawDy === 1) { // Down
        eye1X = centerX - offset; eye1Y = centerY + 3;
        eye2X = centerX + offset; eye2Y = centerY + 3;
    } else { // Up
        eye1X = centerX - offset; eye1Y = centerY - 3;
        eye2X = centerX + offset; eye2Y = centerY - 3;
    }
    
    ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2); ctx.fill();
}

// --- Game State Flow ---

function startGame() {
    isPlaying = true;
    isEnteringInitials = false;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    hideAllMenus();
    
    // Clear shake
    document.querySelector('.arcade-machine').classList.remove('shake');
    
    initGrid();
    lastRenderTime = performance.now();
    startMusic();
}

function triggerGameOver() {
    isPlaying = false;
    isPaused = false;
    stopMusic();
    playDeathSound();
    
    // Resume menu atmosphere after a short delay (post-explosion)
    setTimeout(() => {
        if (!isPlaying) startMenuMusic();
    }, 3000);
    
    // Shake effect
    document.querySelector('.arcade-machine').classList.add('shake');
    
    // Death Explosion on the head
    burstParticles(snake[0].x, snake[0].y, colors.snakeHead, 60);
    
    // Chain reaction on the tail
    snake.forEach((segment, index) => {
        if (index > 0) {
            setTimeout(() => {
                burstParticles(segment.x, segment.y, colors.snakeBody, 15);
            }, index * 40);
        }
    });
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('serpentineHighScore', highScore);
        highScoreElement.textContent = highScore;
        scoreElement.style.color = colors.accent;
        
        for(let i=0; i<3; i++) {
           setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, colors.accent, 30), i * 300);
        }
    }
    
    finalScoreElement.textContent = score;
    
    // Accumulate into the Bank
    bank += score;
    localStorage.setItem('serpentineBank', bank);
    
    // Check if this score qualifies for leaderboard
    const profile = snakeProfiles[selectedProfileIndex];
    
    setTimeout(() => {
        if (isHighScore(currentDifficultyLabel, score)) {
            if (profile.isCheater) {
                // 9193 auto-submits as CTR in yellow
                addHighScore(currentDifficultyLabel, 'CTR', score, true);
                gameOverScreen.classList.remove('hidden');
            } else {
                // Show initials entry
                isEnteringInitials = true;
                initialsChars = [0, 0, 0];
                initialsSlot = 0;
                pendingHighScoreDiff = currentDifficultyLabel;
                pendingHighScoreValue = score;
                updateInitialsDisplay();
                document.getElementById('initials-score').textContent = score;
                initialsScreen.classList.remove('hidden');
            }
        } else {
            gameOverScreen.classList.remove('hidden');
        }
    }, 1500);
}

function updateInitialsDisplay() {
    const slots = document.querySelectorAll('.initial-slot');
    slots.forEach((slot, i) => {
        slot.querySelector('span').textContent = initialsChars[i] === 0 ? '_' : ALPHABET[initialsChars[i]];
        slot.classList.toggle('active', i === initialsSlot);
    });
}

function submitInitials() {
    const initials = initialsChars.map(i => ALPHABET[i] || ' ').join('');
    addHighScore(pendingHighScoreDiff, initials, pendingHighScoreValue, false);
    isEnteringInitials = false;
    hideAllMenus();
    gameOverScreen.classList.remove('hidden');
}

function updateShopUI() {
    const bankIds = ['shop-bank-main', 'shop-bank-snakes', 'shop-bank-modes', 'shop-bank-other'];
    bankIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = bank.toLocaleString();
    });

    const label9193 = document.getElementById('label-9193');
    const btnBuy9193 = document.getElementById('btn-buy-9193');
    if (bought9193Hint) {
        label9193.textContent = "EXPLOIT: Main Menu, 1-2-3-4-5-6-7-8-0";
        btnBuy9193.textContent = "LOADED";
        btnBuy9193.style.opacity = '0.5';
        btnBuy9193.style.pointerEvents = 'none';
        btnBuy9193.classList.add('btn-secondary');
    }

    const labelMaster = document.getElementById('label-master');
    const btnBuyMaster = document.getElementById('btn-buy-master');
    if (boughtMasterHint) {
        labelMaster.textContent = "RITUAL: 9193 selected, Main Menu, push 9x9 times, wait 9s";
        btnBuyMaster.textContent = "LOADED";
        btnBuyMaster.style.opacity = '0.5';
        btnBuyMaster.style.pointerEvents = 'none';
        btnBuyMaster.classList.add('btn-secondary');
    }

    const labelPrincess = document.getElementById('label-princess');
    const btnBuyPrincess = document.getElementById('btn-buy-princess');
    if (unlockedPrincess) {
        labelPrincess.textContent = "PRINCESS: DECRYPTED";
        btnBuyPrincess.textContent = "LOADED";
        btnBuyPrincess.style.opacity = '0.5';
        btnBuyPrincess.style.pointerEvents = 'none';
        btnBuyPrincess.classList.add('btn-secondary');
    }

    const labelArthropod = document.getElementById('label-arthropod');
    const btnBuyArthropod = document.getElementById('btn-buy-arthropod');
    if (unlockedArthropod) {
        labelArthropod.textContent = "ARTHROPOD: DECRYPTED";
        btnBuyArthropod.textContent = "LOADED";
        btnBuyArthropod.style.opacity = '0.5';
        btnBuyArthropod.style.pointerEvents = 'none';
        btnBuyArthropod.classList.add('btn-secondary');
    }

    const labelDragon = document.getElementById('label-dragon');
    const btnBuyDragon = document.getElementById('btn-buy-dragon');
    if (unlockedDragon) {
        labelDragon.textContent = "INFERNAL WYRM: DECRYPTED";
        btnBuyDragon.textContent = "LOADED";
        btnBuyDragon.style.opacity = '0.5';
        btnBuyDragon.style.pointerEvents = 'none';
        btnBuyDragon.classList.add('btn-secondary');
    }
}

function buyItem(id, cost, successCallback) {
    if (bank >= cost) {
        bank -= cost;
        localStorage.setItem('serpentineBank', bank);
        successCallback();
        updateShopUI();
        playUnlockSound();
    } else {
        // Not enough points - red flash
        const bankDisplays = document.querySelectorAll('.highlight');
        bankDisplays.forEach(el => {
            el.style.color = '#ff0055';
            setTimeout(() => el.style.color = '', 300);
        });
        playDeathSound();
    }
}

// --- Input Handling ---

window.addEventListener('keydown', e => {
    // Prevent scrolling for game controls
    if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
    }
    
    // --- Initials Entry Input ---
    if (isEnteringInitials) {
        if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            initialsChars[initialsSlot] = (initialsChars[initialsSlot] + 1) % ALPHABET.length;
            updateInitialsDisplay();
        } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            initialsChars[initialsSlot] = (initialsChars[initialsSlot] - 1 + ALPHABET.length) % ALPHABET.length;
            updateInitialsDisplay();
        } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            initialsSlot = Math.min(2, initialsSlot + 1);
            updateInitialsDisplay();
        } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            initialsSlot = Math.max(0, initialsSlot - 1);
            updateInitialsDisplay();
        } else if (e.code === 'Enter' || e.code === 'Space') {
            submitInitials();
        }
        return;
    }
    
    if (e.key === 'Escape' && isPlaying && !isEnteringInitials) {
        togglePause();
        return;
    }

    if (!isPlaying) {
        // --- 9193 Cheat Code Detection (main menu only) ---
        const activeOverlay = Array.from(document.querySelectorAll('.overlay')).find(o => !o.classList.contains('hidden'));
        if (activeOverlay && activeOverlay.id === 'main-menu') {
            if (e.key >= '0' && e.key <= '9') {
                // --- 9193 unlock cheat code ---
                cheatBuffer.push(e.key);
                if (cheatBuffer.length > CHEAT_SEQUENCE.length) cheatBuffer.shift();
                if (cheatBuffer.length === CHEAT_SEQUENCE.length && cheatBuffer.every((k, i) => k === CHEAT_SEQUENCE[i])) {
                    cheatBuffer = [];
                    if (localStorage.getItem('serpentineUnlocked9193') !== 'true') {
                        localStorage.setItem('serpentineUnlocked9193', 'true');
                        unlocked9193 = true;
                        const entity = snakeProfiles.find(p => p.id === '9193');
                        if (entity) entity.locked = false;
                        playUnlockSound();
                        for(let i=0; i<6; i++) {
                            setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, '#ffd700', 40), i * 150);
                        }
                    }
                }
                
                // --- 9x9 Master Unlock Ritual ---
                const profile9193 = snakeProfiles.find(p => p.id === '9193');
                if (e.key === '9' && profile9193 && !profile9193.locked && selectedProfileIndex === snakeProfiles.indexOf(profile9193)) {
                    nineBuffer++;
                    if (nineBuffer >= 9) {
                        nineBuffer = 0;
                        // Start 9-second idle countdown
                        if (masterUnlockTimer) clearTimeout(masterUnlockTimer);
                        masterUnlockTimer = setTimeout(() => {
                            unlockEverything();
                            masterUnlockTimer = null;
                        }, 9000);
                    }
                } else if (e.key !== '9') {
                    resetMasterUnlock();
                }
            } else {
                // Non-number key resets master unlock
                resetMasterUnlock();
            }
        } else {
            cheatBuffer = [];
            resetMasterUnlock();
        }
        
        if (activeOverlay) {
            const buttons = Array.from(activeOverlay.querySelectorAll('button:not([style*="pointer-events: none"])'));
            let currentIndex = buttons.indexOf(document.activeElement);
            if (currentIndex === -1) currentIndex = 0;
            
            if (e.code === 'Escape' || e.code === 'Backspace') {
                e.preventDefault();
                const backBtn = buttons.find(b => b.textContent === 'BACK' || b.textContent === 'MAIN MENU');
                if (backBtn) backBtn.click();
                return;
            }
            
            if (activeOverlay.id === 'start-screen') {
                if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    document.getElementById('prev-btn').click();
                    return;
                } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    document.getElementById('next-btn').click();
                    return;
                }
            }

            if (buttons.length > 0) {
                if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    const nextIndex = (currentIndex + 1) % buttons.length;
                    buttons[nextIndex].focus();
                    playMenuNavSound();
                } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
                    buttons[prevIndex].focus();
                    playMenuNavSound();
                } else if (e.code === 'Space' || e.code === 'Enter') {
                    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                        document.activeElement.click();
                    } else {
                        buttons[currentIndex].focus();
                        buttons[currentIndex].click();
                    }
                }
            }
        }
        return;
    }
    
    // Use pendingDirection to prevent "U-turn" death on rapid double pressing
    const activeDx = pendingDirection ? pendingDirection.dx : dx;
    const activeDy = pendingDirection ? pendingDirection.dy : dy;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (activeDy !== 1) pendingDirection = { dx: 0, dy: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (activeDy !== -1) pendingDirection = { dx: 0, dy: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (activeDx !== 1) pendingDirection = { dx: -1, dy: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (activeDx !== -1) pendingDirection = { dx: 1, dy: 0 };
            break;
    }
});

// Cancel master unlock ritual on any click
document.addEventListener('click', () => resetMasterUnlock());

// Mobile Swipe Controls (Makes it robust for any device)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault(); // Prevent scrolling on touch
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (!isPlaying) return;
    
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    let dxTouch = touchEndX - touchStartX;
    let dyTouch = touchEndY - touchStartY;
    
    // Minimum distance for a swipe
    if (Math.abs(dxTouch) < 30 && Math.abs(dyTouch) < 30) return;
    
    const activeDx = pendingDirection ? pendingDirection.dx : dx;
    const activeDy = pendingDirection ? pendingDirection.dy : dy;

    if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
        // Horizontal
        if (dxTouch > 0 && activeDx !== -1) pendingDirection = { dx: 1, dy: 0 };
        else if (dxTouch < 0 && activeDx !== 1) pendingDirection = { dx: -1, dy: 0 };
    } else {
        // Vertical
        if (dyTouch > 0 && activeDy !== -1) pendingDirection = { dx: 0, dy: 1 };
        else if (dyTouch < 0 && activeDy !== 1) pendingDirection = { dx: 0, dy: -1 };
    }
});

// Menu Nav Bindings
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

prevBtn.addEventListener('click', () => {
    selectedProfileIndex = (selectedProfileIndex - 1 + snakeProfiles.length) % snakeProfiles.length;
    updateProfileStyle();
});

nextBtn.addEventListener('click', () => {
    selectedProfileIndex = (selectedProfileIndex + 1) % snakeProfiles.length;
    updateProfileStyle();
});

const hideAllMenus = () => {
    mainMenu.classList.add('hidden');
    modeSelect.classList.add('hidden');
    diffSelect.classList.add('hidden');
    controlsScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initialsScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    shopMenu.classList.add('hidden');
    shopSnakes.classList.add('hidden');
    shopModes.classList.add('hidden');
    shopOther.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    document.getElementById('init-screen').classList.add('hidden');
    document.getElementById('char-options-screen').classList.add('hidden');
};

const togglePause = () => {
    if (!isPlaying || isEnteringInitials) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        hideAllMenus();
        pauseScreen.classList.remove('hidden');
        document.getElementById('btn-resume').focus();
        // Lower music volume while paused
        if (musicGain) musicGain.gain.setTargetAtTime(0.04, audioCtx.currentTime, 0.1);
    } else {
        hideAllMenus();
        // Restore music volume to its original 0.4
        if (musicGain) musicGain.gain.setTargetAtTime(0.4, audioCtx.currentTime, 0.1);
    }
};

document.getElementById('btn-play-menu').addEventListener('click', () => {
    hideAllMenus();
    modeSelect.classList.remove('hidden');
    document.getElementById('btn-standard').focus();
});

document.getElementById('btn-char-menu').addEventListener('click', () => {
    hideAllMenus();
    startScreen.classList.remove('hidden');
    document.getElementById('btn-select-char').focus();
});

document.getElementById('btn-scores-menu').addEventListener('click', () => {
    hideAllMenus();
    renderLeaderboard('medium');
    leaderboardScreen.classList.remove('hidden');
    document.getElementById('btn-back-leaderboard').focus();
});

document.getElementById('btn-shop-menu').addEventListener('click', () => {
    hideAllMenus();
    updateShopUI();
    shopMenu.classList.remove('hidden');
    document.getElementById('btn-shop-snakes').focus();
});

document.getElementById('btn-shop-snakes').addEventListener('click', () => {
    hideAllMenus();
    shopSnakes.classList.remove('hidden');
    document.getElementById('btn-back-shop-snakes').focus();
});

document.getElementById('btn-shop-modes').addEventListener('click', () => {
    hideAllMenus();
    shopModes.classList.remove('hidden');
    document.getElementById('btn-back-shop-modes').focus();
});

document.getElementById('btn-shop-other').addEventListener('click', () => {
    hideAllMenus();
    shopOther.classList.remove('hidden');
    document.getElementById('btn-buy-9193').focus();
});

document.getElementById('btn-buy-9193').addEventListener('click', () => {
    buyItem('9193', 900000, () => {
        bought9193Hint = true;
        localStorage.setItem('bought9193Hint', 'true');
    });
});

document.getElementById('btn-buy-master').addEventListener('click', () => {
    buyItem('master', 9000000, () => {
        boughtMasterHint = true;
        localStorage.setItem('boughtMasterHint', 'true');
    });
});

document.getElementById('btn-buy-princess').addEventListener('click', () => {
    buyItem('princess', 50000, () => {
        unlockedPrincess = true;
        localStorage.setItem('serpentineUnlockedPrincess', 'true');
        const p = snakeProfiles.find(prof => prof.id === 'princess');
        if (p) p.locked = false;
    });
});

document.getElementById('btn-buy-arthropod').addEventListener('click', () => {
    buyItem('arthropod', 75000, () => {
        unlockedArthropod = true;
        localStorage.setItem('serpentineUnlockedArthropod', 'true');
        const p = snakeProfiles.find(prof => prof.id === 'arthropod');
        if (p) p.locked = false;
    });
});

document.getElementById('btn-buy-dragon').addEventListener('click', () => {
    buyItem('dragon', 100000, () => {
        unlockedDragon = true;
        localStorage.setItem('serpentineUnlockedDragon', 'true');
        const p = snakeProfiles.find(prof => prof.id === 'dragon');
        if (p) p.locked = false;
    });
});

document.getElementById('btn-back-shop').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-shop-menu').focus();
});

document.getElementById('btn-back-shop-snakes').addEventListener('click', () => {
    hideAllMenus();
    shopMenu.classList.remove('hidden');
    document.getElementById('btn-shop-snakes').focus();
});

document.getElementById('btn-back-shop-modes').addEventListener('click', () => {
    hideAllMenus();
    shopMenu.classList.remove('hidden');
    document.getElementById('btn-shop-modes').focus();
});

document.getElementById('btn-back-shop-other').addEventListener('click', () => {
    hideAllMenus();
    shopMenu.classList.remove('hidden');
    document.getElementById('btn-shop-other').focus();
});

document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-scores-menu').focus();
});

// Leaderboard tab switching
document.querySelectorAll('.btn-lb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        renderLeaderboard(tab.dataset.diff);
    });
});

document.getElementById('btn-controls-menu').addEventListener('click', () => {
    hideAllMenus();
    controlsScreen.classList.remove('hidden');
    document.getElementById('btn-back-controls').focus();
});

document.getElementById('btn-back-controls').addEventListener('click', () => {
    hideAllMenus();
    if (isPlaying) {
        pauseScreen.classList.remove('hidden');
        document.getElementById('btn-pause-controls').focus();
    } else {
        mainMenu.classList.remove('hidden');
        document.getElementById('btn-controls-menu').focus();
    }
});

document.getElementById('btn-exit-menu').addEventListener('click', () => {
    mainMenu.innerHTML = "<h2 style='color:#ff0055; text-align:center; font-size:3rem; margin-top:100px;'>SYSTEM OFFLINE</h2>";
});

document.getElementById('btn-standard').addEventListener('click', () => {
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

document.getElementById('btn-back-mode').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-play-menu').focus();
});

const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentDifficultySpeed = parseInt(e.target.dataset.speed) || 120;
        // Map speed to label
        const speedMap = { '180': 'easy', '120': 'medium', '80': 'hard', '50': 'insane' };
        currentDifficultyLabel = speedMap[e.target.dataset.speed] || 'medium';
        startGame();
    });
});

document.getElementById('btn-back-diff').addEventListener('click', () => {
    hideAllMenus();
    modeSelect.classList.remove('hidden');
    document.getElementById('btn-standard').focus();
});

document.getElementById('btn-select-char').addEventListener('click', () => {
    if (!snakeProfiles[selectedProfileIndex].locked) {
        hideAllMenus();
        mainMenu.classList.remove('hidden');
        document.getElementById('btn-char-menu').focus();
    }
});

document.getElementById('btn-back-char').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-char-menu').focus();
});

document.getElementById('btn-char-options').addEventListener('click', () => {
    hideAllMenus();
    renderCharOptionsScreen();
    document.getElementById('char-options-screen').classList.remove('hidden');
    document.getElementById('btn-back-char-options').focus();
});

document.getElementById('btn-back-char-options').addEventListener('click', () => {
    hideAllMenus();
    startScreen.classList.remove('hidden');
    document.getElementById('btn-char-options').focus();
});

function renderCharOptionsScreen() {
    const profile = snakeProfiles[selectedProfileIndex];
    document.getElementById('char-options-name').textContent = profile.name;
    const list = document.getElementById('char-options-list');
    list.innerHTML = '';
    
    if (!profile.characterOptions) return;
    
    profile.characterOptions.forEach(opt => {
        const currentVal = getCharOption(profile.id, opt.key);

        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px;';

        const label = document.createElement('div');
        label.style.cssText = 'color: #aaa; font-size: 0.85rem; letter-spacing: 1px;';
        label.textContent = opt.label;

        const btn = document.createElement('button');
        btn.className = 'btn-menu';
        btn.style.cssText = 'width: auto; padding: 5px 15px; font-size: 0.8rem;';
        btn.textContent = currentVal;

        btn.addEventListener('click', () => {
            const idx = opt.values.indexOf(currentVal);
            const nextIdx = (idx + 1) % opt.values.length;
            const newVal = opt.values[nextIdx];
            setCharOption(profile.id, opt.key, newVal);
            playMenuSelectSound();
            renderCharOptionsScreen(); // Re-render text/buttons
            updateProfileStyle();     // Update Cabinet colors & card immediately
        });

        row.appendChild(label);
        row.appendChild(btn);
        list.appendChild(row);
    });
}

function getMaxSnakeLength(profile) {
    if (profile.id === 'princess' && getCharOption('princess', 'playStyle') === 'REALISTIC') {
        return 5; // Head + 4 body segments
    }
    if (profile.isCheater) return 9;
    return null; // No limit
}

document.getElementById('btn-submit-initials').addEventListener('click', submitInitials);

// Button Bindings
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-play-menu').focus();
});

// Pause Menu Buttons
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-pause-controls').addEventListener('click', () => {
    hideAllMenus();
    controlsScreen.classList.remove('hidden');
    document.getElementById('btn-back-controls').focus();
});
document.getElementById('btn-pause-quit').addEventListener('click', () => {
    isPaused = false; 
    hideAllMenus(); 
    triggerGameOver(); 
    startMenuMusic(); // Immediate return of atmosphere
});

// Initialization
document.getElementById('btn-initialize').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    startMenuMusic();
    document.getElementById('btn-play-menu').focus();
});

// Global Button Sounds
document.querySelectorAll('.btn-menu').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (!btn.disabled && !btn.style.pointerEvents) playMenuNavSound();
    });
    btn.addEventListener('click', () => {
        if (btn.classList.contains('btn-secondary') || btn.classList.contains('btn-danger')) {
            playMenuBackSound();
        } else {
            playMenuSelectSound();
        }
    });
});

// Start global animation loop
hideAllMenus();
document.getElementById('init-screen').classList.remove('hidden');
document.getElementById('btn-initialize').focus();
updateProfileStyle(); // Sets Initial snake Profile
initGrid();
window.requestAnimationFrame(main);
