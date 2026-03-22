const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// Debug
console.log('Original length:', code.length);

code = code.replace(/const startScreen[\s\S]*?const menuBtn = document.getElementById\('menu-btn'\);/,
`const mainMenu = document.getElementById('main-menu');
const modeSelect = document.getElementById('mode-select');
const diffSelect = document.getElementById('difficulty-select');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');`);

code = code.replace(/const initialSpeed = 120;\s*\/\/\s*MS per frame/,
`const initialSpeed = 120;\nlet currentDifficultySpeed = 120; // Default Medium`);

code = code.replace(/\/\*\s*---\s*Snake Profiles\s*---\s*\*\/[\s\S]*?let selectedProfileIndex = 0;/,
`/* --- Snake Profiles --- */
let unlockedSpectrum = localStorage.getItem('serpentineUnlockedSpectrum') === 'true';

const snakeProfiles = [
    { id: "neon", name: "NEON PROTOCOL", lore: "The original OS baseline. Reliable, bright, and fiercely fast.", head: "#00ffcc", body: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)", food: "#ff0088", foodGlow: "rgba(255, 0, 136, 0.8)", accent: "#0055ff" },
    { id: "void", name: "VOID WALKER", lore: "Born in the corrupted null-sectors of the mainframe. Siphons energy from the background.", head: "#8a2be2", body: "#8a2be2", glow: "rgba(138, 43, 226, 0.8)", food: "#00ffff", foodGlow: "rgba(0, 255, 255, 0.8)", accent: "#ff00ff" },
    { id: "gold", name: "GOLD-FI", lore: "A luxury data-packet miner. Runs hot, blindingly bright, and leaves a trail of pure wealth.", head: "#ffd700", body: "#ffd700", glow: "rgba(255, 215, 0, 0.6)", food: "#ff4500", foodGlow: "rgba(255, 69, 0, 0.8)", accent: "#ffffff" },
    { id: "glitch", name: "GLITCH-WAVE", lore: "An unstable remnant of a deleted game file. It doesn't play by the rules.", head: "#ff0055", body: "#ff0055", glow: "rgba(255, 0, 85, 0.6)", food: "#ff0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#800080" },
    { id: "mecha", name: "MECHA-SERPENT", lore: "Military-grade intrusion software. Designed to violently overwrite hostile firewalls.", head: "#708090", body: "#708090", glow: "rgba(112, 128, 144, 0.5)", food: "#c0c0c0", foodGlow: "rgba(192, 192, 192, 0.8)", accent: "#ffffff" },
    { id: "spectrum", name: "CHROMATIC PUNCH", lore: "A multi-colored shifting anomaly unlocked by eating 20 food in a standard run. Smells like fruit punch.", head: "#ff0055", body: "#ff0055", glow: "rgba(255, 0, 85, 0.6)", food: "#00ffcc", foodGlow: "rgba(0, 255, 204, 0.8)", accent: "#ffff00", isShifting: true, locked: !unlockedSpectrum }
];
let selectedProfileIndex = 0;`);

code = code.replace(/function updateProfileStyle\(\) \{[\s\S]*?colors\.accent = profile\.accent;\s*\n\}/,
`function updateProfileStyle() {
    const profile = snakeProfiles[selectedProfileIndex];
    document.documentElement.style.setProperty('--snake-color', profile.body);
    document.documentElement.style.setProperty('--snake-glow', \`0 0 10px \${profile.body}, 0 0 20px \${profile.body}\`);
    
    if (profile.food) document.documentElement.style.setProperty('--food-color', profile.food);
    if (profile.accent) document.documentElement.style.setProperty('--accent-color', profile.accent);
    
    document.getElementById('char-name').textContent = profile.name;
    document.getElementById('char-lore').textContent = profile.lore;
    document.getElementById('char-name').style.color = profile.body;
    document.getElementById('char-name').style.textShadow = \`0 0 10px \${profile.body}\`;
    
    const lockText = document.getElementById('char-lock-status');
    const selectBtn = document.getElementById('btn-select-char');
    if (lockText && selectBtn) {
        if (profile.locked) {
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
    
    if (!profile.isShifting) {
        colors.snakeHead = profile.head;
        colors.snakeBody = profile.body;
        colors.snakeGlow = profile.glow;
    }
    if (profile.food) colors.food = profile.food;
    if (profile.foodGlow) colors.foodGlow = profile.foodGlow;
    if (profile.accent) colors.accent = profile.accent;
}`);

code = code.replace(/currentSpeed = initialSpeed;/, `currentSpeed = currentDifficultySpeed;`);

