const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game Core Configuration
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const initialSpeed = 120; // MS per frame

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
const snakeProfiles = [
    { name: "NEON PROTOCOL", lore: "The original OS baseline. Reliable, bright, and fiercely fast.", head: "#00ffcc", body: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)" },
    { name: "VOID WALKER", lore: "Born in the corrupted null-sectors of the mainframe. Siphons energy from the background.", head: "#8a2be2", body: "#8a2be2", glow: "rgba(138, 43, 226, 0.8)" },
    { name: "GOLD-FI", lore: "A luxury data-packet miner. Runs hot, blindingly bright, and leaves a trail of pure wealth.", head: "#ffd700", body: "#ffd700", glow: "rgba(255, 215, 0, 0.6)" },
    { name: "GLITCH-WAVE", lore: "An unstable remnant of a deleted game file. It doesn't play by the rules.", head: "#ff0055", body: "#ff0055", glow: "rgba(255, 0, 85, 0.6)" },
    { name: "MECHA-SERPENT", lore: "Military-grade intrusion software. Designed to violently overwrite hostile firewalls.", head: "#708090", body: "#708090", glow: "rgba(112, 128, 144, 0.5)" }
];
let selectedProfileIndex = 0;

function updateProfileStyle() {
    const profile = snakeProfiles[selectedProfileIndex];
    document.documentElement.style.setProperty('--snake-color', profile.body);
    document.documentElement.style.setProperty('--snake-glow', `0 0 10px ${profile.body}, 0 0 20px ${profile.body}`);
    document.getElementById('char-name').textContent = profile.name;
    document.getElementById('char-lore').textContent = profile.lore;
    document.getElementById('char-name').style.color = profile.body;
    document.getElementById('char-name').style.textShadow = `0 0 10px ${profile.body}`;
    
    colors.snakeHead = profile.head;
    colors.snakeBody = profile.body;
    colors.snakeGlow = profile.glow;
}

// State Variables
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('neonSnakeHighScore') || 0;
let isPlaying = false;
let lastRenderTime = 0;
let particles = [];
let currentSpeed = initialSpeed;
let pendingDirection = null; // Prevent double-turn death

// Initial DOM Setup
highScoreElement.textContent = highScore;

// --- Audio Engine (Synthesizer) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();
let musicGain = null;
let musicInterval = null;

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
    if (musicInterval) clearInterval(musicInterval);
    
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.4;
    musicGain.connect(audioCtx.destination);
    currentStep = 0;
    
    musicInterval = setInterval(() => {
        if (!isPlaying) return;
        
        const time = audioCtx.currentTime;
        
        // 1. Bassline (Constant driving 8th notes)
        playSynthTone(getBassFreq(currentStep), 'sawtooth', 0.15, 0.6, 800, time);
        
        // 2. Melody (Drops in at halfway mark on step 128)
        const melFreq = getMelodyFreq(currentStep);
        if (melFreq) playSynthTone(melFreq, 'square', 0.15, 0.25, 1200, time);
        
        // 3. Drums: 4-on-the-floor kick pattern
        if (currentStep % 4 === 0) playKick(time);
        
        // 4. Drums: Snare on backbeat
        if (currentStep % 8 === 4) playSnare(time);
        
        // Advance sequencer tape
        currentStep = (currentStep + 1) % SEQUENCER_STEPS;
    }, 150); 
}

function stopMusic() {
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = null;
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
    // Start at center
    snake = [
        { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }
    ];
    dx = 0;
    dy = -1; // Moving up to start
    pendingDirection = { dx, dy };
    score = 0;
    currentSpeed = initialSpeed;
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
    
    if (!isPlaying) return;
    
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

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 1. Collision Check - Walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        triggerGameOver();
        return;
    }
    
    // 2. Collision Check - Self
    // We only check if there is movement (dx or dy)
    if (dx !== 0 || dy !== 0) {
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
        score += 10;
        scoreElement.textContent = score;
        
        // UI Juice: Pop the score element
        scoreElement.style.transform = 'scale(1.4)';
        setTimeout(() => scoreElement.style.transform = 'scale(1)', 150);
        
        // Sound and Visual effects
        playEatSound();
        burstParticles(food.x, food.y);
        placeFood();
        
        // Slightly increase speed (cap at 60ms)
        currentSpeed = Math.max(60, initialSpeed - (score * 0.5));
    } else {
        // Pop Tail if we didn't eat
        snake.pop();
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
    // Fill Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    if (!isPlaying && document.getElementById('start-screen').classList.contains('hidden') === false) {
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
    
    ctx.beginPath();
    ctx.roundRect(
        food.x * gridSize + padding - offset, 
        food.y * gridSize + padding - offset, 
        foodSize, 
        foodSize, 
        6 // border radius
    );
    ctx.fill();
    ctx.restore();
    
    // --- Draw Snake ---
    snake.forEach((segment, index) => {
        ctx.save();
        const isHead = index === 0;
        
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
        
        ctx.restore();
    });
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
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Clear shake
    document.querySelector('.arcade-machine').classList.remove('shake');
    
    initGrid();
    lastRenderTime = performance.now();
    startMusic();
}

function triggerGameOver() {
    isPlaying = false;
    stopMusic();
    playDeathSound();
    
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
        localStorage.setItem('neonSnakeHighScore', highScore);
        highScoreElement.textContent = highScore;
        scoreElement.style.color = colors.accent; // highlight new best
        
        // Celebrate new high score with random particles
        for(let i=0; i<3; i++) {
           setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, colors.accent, 30), i * 300);
        }
    }
    
    finalScoreElement.textContent = score;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1500);
}

// --- Input Handling ---

window.addEventListener('keydown', e => {
    // Prevent scrolling for game controls
    if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
    }
    
    if ((e.code === 'Space' || e.code === 'Enter') && !isPlaying) {
        startGame();
        return;
    }
    
    if (!isPlaying) return;
    
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

// Button Bindings
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start global animation loop
updateProfileStyle(); // Sets Initial snake Profile
initGrid();
window.requestAnimationFrame(main);