code = code.replace(/\/\/ Slightly increase speed \(cap at half of current initial speed\)[\s\S]*?currentSpeed = Math.max\(currentDifficultySpeed \/ 2, currentDifficultySpeed - \(score \* 0\.5\)\);/, 
`        // Slightly increase speed
        currentSpeed = Math.max(currentDifficultySpeed / 2, currentDifficultySpeed - (score * 0.5));
        
        // Unlock Spectrum check
        if (score >= 200 && localStorage.getItem('serpentineUnlockedSpectrum') !== 'true') {
            localStorage.setItem('serpentineUnlockedSpectrum', 'true');
            const spectrum = snakeProfiles.find(p => p.id === 'spectrum');
            if (spectrum) spectrum.locked = false;
        }`);
        
// Wait, the replaced string was initialSpeed - (score * 0.5), cap at 60 originally
code = code.replace(/currentSpeed = Math\.max\(60, initialSpeed - \(score \* 0\.5\)\);/,
`        currentSpeed = Math.max(currentDifficultySpeed / 2, currentDifficultySpeed - (score * 0.5));
        
        // Unlock Spectrum check
        if (score >= 200 && localStorage.getItem('serpentineUnlockedSpectrum') !== 'true') {
            localStorage.setItem('serpentineUnlockedSpectrum', 'true');
            const spectrum = snakeProfiles.find(p => p.id === 'spectrum');
            if (spectrum) spectrum.locked = false;
        }`);

code = code.replace(/function draw\(\) \{\s*\/\/\s*Fill Background\s*ctx\.fillStyle = colors\.bg;/,
`function draw() {
    const profile = snakeProfiles[selectedProfileIndex];
    if (profile.isShifting) {
        const time = Date.now() / 15;
        const shiftHue = time % 360;
        colors.snakeBody = \`hsl(\${(shiftHue + 30) % 360}, 100%, 50%)\`;
        colors.snakeHead = \`hsl(\${shiftHue}, 100%, 60%)\`;
        colors.snakeGlow = \`hsla(\${shiftHue}, 100%, 50%, 0.6)\`;
        document.documentElement.style.setProperty('--snake-color', colors.snakeBody);
        document.documentElement.style.setProperty('--snake-glow', \`0 0 10px \${colors.snakeBody}, 0 0 20px \${colors.snakeBody}\`);
    }

    // Fill Background
    ctx.fillStyle = colors.bg;`);

code = code.replace(/if \(!isPlaying && document\.getElementById\('start-screen'\)\.classList\.contains\('hidden'\) === false\) \{/, `if (!isPlaying) {`);

code = code.replace(/startScreen\.classList\.add\('hidden'\);\s*gameOverScreen\.classList\.add\('hidden'\);/,
`    if (mainMenu) mainMenu.classList.add('hidden');
    if (modeSelect) modeSelect.classList.add('hidden');
    if (diffSelect) diffSelect.classList.add('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');`);

code = code.replace(/\/\/ Menu Nav Bindings[\s\S]*$/,
`// Menu Nav Bindings
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
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
};

document.getElementById('btn-play-menu').addEventListener('click', () => {
    hideAllMenus();
    modeSelect.classList.remove('hidden');
});

document.getElementById('btn-char-menu').addEventListener('click', () => {
    hideAllMenus();
    startScreen.classList.remove('hidden');
});

document.getElementById('btn-exit-menu').addEventListener('click', () => {
    mainMenu.innerHTML = "<h2 style='color:#ff0055; text-align:center; font-size:3rem; margin-top:100px;'>SYSTEM OFFLINE</h2>";
});

document.getElementById('btn-standard').addEventListener('click', () => {
    hideAllMenus();
    diffSelect.classList.remove('hidden');
});

document.getElementById('btn-back-mode').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
});

const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentDifficultySpeed = parseInt(e.target.dataset.speed) || 120;
        startGame();
    });
});

document.getElementById('btn-back-diff').addEventListener('click', () => {
    hideAllMenus();
    modeSelect.classList.remove('hidden');
});

document.getElementById('btn-select-char').addEventListener('click', () => {
    if (!snakeProfiles[selectedProfileIndex].locked) {
        hideAllMenus();
        mainMenu.classList.remove('hidden');
    }
});

document.getElementById('btn-back-char').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
});

// Button Bindings
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
});

window.addEventListener('keydown', e => {
    if (!isPlaying && !mainMenu.classList.contains('hidden') && (e.code === 'Enter' || e.code === 'Space')) {
        document.getElementById('btn-play-menu').click();
    }
});

// Start global animation loop
hideAllMenus();
mainMenu.classList.remove('hidden');
updateProfileStyle(); // Sets Initial snake Profile
initGrid();
window.requestAnimationFrame(main);
`);

console.log('Modified length:', code.length);
fs.writeFileSync('script.js', code, 'utf8');
