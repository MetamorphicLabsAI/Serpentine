// ═══════════════════════════════════════════════════════════════════════════
// SENTINEL BREACH MODE IMPLEMENTATION
// Wave-Defense Game Mode — Protect the Nexus from hostile sentinels
// ═══════════════════════════════════════════════════════════════════════════

// ── Sentinel Breach State ────────────────────────────────────────────────

const SentinelBreach = {
    active: false,
    paused: false,
    playerSnake: [],
    playerDx: 0,
    playerDy: -1,
    playerSpeed: 120,
    nexusX: 10,
    nexusY: 10,
    currentWave: 1,
    waveInProgress: false,
    sentinels: [],
    sentinelsToSpawn: [],
    food: null,
    goldFood: null,
    foodSpawnTimer: 0,
    score: 0,
    highScore: 0,
    difficulty: 'medium',
    difficultySettings: {
        easy: { speedMod: 40, maxSentinels: 10, titanWave: 3 },
        medium: { speedMod: 0, maxSentinels: 20, titanWave: 5 },
        hard: { speedMod: -10, maxSentinels: 25, titanWave: 3 },
        insane: { speedMod: -20, maxSentinels: 30, titanWave: 2, hunterLead: 4 }
    },
    nexusHum: null,
    playerTickAccum: 0,
    lastUpdateTime: 0,
    pendingDirection: null
};

// ── Sentinel Types ─────────────────────────────────────────────────────────

const SENTINEL_TYPES = {
    PROBE: { segments: 3, baseTick: 250, color: '#4488ff', bodyColor: '#2244aa', points: 100, behavior: 'wander' },
    SWARMER: { segments: 4, baseTick: 180, color: '#ff00aa', bodyColor: '#aa0077', points: 200, behavior: 'pathfind' },
    HUNTER: { segments: 5, baseTick: 120, color: '#ff2200', bodyColor: '#aa1100', points: 500, behavior: 'hunt' },
    TITAN: { segments: 8, baseTick: 300, color: '#ff8800', bodyColor: '#cc5500', points: 2000, hitsRequired: 3, behavior: 'titan' }
};

// ── Wave Definitions ───────────────────────────────────────────────────────

const WAVE_DEFINITIONS = [
    { PROBE: 3, SWARMER: 0, HUNTER: 0, TITAN: 0 },
    { PROBE: 5, SWARMER: 0, HUNTER: 0, TITAN: 0 },
    { PROBE: 4, SWARMER: 2, HUNTER: 0, TITAN: 0 },
    { PROBE: 3, SWARMER: 4, HUNTER: 0, TITAN: 0 },
    { PROBE: 2, SWARMER: 3, HUNTER: 1, TITAN: 0 }
];

function getWaveDefinition(waveNum) {
    if (waveNum <= WAVE_DEFINITIONS.length) return WAVE_DEFINITIONS[waveNum - 1];
    const base = WAVE_DEFINITIONS[WAVE_DEFINITIONS.length - 1];
    const extra = waveNum - WAVE_DEFINITIONS.length;
    return {
        PROBE: 2,
        SWARMER: Math.min(base.SWARMER + Math.floor(extra / 3), 8),
        HUNTER: base.HUNTER + Math.floor(extra / 2),
        TITAN: Math.floor(extra / 5)
    };
}

// ── Sentinel Class ─────────────────────────────────────────────────────────

class Sentinel {
    constructor(type, x, y) {
        this.type = type;
        this.config = SENTINEL_TYPES[type];
        this.segments = [];
        for (let i = 0; i < this.config.segments; i++) this.segments.push({ x, y: y + i });
        this.direction = this.randomDirection();
        this.tickAccum = 0;
        this.wanderTimer = 0;
        this.dead = false;
        this.hitsTaken = 0;
    }

    randomDirection() {
        const dirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
        ];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }

    get head() { return this.segments[0]; }

    get tickInterval() {
        const diff = SentinelBreach.difficultySettings[SentinelBreach.difficulty] || { speedMod: 0 };
        return Math.max(80, this.config.baseTick + (diff.speedMod || 0));
    }

    update() {
        if (this.dead) return;
        this.tickAccum += 16;
        if (this.tickAccum < this.tickInterval) return;
        this.tickAccum = 0;

        const head = this.head;
        let nextDir = { ...this.direction };

        switch (this.config.behavior) {
            case 'wander':
                this.wanderTimer++;
                if (this.wanderTimer > 3 || this.shouldTurn(head)) {
                    nextDir = this.randomDirection();
                    this.wanderTimer = 0;
                }
                break;
            case 'pathfind':
                nextDir = this.pathfindToTarget(SentinelBreach.nexusX, SentinelBreach.nexusY);
                if (Math.random() < 0.2) {
                    const jitter = Math.random() < 0.5 ? 1 : -1;
                    nextDir = { dx: nextDir.dy * jitter, dy: nextDir.dx * jitter };
                }
                break;
            case 'hunt':
                const leadCells = (SentinelBreach.difficultySettings[SentinelBreach.difficulty]?.hunterLead) || 2;
                const playerHead = SentinelBreach.playerSnake[0];
                nextDir = this.pathfindToTarget(playerHead.x + SentinelBreach.playerDx * leadCells, playerHead.y + SentinelBreach.playerDy * leadCells);
                break;
            case 'titan':
                nextDir = this.pathfindToTarget(SentinelBreach.nexusX, SentinelBreach.nexusY);
                break;
        }

        const newHead = { x: head.x + nextDir.dx, y: head.y + nextDir.dy };
        if (this.isValidMove(newHead)) {
            this.direction = nextDir;
            this.segments.unshift(newHead);
            this.segments.pop();
        } else {
            const alternates = this.getAlternateDirections(nextDir);
            for (const alt of alternates) {
                const testHead = { x: head.x + alt.dx, y: head.y + alt.dy };
                if (this.isValidMove(testHead)) {
                    this.direction = alt;
                    this.segments.unshift(testHead);
                    this.segments.pop();
                    break;
                }
            }
        }
    }

    pathfindToTarget(tx, ty) {
        const head = this.head;
        const dx = tx - head.x;
        const dy = ty - head.y;
        const moves = [];
        if (dx !== 0) moves.push({ dx: Math.sign(dx), dy: 0 });
        if (dy !== 0) moves.push({ dx: 0, dy: Math.sign(dy) });
        if (dx !== 0 && dy !== 0) moves.push({ dx: Math.sign(dx), dy: Math.sign(dy) });
        return moves[0] || { dx: 0, dy: -1 };
    }

    getAlternateDirections(dir) {
        if (dir.dx !== 0) return [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        return [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
    }

    shouldTurn(head) {
        const nextX = head.x + this.direction.dx;
        const nextY = head.y + this.direction.dy;
        return nextX < 0 || nextX >= 20 || nextY < 0 || nextY >= 20 || this.isOccupiedByPlayer(nextX, nextY);
    }

    isValidMove(pos) {
        return pos.x >= 0 && pos.x < 20 && pos.y >= 0 && pos.y < 20 &&
               !this.isOccupiedByPlayer(pos.x, pos.y) && !this.isOnSentinelBody(pos);
    }

    isOccupiedByPlayer(x, y) {
        return SentinelBreach.playerSnake.some(seg => seg.x === x && seg.y === y);
    }

    isOnSentinelBody(x, y) {
        for (const sent of SentinelBreach.sentinels) {
            if (sent === this || sent.dead) continue;
            for (let i = 1; i < sent.segments.length; i++) {
                if (sent.segments[i].x === x && sent.segments[i].y === y) return true;
            }
        }
        return false;
    }

    hit() {
        this.hitsTaken++;
        if (this.config.hitsRequired && this.hitsTaken >= this.config.hitsRequired) {
            this.dead = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (this.dead) return;
        const time = Date.now();
        const pulse = Math.sin(time / 100) * 2;

        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const isHead = i === 0;
            ctx.save();

            if (isHead) {
                ctx.fillStyle = this.config.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.config.color;
                const headSize = this.type === 'TITAN' ? 12 : 8;
                ctx.beginPath();
                ctx.arc(seg.x * gridSize + gridSize / 2, seg.y * gridSize + gridSize / 2, headSize + pulse * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(seg.x * gridSize + gridSize / 2 - 3, seg.y * gridSize + gridSize / 2 - 2, 2, 0, Math.PI * 2);
                ctx.arc(seg.x * gridSize + gridSize / 2 + 3, seg.y * gridSize + gridSize / 2 - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = this.config.bodyColor;
                ctx.globalAlpha = 0.7 + (1 - i / this.segments.length) * 0.3;
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.config.color;
                ctx.beginPath();
                ctx.roundRect(seg.x * gridSize + 2, seg.y * gridSize + 2, gridSize - 4, gridSize - 4, 3);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

// ── Sentinel Breach Core Functions ────────────────────────────────────────

function initSentinelBreach(difficulty) {
    const settings = SentinelBreach.difficultySettings[difficulty] || SentinelBreach.difficultySettings.medium;

    SentinelBreach.active = true;
    SentinelBreach.paused = false;
    SentinelBreach.difficulty = difficulty;
    SentinelBreach.currentWave = 1;
    SentinelBreach.waveInProgress = false;
    SentinelBreach.sentinels = [];
    SentinelBreach.sentinelsToSpawn = [];
    SentinelBreach.score = 0;
    SentinelBreach.food = null;
    SentinelBreach.goldFood = null;
    SentinelBreach.foodSpawnTimer = 0;
    SentinelBreach.playerTickAccum = 0;
    SentinelBreach.pendingDirection = null;

    const cx = Math.floor(tileCount / 2);
    const cy = Math.floor(tileCount / 2);
    SentinelBreach.nexusX = cx;
    SentinelBreach.nexusY = cy;
    SentinelBreach.playerSnake = [
        { x: cx, y: cy - 1 },
        { x: cx, y: cy },
        { x: cx, y: cy + 1 }
    ];
    SentinelBreach.playerDx = 0;
    SentinelBreach.playerDy = -1;

    const board = getLeaderboard(`sentinel_${difficulty}`);
    SentinelBreach.highScore = board.length > 0 ? board[0].score : 0;

    document.getElementById('score').parentElement.style.visibility = 'hidden';
    document.getElementById('high-score').parentElement.style.visibility = 'hidden';
    document.getElementById('sentinel-hud').classList.remove('hidden');
    updateSentinelHUD();

    startSentinelAudio();
    startWaveCountdown();
}

function startSentinelAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    SentinelBreach.nexusHum = audioCtx.createOscillator();
    const nexusGain = audioCtx.createGain();
    SentinelBreach.nexusHum.type = 'sine';
    SentinelBreach.nexusHum.frequency.value = 60;
    nexusGain.gain.value = 0.05;
    SentinelBreach.nexusHum.connect(nexusGain);
    nexusGain.connect(audioCtx.destination);
    SentinelBreach.nexusHum.start();
}

function stopSentinelAudio() {
    if (SentinelBreach.nexusHum) {
        SentinelBreach.nexusHum.stop();
        SentinelBreach.nexusHum = null;
    }
}

function playSentinelSpawnSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

function playSentinelDeathSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.2;
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
}

function playWaveCompleteSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [200, 300, 400].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
    });
}

function playGameOverSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopSentinelAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.8);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
}

function startWaveCountdown() {
    const announce = document.getElementById('sentinel-wave-announce');
    const waveText = document.getElementById('sentinel-wave-text');
    const waveSub = document.getElementById('sentinel-wave-sub');
    waveText.textContent = `WAVE ${SentinelBreach.currentWave}`;
    waveSub.textContent = 'INCOMING';
    announce.classList.remove('hidden');
    setTimeout(() => {
        announce.classList.add('hidden');
        startWave();
    }, 3000);
}

function startWave() {
    SentinelBreach.waveInProgress = true;
    const waveDef = getWaveDefinition(SentinelBreach.currentWave);
    SentinelBreach.sentinelsToSpawn = [];
    for (let i = 0; i < waveDef.PROBE; i++) SentinelBreach.sentinelsToSpawn.push('PROBE');
    for (let i = 0; i < waveDef.SWARMER; i++) SentinelBreach.sentinelsToSpawn.push('SWARMER');
    for (let i = 0; i < waveDef.HUNTER; i++) SentinelBreach.sentinelsToSpawn.push('HUNTER');
    for (let i = 0; i < waveDef.TITAN; i++) SentinelBreach.sentinelsToSpawn.push('TITAN');
    spawnSentinels(Math.min(3, SentinelBreach.sentinelsToSpawn.length));

    const spawnInterval = setInterval(() => {
        if (!SentinelBreach.active || !SentinelBreach.waveInProgress) {
            clearInterval(spawnInterval);
            return;
        }
        const toSpawn = Math.min(2, SentinelBreach.sentinelsToSpawn.length);
        spawnSentinels(toSpawn);
        if (SentinelBreach.sentinelsToSpawn.length === 0) clearInterval(spawnInterval);
    }, 2000);
}

function spawnSentinels(count) {
    const settings = SentinelBreach.difficultySettings[SentinelBreach.difficulty] || { maxSentinels: 20 };
    for (let i = 0; i < count; i++) {
        if (SentinelBreach.sentinels.length >= settings.maxSentinels) break;
        if (SentinelBreach.sentinelsToSpawn.length === 0) break;
        const type = SentinelBreach.sentinelsToSpawn.shift();
        const spawnPos = getRandomEdgePosition();
        if (spawnPos) {
            SentinelBreach.sentinels.push(new Sentinel(type, spawnPos.x, spawnPos.y));
            playSentinelSpawnSound();
            burstParticles(spawnPos.x, spawnPos.y, SENTINEL_TYPES[type].color, 10);
        }
    }
    updateSentinelHUD();
}

function getRandomEdgePosition() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
        case 0: x = Math.floor(Math.random() * tileCount); y = 0; break;
        case 1: x = tileCount - 1; y = Math.floor(Math.random() * tileCount); break;
        case 2: x = Math.floor(Math.random() * tileCount); y = tileCount - 1; break;
        case 3: x = 0; y = Math.floor(Math.random() * tileCount); break;
    }
    const distToNexus = Math.abs(x - SentinelBreach.nexusX) + Math.abs(y - SentinelBreach.nexusY);
    if (distToNexus < 5) return null;
    if (SentinelBreach.playerSnake.some(seg => seg.x === x && seg.y === y)) return null;
    return { x, y };
}

function updateSentinelBreach(currentTime) {
    if (!SentinelBreach.active || SentinelBreach.paused) return;
    const deltaTime = currentTime - SentinelBreach.lastUpdateTime;
    SentinelBreach.lastUpdateTime = currentTime;

    SentinelBreach.playerTickAccum += deltaTime;
    if (SentinelBreach.playerTickAccum >= SentinelBreach.playerSpeed) {
        SentinelBreach.playerTickAccum = 0;
        updateSentinelPlayer();
    }

    SentinelBreach.sentinels.forEach(sentinel => { if (!sentinel.dead) sentinel.update(); });
    SentinelBreach.sentinels = SentinelBreach.sentinels.filter(s => !s.dead);

    SentinelBreach.foodSpawnTimer += deltaTime;
    if (SentinelBreach.foodSpawnTimer >= 2000 && !SentinelBreach.food) {
        placeSentinelFood();
        SentinelBreach.foodSpawnTimer = 0;
    }

    if (SentinelBreach.waveInProgress && SentinelBreach.sentinelsToSpawn.length === 0 && SentinelBreach.sentinels.length === 0) {
        completeWave();
    }

    checkNexusBreach();
    checkSentinelCollision();
    updateSentinelHUD();
}

function updateSentinelPlayer() {
    if (SentinelBreach.pendingDirection) {
        SentinelBreach.playerDx = SentinelBreach.pendingDirection.dx;
        SentinelBreach.playerDy = SentinelBreach.pendingDirection.dy;
        SentinelBreach.pendingDirection = null;
    }

    const head = SentinelBreach.playerSnake[0];
    const newHead = { x: head.x + SentinelBreach.playerDx, y: head.y + SentinelBreach.playerDy };

    if (newHead.x < 0 || newHead.x >= tileCount || newHead.y < 0 || newHead.y >= tileCount) {
        newHead.x = (newHead.x + tileCount) % tileCount;
        newHead.y = (newHead.y + tileCount) % tileCount;
    }

    const hitSelf = SentinelBreach.playerSnake.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
    if (!hitSelf) SentinelBreach.playerSnake.unshift(newHead);

    // Food collision
    if (SentinelBreach.food && newHead.x === SentinelBreach.food.x && newHead.y === SentinelBreach.food.y) {
        playEatSound();
        burstParticles(SentinelBreach.food.x, SentinelBreach.food.y, '#ff0055', 15);
        SentinelBreach.score += 10;
        if (SentinelBreach.goldFood && newHead.x === SentinelBreach.goldFood.x && newHead.y === SentinelBreach.goldFood.y) {
            SentinelBreach.score += 40;
            SentinelBreach.goldFood = null;
        }
        SentinelBreach.food = null;
        placeSentinelFood();
    }

    // Sentinel head collision - eat sentinel
    for (const sentinel of SentinelBreach.sentinels) {
        if (sentinel.dead) continue;
        const sHead = sentinel.head;
        if (newHead.x === sHead.x && newHead.y === sHead.y) {
            const destroyed = sentinel.hit();
            if (destroyed) {
                sentinel.dead = true;
                SentinelBreach.score += sentinel.config.points;
                playSentinelDeathSound();
                burstParticles(sHead.x, sHead.y, sentinel.config.color, 20);
            }
        }
    }
}

function placeSentinelFood() {
    let pos, valid = false, attempts = 0;
    while (!valid && attempts < 50) {
        pos = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
        valid = !SentinelBreach.playerSnake.some(seg => seg.x === pos.x && seg.y === pos.y);
        if (valid) valid = !SentinelBreach.sentinels.some(s => s.segments.some(seg => seg.x === pos.x && seg.y === pos.y));
        if (valid) {
            const dist = Math.abs(pos.x - SentinelBreach.nexusX) + Math.abs(pos.y - SentinelBreach.nexusY);
            valid = dist >= 3;
        }
        attempts++;
    }
    if (valid) {
        SentinelBreach.food = pos;
        if (Math.random() < 0.1 && SentinelBreach.difficulty !== 'insane') SentinelBreach.goldFood = pos;
    }
}

function checkSentinelCollision() {
    const head = SentinelBreach.playerSnake[0];
    for (const sentinel of SentinelBreach.sentinels) {
        if (sentinel.dead) continue;
        const sHead = sentinel.head;
        if (head.x === sHead.x && head.y === sHead.y) {
            triggerSentinelGameOver();
            return;
        }
        for (let i = 1; i < sentinel.segments.length; i++) {
            if (head.x === sentinel.segments[i].x && head.y === sentinel.segments[i].y) {
                triggerSentinelGameOver();
                return;
            }
        }
    }
}

function checkNexusBreach() {
    const nx = SentinelBreach.nexusX;
    const ny = SentinelBreach.nexusY;
    for (const sentinel of SentinelBreach.sentinels) {
        if (sentinel.dead) continue;
        const sHead = sentinel.head;
        if (Math.abs(sHead.x - nx) <= 1 && Math.abs(sHead.y - ny) <= 1) {
            triggerSentinelGameOver();
            return;
        }
    }
}

function completeWave() {
    SentinelBreach.waveInProgress = false;
    SentinelBreach.score += 1000;
    playWaveCompleteSound();
    showSentinelPopup(`WAVE ${SentinelBreach.currentWave} COMPLETE`);
    setTimeout(() => {
        if (SentinelBreach.active) {
            SentinelBreach.currentWave++;
            startWaveCountdown();
        }
    }, 2000);
}

function showSentinelPopup(text) {
    const announce = document.getElementById('sentinel-wave-announce');
    const waveText = document.getElementById('sentinel-wave-text');
    const waveSub = document.getElementById('sentinel-wave-sub');
    waveText.textContent = text;
    waveSub.textContent = '+1000 PTS';
    announce.classList.remove('hidden');
    setTimeout(() => { if (SentinelBreach.active) announce.classList.add('hidden'); }, 2000);
}

function triggerSentinelGameOver() {
    SentinelBreach.active = false;
    stopSentinelAudio();
    playGameOverSound();
    const head = SentinelBreach.playerSnake[0];
    burstParticles(head.x, head.y, '#ff2200', 40);
    if (settings.screenShake && !settings.reducedMotion) {
        document.querySelector('.arcade-machine').classList.add('shake');
        setTimeout(() => document.querySelector('.arcade-machine').classList.remove('shake'), 500);
    }

    document.getElementById('sentinel-hud').classList.add('hidden');
    document.getElementById('sentinel-final-score').textContent = SentinelBreach.score;
    document.getElementById('sentinel-final-wave').textContent = SentinelBreach.currentWave;
    document.getElementById('sentinel-gameover').classList.remove('hidden');

    if (SentinelBreach.score > 0) {
        bank += SentinelBreach.score;
        localStorage.setItem('serpentineBank', bank);
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.addToBank(SentinelBreach.score);
            saveManager.recordGameEnd({
                score: SentinelBreach.score, foodEaten: 0,
                snakeLength: SentinelBreach.playerSnake.length,
                tickSpeed: SentinelBreach.playerSpeed,
                characterId: snakeProfiles[selectedProfileIndex]?.id || 'neon',
                mode: 'sentinel'
            });
        }
        // Challenge progress tracking
        if (typeof ChallengeManager !== 'undefined') {
            ChallengeManager.onGameEnded('sentinel', SentinelBreach.score, 0, SentinelBreach.playerSnake.length, SentinelBreach.difficulty);
            ChallengeManager.onWaveReached(SentinelBreach.currentWave);
            ChallengeManager.onScoreReached(SentinelBreach.score, 'sentinel');
        }
        // Achievement progress tracking
        if (typeof AchievementManager !== 'undefined') {
            AchievementManager.onGameEnded('sentinel', SentinelBreach.score, SentinelBreach.difficulty);
            AchievementManager.onWaveCleared(SentinelBreach.currentWave, 'sentinel');
        }
        if (isHighScore(`sentinel_${SentinelBreach.difficulty}`, SentinelBreach.score)) {
            isEnteringInitials = true;
            initialsChars = [0, 0, 0];
            initialsSlot = 0;
            pendingHighScoreDiff = `sentinel_${SentinelBreach.difficulty}`;
            pendingHighScoreValue = SentinelBreach.score;
            updateInitialsDisplay();
            document.getElementById('initials-score').textContent = SentinelBreach.score;
            initialsScreen.classList.remove('hidden');
        }
    }
}

function updateSentinelHUD() {
    document.getElementById('sentinel-wave').textContent = SentinelBreach.currentWave;
    document.getElementById('sentinel-score').textContent = SentinelBreach.score.toLocaleString();
    document.getElementById('sentinel-count').textContent = SentinelBreach.sentinels.length;
    document.getElementById('sentinel-best').textContent = SentinelBreach.highScore.toLocaleString();
}

function drawSentinelBreach(ctx) {
    if (!SentinelBreach.active) return;
    const time = Date.now();
    const nx = SentinelBreach.nexusX * gridSize + gridSize;
    const ny = SentinelBreach.nexusY * gridSize + gridSize;
    const pulse = Math.sin(time / 300) * 5;

    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 25 + pulse;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(nx, ny, 30 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(nx, ny, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw food
    if (SentinelBreach.food) {
        const isGold = SentinelBreach.goldFood !== null;
        const fPulse = Math.sin(time / 150) * 2;
        ctx.save();
        ctx.fillStyle = isGold ? '#ffd700' : '#ff0055';
        ctx.shadowBlur = 15;
        ctx.shadowColor = isGold ? '#ffd700' : '#ff0055';
        ctx.beginPath();
        ctx.arc(SentinelBreach.food.x * gridSize + gridSize / 2, SentinelBreach.food.y * gridSize + gridSize / 2, 8 + fPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw sentinels
    SentinelBreach.sentinels.forEach(sentinel => sentinel.draw(ctx));

    // Draw player snake
    for (let i = SentinelBreach.playerSnake.length - 1; i >= 0; i--) {
        const seg = SentinelBreach.playerSnake[i];
        const isHead = i === 0;
        ctx.save();
        if (isHead) {
            ctx.fillStyle = '#00ffcc';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
        } else {
            const opacity = Math.max(0.4, 1 - (i / SentinelBreach.playerSnake.length) * 0.6);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#00cc99';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffcc';
        }
        ctx.beginPath();
        ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 5);
        ctx.fill();
        if (isHead) {
            ctx.fillStyle = '#0a0a0f';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(seg.x * gridSize + gridSize / 2 - 4, seg.y * gridSize + gridSize / 2 - 2, 2, 0, Math.PI * 2);
            ctx.arc(seg.x * gridSize + gridSize / 2 + 4, seg.y * gridSize + gridSize / 2 - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function exitSentinelBreach() {
    SentinelBreach.active = false;
    stopSentinelAudio();
    document.getElementById('sentinel-hud').classList.add('hidden');
    document.getElementById('sentinel-pause').classList.add('hidden');
    document.getElementById('sentinel-gameover').classList.add('hidden');
    document.getElementById('sentinel-wave-announce').classList.add('hidden');
    document.getElementById('score').parentElement.style.visibility = 'visible';
    document.getElementById('high-score').parentElement.style.visibility = 'visible';
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    startMenuMusic();
    document.getElementById('btn-play-menu').focus();
}

function toggleSentinelPause() {
    if (!SentinelBreach.active) return;
    SentinelBreach.paused = !SentinelBreach.paused;
    if (SentinelBreach.paused) {
        document.getElementById('sentinel-pause').classList.remove('hidden');
        if (SentinelBreach.nexusHum) SentinelBreach.nexusHum.disconnect();
    } else {
        document.getElementById('sentinel-pause').classList.add('hidden');
        startSentinelAudio();
    }
}

// ── Event Handlers ─────────────────────────────────────────────────────────

document.getElementById('btn-sentinel')?.addEventListener('click', () => {
    hideAllMenus();
    initSentinelBreach('medium');
});

document.getElementById('btn-sentinel-resume')?.addEventListener('click', toggleSentinelPause);

document.getElementById('btn-sentinel-controls')?.addEventListener('click', () => {
    document.getElementById('sentinel-pause').classList.add('hidden');
    controlsScreen.classList.remove('hidden');
    document.getElementById('btn-back-controls')?.focus();
});

document.getElementById('btn-sentinel-quit')?.addEventListener('click', exitSentinelBreach);

document.getElementById('btn-sentinel-retry')?.addEventListener('click', () => {
    document.getElementById('sentinel-gameover').classList.add('hidden');
    initSentinelBreach(SentinelBreach.difficulty);
});

document.getElementById('btn-sentinel-menu')?.addEventListener('click', exitSentinelBreach);

// Keyboard input
const sentinelKeyHandler = window.addEventListener('keydown', e => {
    if (!SentinelBreach.active || SentinelBreach.paused || isEnteringInitials) return;
    if (e.key === 'Escape') { toggleSentinelPause(); return; }
    const activeDx = SentinelBreach.playerDx;
    const activeDy = SentinelBreach.playerDy;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
            if (activeDy !== 1) SentinelBreach.pendingDirection = { dx: 0, dy: -1 }; break;
        case 'ArrowDown': case 's': case 'S':
            if (activeDy !== -1) SentinelBreach.pendingDirection = { dx: 0, dy: 1 }; break;
        case 'ArrowLeft': case 'a': case 'A':
            if (activeDx !== 1) SentinelBreach.pendingDirection = { dx: -1, dy: 0 }; break;
        case 'ArrowRight': case 'd': case 'D':
            if (activeDx !== -1) SentinelBreach.pendingDirection = { dx: 1, dy: 0 }; break;
    }
});

// Modified main loop
const _originalMain = main;
main = function(currentTime) {
    window.requestAnimationFrame(main);
    if (!MobileOptimizer.shouldRenderFrame(currentTime)) return;
    MobileOptimizer.updateMobileVisibility();

    if (SentinelBreach.active) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawSentinelBreach(ctx);
        particles = particles.filter(p => { p.update(); return p.life > 0; });
        particles.forEach(p => p.draw(ctx));
        if (!SentinelBreach.paused) updateSentinelBreach(currentTime);
        return;
    }

    draw();
    if (!isPlaying || isPaused) return;
    const secondsSinceLastLogic = (currentTime - lastRenderTime) / 1000;
    let effectiveSpeed = currentSpeed;
    if (activePowerUp && activePowerUp.id === 'speed') effectiveSpeed = currentSpeed / 1.5;
    if (secondsSinceLastLogic >= effectiveSpeed / 1000) {
        lastRenderTime = currentTime;
        updateLogic();
    }
};

// Sentinel Breach toggle (redirects to sentinel pause)
const sentinelTogglePause = function() {
    if (SentinelBreach.active) { toggleSentinelPause(); return; }
    togglePause();
};

// Mobile D-pad for Sentinel
const sentinelDPad = {
    up: document.getElementById('dpad-up'),
    down: document.getElementById('dpad-down'),
    left: document.getElementById('dpad-left'),
    right: document.getElementById('dpad-right')
};
const dpadDirs = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
};
Object.entries(sentinelDPad).forEach(([dir, btn]) => {
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!SentinelBreach.active || SentinelBreach.paused) return;
        SentinelBreach.pendingDirection = dpadDirs[dir];
        btn.classList.add('pressed');
    }, { passive: false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        btn.classList.remove('pressed');
    }, { passive: false });
});
document.getElementById('mobile-pause')?.addEventListener('touchstart', e => {
    e.preventDefault();
    if (SentinelBreach.active) toggleSentinelPause();
}, { passive: false });

// ═══════════════════════════════════════════════════════════════════════════
// SAVE SYSTEM v2 — Profile Manager
// ═══════════════════════════════════════════════════════════════════════════

const SAVE_STORAGE_KEY = 'serpentineProfile_v2';
const SAVE_VERSION = '2.0';
const EXPORT_MAGIC = 'serpentine_export';

// Legacy v1 keys for migration
const LEGACY_KEYS = {
    highScore: 'serpentineHighScore',
    bank: 'serpentineBank',
    bought9193Hint: 'bought9193Hint',
    boughtMasterHint: 'boughtMasterHint',
    optPrincessPlayStyle: 'serpentineOpt_princess_playStyle',
    optArthropodSkin: 'serpentineOpt_arthropod_skin',
    leaderboardEasy: 'serpentineLB_easy',
    leaderboardMedium: 'serpentineLB_medium',
    leaderboardHard: 'serpentineLB_hard',
    leaderboardInsane: 'serpentineLB_insane',
    tutorialComplete: 'serpentineTutorialComplete',
    // Character unlock keys (all40+ characters)
    unlockedSpectrum: 'serpentineUnlockedSpectrum',
    unlocked9193: 'serpentineUnlocked9193',
    unlockedPrincess: 'serpentineUnlockedPrincess',
    unlockedArthropod: 'serpentineUnlockedArthropod',
    unlockedDragon: 'serpentineUnlockedDragon',
    unlockedCentipede: 'serpentineUnlockedCentipede',  // Legacy alias for arthropod
    unlockedCrimsonFang: 'serpentineUnlockedCrimsonFang',
    unlockedCobaltGrid: 'serpentineUnlockedCobaltGrid',
    unlockedEmeraldCore: 'serpentineUnlockedEmeraldCore',
    unlockedVoidStar: 'serpentineUnlockedVoidStar',
    unlockedPlasmaHydra: 'serpentineUnlockedPlasmaHydra',
    unlockedMonochrome: 'serpentineUnlockedMonochrome',
    unlockedMoltenCore: 'serpentineUnlockedMoltenCore',
    unlockedTitaniumCoil: 'serpentineUnlockedTitaniumCoil',
    unlockedQuicksilver: 'serpentineUnlockedQuicksilver',
    unlockedPhotonDash: 'serpentineUnlockedPhotonDash',
    unlockedNokiaNostalgia: 'serpentineUnlockedNokiaNostalgia',
    unlockedKonamiCode: 'serpentineUnlockedKonamiCode',
    unlockedMissingNo: 'serpentineUnlockedMissingNo',
    unlockedDogecoin: 'serpentineUnlockedDogecoin',
    unlockedBinaryConstrictor: 'serpentineUnlockedBinaryConstrictor',
    unlockedTheDev: 'serpentineUnlockedTheDev',
    unlockedError404: 'serpentineUnlockedError404',
    unlockedBlueScreen: 'serpentineUnlockedBlueScreen',
    unlockedScanlineSamurai: 'serpentineUnlockedScanlineSamurai',
    unlockedSynthesizer: 'serpentineUnlockedSynthesizer',
    unlockedMachMach: 'serpentineUnlocked_machmach',
    unlockedSonicBoom: 'serpentineUnlocked_sonicboom',
    unlockedQuantumLeap: 'serpentineUnlocked_quantumleap',
    unlockedWarpPython: 'serpentineUnlocked_warppython',
    unlockedFlashProtocol: 'serpentineUnlocked_flashprotocol',
    unlockedAegisDefender: 'serpentineUnlocked_aegisdefender',
    unlockedPhoenixProtocol: 'serpentineUnlocked_phoenixprotocol',
    unlockedJuggernaut: 'serpentineUnlocked_juggernaut',
    unlockedInfinityScale: 'serpentineUnlocked_infinityscale',
    unlockedZenithSerpent: 'serpentineUnlocked_zenithserpent',
    unlockedPumpkinProtocol: 'serpentineUnlocked_pumpkinprotocol',
    unlockedFrostSerpent: 'serpentineUnlocked_frostserpent',
    unlockedHeartCore: 'serpentineUnlocked_heartcore',
    unlockedNeonClassic: 'serpentineUnlocked_neon_classic',
    unlockedNeonPulse: 'serpentineUnlocked_neon_pulse',
    unlockedVoidShadow: 'serpentineUnlocked_void_shadow',
    unlockedVoidNova: 'serpentineUnlocked_void_nova',
    unlockedGlitchClassic: 'serpentineUnlocked_glitch_classic',
    unlockedGlitchDebug: 'serpentineUnlocked_glitch_debug',
    // Stats tracking
    speedrunTimes: 'serpentineSpeedrunTimes',
    maxSurvival: 'serpentineStats_maxSurvival',
    sessionDeaths: 'serpentineStats_sessionDeaths',
    maxSnakeLength: 'serpentineStats_maxSnakeLength',
    standardGames: 'serpentineStats_standardGames',
    leaderboardTop3: 'serpentineStats_leaderboardTop3'
};

// Default v2 profile structure
function createDefaultProfile() {
    return {
        meta: {
            version: SAVE_VERSION,
            createdAt: Date.now(),
            lastPlayedAt: Date.now(),
            totalPlayTime: 0  // seconds
        },
        progress: {
            tutorialComplete: false,
            charactersUnlocked: ['neon', 'void', 'gold', 'glitch', 'mecha'],
            achievementsUnlocked: [],
            currentStreak: 0,
            longestStreak: 0,
            lastPlayedDate: new Date().toISOString().split('T')[0]
        },
        scores: {
            standard: { easy: [], medium: [], hard: [], insane: [] },
            chronoshift: { easy: [], medium: [], hard: [], insane: [] },
            sentinel: { easy: [], medium: [], hard: [], insane: [] },
            breach: { easy: [], medium: [], hard: [], insane: [] },
            grid: { easy: [], medium: [], hard: [], insane: [] },
            neural: { easy: [], medium: [], hard: [], insane: [] }
        },
        economy: {
            bank: 0,
            shopPurchases: []
        },
        settings: {
            musicVolume: 0.8,
            sfxVolume: 0.7,
            scanlines: true,
            screenShake: true,
            particles: 'high',
            colorBlindMode: 'none',  // none, protanopia, deuteranopia, tritanopia
            highContrast: false,
            reducedMotion: false,
            touchControls: true,
            swipeSensitivity: 'medium'
        },
        stats: {
            totalGamesPlayed: 0,
            totalFoodEaten: 0,
            totalDeaths: 0,
            highestSpeed: 0,     // fastest tick rate survived (lower = faster)
            longestSnake: 0,
            favoriteCharacter: 'neon',
            hoursPerMode: { standard: 0, chronoshift: 0, sentinel: 0, breach: 0, grid: 0, neural: 0 }
        },
        secrets: {
            cheatCodeUsed: false,
            masterRitualUsed: false,
            foundEasterEggs: []
        },
        // ════ META PROGRESSION SYSTEM ════
        season: {
            currentSeason: 1,
            seasonName: "SYSTEM LAUNCH",
            seasonPoints: 0,           // Total points earned this season
            currentTier: 0,            // 0-50
            claimedTiers: [],           // Array of claimed tier numbers
            unclaimedTiers: [],         // Tiers with rewards to claim
            totalPointsEarned: 0,      // Lifetime points earned (for tracking)
            lastTierReached: 0         // Highest tier reached
        },
        titles: {
            unlocked: ["APPRENTICE"],   // Start with Apprentice
            active: "APPRENTICE",
            available: {
                "APPRENTICE": "Complete your first game",
                "COMPETENT": "Reach 500 points",
                "EXPERT": "Reach 1000 points",
                "MASTER": "Reach 2000 points",
                "LEGEND": "Reach 3000 points",
                "SERPENTINE PIONEER": "Reach Season Pass Tier 50",
                "COLLECTOR": "Unlock all characters",
                "TEMPORAL WIZARD": "Use 100 ChronoShift rewinds",
                "SENTINEL HUNTER": "Clear Wave 50 in Sentinel Breach",
                "COMPETITOR": "Win 50 Grid Warfare matches"
            }
        },
        badges: {
            earned: [],                 // Array of earned badge IDs
            categories: {
                mastery: ["ACH_MASTERY_1"],
                combat: ["ACH_COMBAT_1"],
                collector: ["ACH_COLLECTOR_1"],
                speedrunner: ["ACH_SPEED_1"],
                survival: ["ACH_SURVIVAL_1"]
            }
        },
        statsMeta: {
            totalRewindsUsed: 0,        // For Temporal Wizard
            gridWarfareWins: 0,         // For Competitor
            highestWave: 0,              // For Sentinel Hunter
            // Additional stats for migration
            speedrunTimes: {
                insane90: false,
                hard60: false,
                chronoNoRewind: false,
                chronoInsane120: false,
                sentinelWave20: false
            },
            maxSurvivalTime: 0,
            sessionDeaths: 0,
            maxSnakeLength: 0,
            leaderboardTop3: {}
        },
        // Legacy migration tracking
        _migratedAt: null,
        _legacyKeysPreserved: false
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// META-PROGRESSION: SEASON PASS, TITLES & BADGES SYSTEM
// Session 22 Implementation
// ═══════════════════════════════════════════════════════════════════════════

// ─── Season Pass Tier Definitions ────────────────────────────────────────────

const SEASON_TIERS = [
    // Tier 1-10: Bank point bonuses
    { tier: 1, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 2, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 3, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 4, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 5, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 6, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 7, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 8, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 9, reward: { type: 'points', amount: 5000 }, milestone: false },
    { tier: 10, reward: { type: 'points', amount: 100000 }, milestone: true, milestoneBonus: 'TIER 10: +100,000 PTS' },

    // Tier 11-20: Character skins
    { tier: 11, reward: { type: 'skin', id: 'neon_cyber', name: 'Neon Cyber Skin' }, milestone: false },
    { tier: 12, reward: { type: 'skin', id: 'void_dark', name: 'Void Dark Skin' }, milestone: false },
    { tier: 13, reward: { type: 'skin', id: 'gold_elite', name: 'Gold Elite Skin' }, milestone: false },
    { tier: 14, reward: { type: 'skin', id: 'glitch_static', name: 'Glitch Static Skin' }, milestone: false },
    { tier: 15, reward: { type: 'skin', id: 'mecha_titan', name: 'Mecha Titan Skin' }, milestone: false },
    { tier: 16, reward: { type: 'skin', id: 'crimson_fury', name: 'Crimson Fury Skin' }, milestone: false },
    { tier: 17, reward: { type: 'skin', id: 'cobalt_strike', name: 'Cobalt Strike Skin' }, milestone: false },
    { tier: 18, reward: { type: 'skin', id: 'emerald_viper', name: 'Emerald Viper Skin' }, milestone: false },
    { tier: 19, reward: { type: 'skin', id: 'plasma_flame', name: 'Plasma Flame Skin' }, milestone: false },
    { tier: 20, reward: { type: 'skin', id: 'monochrome_retro', name: 'Monochrome Retro Skin' }, milestone: false },

    // Tier 21-30: Character variants
    { tier: 21, reward: { type: 'variant', id: 'neon_classic', name: 'Neon Classic Variant' }, milestone: false },
    { tier: 22, reward: { type: 'variant', id: 'neon_pulse', name: 'Neon Pulse Variant' }, milestone: false },
    { tier: 23, reward: { type: 'variant', id: 'void_shadow', name: 'Void Shadow Variant' }, milestone: false },
    { tier: 24, reward: { type: 'variant', id: 'void_nova', name: 'Void Nova Variant' }, milestone: false },
    { tier: 25, reward: { type: 'points', amount: 250000 }, milestone: true, milestoneBonus: 'TIER 25: +250,000 PTS' },
    { tier: 26, reward: { type: 'variant', id: 'glitch_classic', name: 'Glitch Classic Variant' }, milestone: false },
    { tier: 27, reward: { type: 'variant', id: 'glitch_debug', name: 'Glitch Debug Variant' }, milestone: false },
    { tier: 28, reward: { type: 'variant', id: 'gold_royal', name: 'Gold Royal Variant' }, milestone: false },
    { tier: 29, reward: { type: 'variant', id: 'void_ethereal', name: 'Void Ethereal Variant' }, milestone: false },
    { tier: 30, reward: { type: 'variant', id: 'glitch_chromatic', name: 'Glitch Chromatic Variant' }, milestone: false },

    // Tier 31-40: Audio tracks
    { tier: 31, reward: { type: 'audio', id: 'chrono_ambient', name: 'Chrono Ambient Track' }, milestone: false },
    { tier: 32, reward: { type: 'audio', id: 'sentinel_combat', name: 'Sentinel Combat Track' }, milestone: false },
    { tier: 33, reward: { type: 'audio', id: 'firewall_alarm', name: 'Firewall Alarm Track' }, milestone: false },
    { tier: 34, reward: { type: 'audio', id: 'neural_calm', name: 'Neural Calm Track' }, milestone: false },
    { tier: 35, reward: { type: 'audio', id: 'victory_fanfare', name: 'Victory Fanfare Track' }, milestone: false },
    { tier: 36, reward: { type: 'audio', id: 'game_over_requiem', name: 'Game Over Requiem Track' }, milestone: false },
    { tier: 37, reward: { type: 'audio', id: 'menu_extended', name: 'Extended Menu Track' }, milestone: false },
    { tier: 38, reward: { type: 'audio', id: 'boss_theme', name: 'Boss Theme Track' }, milestone: false },
    { tier: 39, reward: { type: 'audio', id: 'secret_area', name: 'Secret Area Track' }, milestone: false },
    { tier: 40, reward: { type: 'audio', id: 'end_game', name: 'End Game Track' }, milestone: false },

    // Tier 41-50: Legendary rewards
    { tier: 41, reward: { type: 'points', amount: 50000 }, milestone: false },
    { tier: 42, reward: { type: 'points', amount: 50000 }, milestone: false },
    { tier: 43, reward: { type: 'points', amount: 50000 }, milestone: false },
    { tier: 44, reward: { type: 'points', amount: 50000 }, milestone: false },
    { tier: 45, reward: { type: 'points', amount: 50000 }, milestone: false },
    { tier: 46, reward: { type: 'points', amount: 75000 }, milestone: false },
    { tier: 47, reward: { type: 'points', amount: 75000 }, milestone: false },
    { tier: 48, reward: { type: 'points', amount: 100000 }, milestone: false },
    { tier: 49, reward: { type: 'points', amount: 100000 }, milestone: false },
    { tier: 50, reward: { type: 'legendary', id: 'serpentine_pioneer', name: 'Serpentine Pioneer Title & Badge' }, milestone: true, milestoneBonus: 'TIER 50: +500,000 PTS + SERPENTINE PIONEER' }
];

const POINTS_PER_TIER = 10000;

// ─── Season Points & Tier Functions ─────────────────────────────────────────

function addSeasonPoints(points) {
    if (!saveManager?.profile) return;

    const season = saveManager.profile.season;
    season.totalPointsEarned += points;
    season.seasonPoints += points;

    const newTier = Math.min(50, Math.floor(season.seasonPoints / POINTS_PER_TIER));

    const newlyUnlocked = [];
    for (let t = season.lastTierReached + 1; t <= newTier; t++) {
        if (!season.claimedTiers.includes(t)) {
            season.unclaimedTiers.push(t);
            newlyUnlocked.push(t);
        }
    }

    season.lastTierReached = newTier;
    season.currentTier = newTier;
    saveManager.save();

    if (newlyUnlocked.length > 0) {
        showSeasonProgressNotification(newTier, newlyUnlocked);
    }

    return { newTier, newlyUnlocked };
}

function claimSeasonTier(tierNum) {
    if (!saveManager?.profile) return false;

    const season = saveManager.profile.season;
    if (season.claimedTiers.includes(tierNum)) return false;
    if (!season.unclaimedTiers.includes(tierNum)) return false;

    const tierData = SEASON_TIERS[tierNum - 1];
    if (!tierData) return false;

    const reward = tierData.reward;
    switch (reward.type) {
        case 'points':
            if (saveManager?.profile) {
                saveManager.profile.economy.bank += reward.amount;
                bank = saveManager.profile.economy.bank;
                saveManager.save();
            }
            showClaimPopup('+' + reward.amount.toLocaleString() + ' PTS', '#ffd700');
            break;
        case 'skin':
            localStorage.setItem('serpentineUnlocked_' + reward.id, 'true');
            showClaimPopup(reward.name + ' UNLOCKED', '#00ffcc');
            break;
        case 'variant':
            localStorage.setItem('serpentineUnlocked_' + reward.id, 'true');
            const variantProfile = snakeProfiles.find(function(p) { return p.id === reward.id; });
            if (variantProfile) variantProfile.locked = false;
            showClaimPopup(reward.name + ' UNLOCKED', '#b026ff');
            break;
        case 'audio':
            localStorage.setItem('serpentineAudioUnlocked_' + reward.id, 'true');
            showClaimPopup(reward.name + ' UNLOCKED', '#ff0055');
            break;
        case 'legendary':
            if (!saveManager.profile.titles.unlocked.includes('SERPENTINE PIONEER')) {
                saveManager.profile.titles.unlocked.push('SERPENTINE PIONEER');
            }
            saveManager.profile.titles.active = 'SERPENTINE PIONEER';
            saveManager.profile.badges.earned.push('badge_serpentine_pioneer');
            if (saveManager?.profile) {
                saveManager.profile.economy.bank += 500000;
                bank = saveManager.profile.economy.bank;
                saveManager.save();
            }
            showClaimPopup('SERPENTINE PIONEER UNLOCKED! +500,000 PTS', '#ffd700');
            playUnlockSound();
            break;
    }

    season.claimedTiers.push(tierNum);
    season.unclaimedTiers = season.unclaimedTiers.filter(function(t) { return t !== tierNum; });
    saveManager.save();

    return true;
}

function getSeasonProgress() {
    if (!saveManager?.profile) return { currentTier: 0, progress: 0, totalPoints: 0 };

    const season = saveManager.profile.season;
    const pointsInCurrentTier = season.seasonPoints % POINTS_PER_TIER;
    const progress = (pointsInCurrentTier / POINTS_PER_TIER) * 100;

    return {
        currentTier: season.currentTier,
        maxTier: 50,
        progress: progress,
        pointsToNextTier: POINTS_PER_TIER - pointsInCurrentTier,
        totalSeasonPoints: season.seasonPoints,
        totalLifetimePoints: season.totalPointsEarned,
        claimedTiers: season.claimedTiers,
        unclaimedTiers: season.unclaimedTiers
    };
}

// ─── Title System Functions ──────────────────────────────────────────────────

function checkTitleUnlocks(finalScore) {
    if (!saveManager?.profile) return;

    const titles = saveManager.profile.titles;

    if (finalScore >= 3000 && !titles.unlocked.includes('LEGEND')) {
        titles.unlocked.push('LEGEND');
        titles.active = 'LEGEND';
        showTitleUnlockPopup('LEGEND', 'Reach 3000 points');
    }
    if (finalScore >= 2000 && !titles.unlocked.includes('MASTER')) {
        titles.unlocked.push('MASTER');
        if (titles.active === 'EXPERT') titles.active = 'MASTER';
        showTitleUnlockPopup('MASTER', 'Reach 2000 points');
    }
    if (finalScore >= 1000 && !titles.unlocked.includes('EXPERT')) {
        titles.unlocked.push('EXPERT');
        if (titles.active === 'COMPETENT') titles.active = 'EXPERT';
        showTitleUnlockPopup('EXPERT', 'Reach 1000 points');
    }
    if (finalScore >= 500 && !titles.unlocked.includes('COMPETENT')) {
        titles.unlocked.push('COMPETENT');
        if (titles.active === 'APPRENTICE') titles.active = 'COMPETENT';
        showTitleUnlockPopup('COMPETENT', 'Reach 500 points');
    }

    if (checkAllCharactersUnlocked() && !titles.unlocked.includes('COLLECTOR')) {
        titles.unlocked.push('COLLECTOR');
        showTitleUnlockPopup('COLLECTOR', 'Unlock all characters');
    }

    saveManager.save();
}

function trackGridWarfareWin() {
    if (!saveManager?.profile) return;
    saveManager.profile.statsMeta.gridWarfareWins++;
    if (saveManager.profile.statsMeta.gridWarfareWins >= 50 && !saveManager.profile.titles.unlocked.includes('COMPETITOR')) {
        saveManager.profile.titles.unlocked.push('COMPETITOR');
        showTitleUnlockPopup('COMPETITOR', 'Win 50 Grid Warfare matches');
    }
    saveManager.save();
}

function trackHighestWave(wave) {
    if (!saveManager?.profile) return;
    if (wave > saveManager.profile.statsMeta.highestWave) {
        saveManager.profile.statsMeta.highestWave = wave;
    }
    if (wave >= 50 && !saveManager.profile.titles.unlocked.includes('SENTINEL HUNTER')) {
        saveManager.profile.titles.unlocked.push('SENTINEL HUNTER');
        showTitleUnlockPopup('SENTINEL HUNTER', 'Clear Wave 50');
    }
    saveManager.save();
}

function trackRewindUsed() {
    if (!saveManager?.profile) return;
    saveManager.profile.statsMeta.totalRewindsUsed++;
    if (saveManager.profile.statsMeta.totalRewindsUsed >= 100 && !saveManager.profile.titles.unlocked.includes('TEMPORAL WIZARD')) {
        saveManager.profile.titles.unlocked.push('TEMPORAL WIZARD');
        showTitleUnlockPopup('TEMPORAL WIZARD', 'Use 100 rewinds');
    }
    saveManager.save();
}

function setActiveTitle(title) {
    if (!saveManager?.profile) return false;
    const titles = saveManager.profile.titles;
    if (!titles.unlocked.includes(title)) return false;
    titles.active = title;
    saveManager.save();
    return true;
}

function getActiveTitle() {
    if (!saveManager?.profile) return '';
    return saveManager.profile.titles.active || 'APPRENTICE';
}

function getLeaderboardTitle() {
    return getActiveTitle().substring(0, 3).toUpperCase();
}

// ─── Notification Display Functions ─────────────────────────────────────────

function showSeasonProgressNotification(tier, newTiers) {
    const tierNames = newTiers.map(function(t) { return 'TIER ' + t; }).join(', ');
    showUnlockPopup('SEASON PROGRESS: ' + tierNames + ' UNLOCKED', '#ffd700');
}

function showClaimPopup(message, color) {
    const toast = document.createElement('div');
    toast.className = 'meta-toast';
    toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(10, 10, 20, 0.95); border: 2px solid ' + color + '; border-radius: 12px; padding: 20px 40px; z-index: 1000; text-align: center; box-shadow: 0 0 30px ' + color + '; animation: toastPopIn 0.3s ease-out;';
    toast.innerHTML = '<div style="font-family: Orbitron, sans-serif; font-size: 1rem; color: #888; letter-spacing: 3px; margin-bottom: 8px;">REWARD CLAIMED</div><div style="font-family: Orbitron, sans-serif; font-size: 1.3rem; font-weight: 700; color: ' + color + '; text-shadow: 0 0 10px ' + color + '; letter-spacing: 2px;">' + message + '</div>';

    if (!document.getElementById('toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = '@keyframes toastPopIn { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } } .meta-toast.fade-out { animation: toastFadeOut 0.3s ease-in forwards; } @keyframes toastFadeOut { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } }';
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('fade-out');
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

function showTitleUnlockPopup(titleName, description) {
    const toast = document.createElement('div');
    toast.className = 'meta-toast';
    toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(10, 10, 20, 0.95); border: 2px solid #b026ff; border-radius: 12px; padding: 20px 40px; z-index: 1000; text-align: center; box-shadow: 0 0 40px #b026ff; animation: toastPopIn 0.3s ease-out;';
    toast.innerHTML = '<div style="font-family: Orbitron, sans-serif; font-size: 0.9rem; color: #888; letter-spacing: 3px; margin-bottom: 8px;">TITLE UNLOCKED</div><div style="font-family: Orbitron, sans-serif; font-size: 1.5rem; font-weight: 700; color: #b026ff; text-shadow: 0 0 15px #b026ff; letter-spacing: 3px; margin-bottom: 5px;">' + titleName + '</div><div style="font-family: Orbitron, sans-serif; font-size: 0.75rem; color: #666; letter-spacing: 1px;">' + description + '</div>';

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('fade-out');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ─── Game State Variables (needed early by SaveManager) ───────────────────────
let bank = 0; // Will be set from profile after load
let bought9193Hint = false; // Will be set from profile after load
let boughtMasterHint = false; // Will be set from profile after load

// ─── SaveManager Class ───────────────────────────────────────────────────────

class SaveManager {
    constructor() {
        this.profile = null;
        this._pendingSave = false;
        this._saveTimer = null;
        this._loadPromise = null;
    }

    // ── Load Profile ──────────────────────────────────────────────────────────
    load() {
        if (this._loadPromise) return this._loadPromise;

        this._loadPromise = new Promise((resolve) => {
            try {
                const raw = localStorage.getItem(SAVE_STORAGE_KEY);

                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (this._validateProfile(parsed)) {
                        this.profile = this._upgradeProfile(parsed);
                        console.log('[SaveManager] Loaded v2 profile');
                        this._restoreLegacyState();
                    } else {
                        // ════ Corruption Detected — Show Warning UI ════
                        console.warn('[SaveManager] Corrupt profile detected');
                        const self = this;
                        this._showCorruptionWarning(
                            'Invalid profile structure detected. Your save data may be corrupted.',
                            function() {
                                // Recovery: migrate from v1
                                self.profile = self._migrateFromV1();
                                self.save(true);
                                resolve(self.profile);
                            },
                            function() {
                                // Reset: start fresh
                                self.profile = createDefaultProfile();
                                self.save(true);
                                resolve(self.profile);
                            }
                        );
                        return; // Don't resolve yet - wait for user action
                    }
                } else {
                    // No v2 profile — check for v1 data and migrate
                    if (this._hasV1Data()) {
                        console.log('[SaveManager] No v2 profile, migrating from v1');
                        this.profile = this._migrateFromV1();
                    } else {
                        console.log('[SaveManager] No existing data, creating fresh profile');
                        this.profile = createDefaultProfile();
                    }
                }

                // Update play time tracking
                this.profile.meta.lastPlayedAt = Date.now();

                // Save the profile after loading/upgrading
                this.save(true);

            } catch (err) {
                console.error('[SaveManager] Load error:', err);
                // ════ Show Recovery Option on Error ════
                const self = this;
                this._showCorruptionWarning(
                    'Failed to load save data: ' + (err.message || 'Unknown error'),
                    function() {
                        // Recovery: migrate from v1
                        self.profile = self._migrateFromV1();
                        self.save(true);
                        resolve(self.profile);
                    },
                    function() {
                        // Reset: start fresh
                        self.profile = createDefaultProfile();
                        self.save(true);
                        resolve(self.profile);
                    }
                );
                return;
            }
        });

        return this._loadPromise;
    }

    // ── Validate Profile ──────────────────────────────────────────────────────
    _validateProfile(profile) {
        if (!profile || typeof profile !== 'object') return false;
        if (!profile.meta || typeof profile.meta !== 'object') return false;
        if (!profile.meta.version) return false;

        // Check required top-level keys
        const required = ['meta', 'progress', 'scores', 'economy', 'settings', 'stats', 'secrets'];
        for (const key of required) {
            if (!profile[key] || typeof profile[key] !== 'object') return false;
        }

        return true;
    }

    // ── Show Corruption Warning Modal ────────────────────────────────────────
    _showCorruptionWarning(message, onRecover, onReset) {
        const modal = document.getElementById('corruption-modal');
        const msgEl = document.getElementById('corruption-message');
        const detailsEl = document.getElementById('corruption-details');

        if (modal && msgEl) {
            msgEl.textContent = message;
            if (detailsEl) {
                detailsEl.style.display = 'none';
            }
            modal.classList.remove('hidden');

            // Set up button handlers
            const resetBtn = document.getElementById('btn-corruption-reset');
            const recoverBtn = document.getElementById('btn-corruption-recover');

            const cleanup = () => {
                modal.classList.add('hidden');
                if (resetBtn) resetBtn.replaceWith(resetBtn.cloneNode(true));
                if (recoverBtn) recoverBtn.replaceWith(recoverBtn.cloneNode(true));
            };

            const handleReset = () => {
                cleanup();
                onReset();
            };

            const handleRecover = () => {
                cleanup();
                onRecover();
            };

            if (resetBtn) resetBtn.addEventListener('click', handleReset);
            if (recoverBtn) recoverBtn.addEventListener('click', handleRecover);
        } else {
            // Fallback if modal not found
            console.warn('[SaveManager] Corruption modal not found, using recovery');
            onRecover();
        }
    }

    // ── Upgrade Profile ───────────────────────────────────────────────────────
    _upgradeProfile(profile) {
        // Handle version migrations here if needed in the future
        // Currently we only have v2.0, so just ensure all fields exist
        const fresh = createDefaultProfile();

        // Deep merge: prefer existing data, fill missing fields
        const merged = this._deepMerge(fresh, profile);

        // Ensure version is always current
        merged.meta.version = SAVE_VERSION;

        return merged;
    }

    _deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(target[key] || {}, source[key]);
            } else if (source[key] !== undefined) {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ── Migrate from v1 ───────────────────────────────────────────────────────
    _hasV1Data() {
        return localStorage.getItem(LEGACY_KEYS.highScore) !== null ||
               localStorage.getItem(LEGACY_KEYS.bank) !== null;
    }

    _migrateFromV1() {
        const profile = createDefaultProfile();
        profile._migratedAt = Date.now();
        profile._legacyKeysPreserved = true;

        try {
            // Migrate high score → scores.standard.medium (best single score)
            const hs = parseInt(localStorage.getItem(LEGACY_KEYS.highScore) || '0');
            if (hs > 0) {
                // Store as a leaderboard entry (empty initials for migrated score)
                profile.scores.standard.medium.push({ initials: '---', score: hs, migrated: true });
            }

            // Migrate bank
            profile.economy.bank = parseInt(localStorage.getItem(LEGACY_KEYS.bank) || '0');

            // ════ Comprehensive Character Unlock Migration ════
            // Map all legacy unlock keys to character IDs
            const characterUnlockMap = {
                // Default + Shop characters (5)
                'unlockedSpectrum': 'spectrum',
                'unlocked9193': '9193',
                'unlockedPrincess': 'princess',
                'unlockedArthropod': 'arthropod',
                'unlockedDragon': 'dragon',
                'unlockedCentipede': 'arthropod',  // Legacy alias for arthropod
                // Food milestone characters (10)
                'unlockedCrimsonFang': 'crimson_fang',
                'unlockedCobaltGrid': 'cobalt_grid',
                'unlockedEmeraldCore': 'emerald_core',
                'unlockedVoidStar': 'void_star',
                'unlockedPlasmaHydra': 'plasma_hydra',
                'unlockedMonochrome': 'monochrome',
                'unlockedMoltenCore': 'molten_core',
                'unlockedTitaniumCoil': 'titanium_coil',
                'unlockedQuicksilver': 'quicksilver',
                'unlockedPhotonDash': 'photon_dash',
                // Secret/Easter Egg characters (10)
                'unlockedNokiaNostalgia': 'nokia_nostalgia',
                'unlockedKonamiCode': 'konami_code',
                'unlockedMissingNo': 'missing_no',
                'unlockedDogecoin': 'dogecoin',
                'unlockedBinaryConstrictor': 'binary_constrictor',
                'unlockedTheDev': 'the_dev',
                'unlockedError404': 'error_404',
                'unlockedBlueScreen': 'blue_screen',
                'unlockedScanlineSamurai': 'scanline_samurai',
                'unlockedSynthesizer': 'synthesizer',
                // Speedrun/Survival characters (10)
                'unlockedMachMach': 'mach_mach',
                'unlockedSonicBoom': 'sonic_boom',
                'unlockedQuantumLeap': 'quantum_leap',
                'unlockedWarpPython': 'warp_python',
                'unlockedFlashProtocol': 'flash_protocol',
                'unlockedAegisDefender': 'aegis_defender',
                'unlockedPhoenixProtocol': 'phoenix_protocol',
                'unlockedJuggernaut': 'juggernaut',
                'unlockedInfinityScale': 'infinity_scale',
                'unlockedZenithSerpent': 'zenith_serpent',
                // Seasonal characters (3)
                'unlockedPumpkinProtocol': 'pumpkin_protocol',
                'unlockedFrostSerpent': 'frost_serpent',
                'unlockedHeartCore': 'heart_core',
                // Character variants (6)
                'unlockedNeonClassic': 'neon_classic',
                'unlockedNeonPulse': 'neon_pulse',
                'unlockedVoidShadow': 'void_shadow',
                'unlockedVoidNova': 'void_nova',
                'unlockedGlitchClassic': 'glitch_classic',
                'unlockedGlitchDebug': 'glitch_debug'
            };

            // Shop-purchased characters that should be in shopPurchases
            const shopCharacters = ['princess', 'arthropod', 'dragon'];

            for (const [key, charId] of Object.entries(characterUnlockMap)) {
                if (localStorage.getItem(LEGACY_KEYS[key]) === 'true') {
                    if (!profile.progress.charactersUnlocked.includes(charId)) {
                        profile.progress.charactersUnlocked.push(charId);
                    }
                    // Track shop purchases
                    if (shopCharacters.includes(charId)) {
                        if (!profile.economy.shopPurchases.includes(charId)) {
                            profile.economy.shopPurchases.push(charId);
                        }
                    }
                }
            }

            // Migrate shop hints (secrets)
            if (localStorage.getItem(LEGACY_KEYS.bought9193Hint) === 'true') {
                profile.secrets.cheatCodeUsed = true;
            }
            if (localStorage.getItem(LEGACY_KEYS.boughtMasterHint) === 'true') {
                profile.secrets.masterRitualUsed = true;
            }

            // ════ Migrate Stats Tracking ════
            // Speedrun times
            try {
                const speedrunTimes = JSON.parse(localStorage.getItem(LEGACY_KEYS.speedrunTimes) || '{}');
                profile.statsMeta.speedrunTimes = speedrunTimes;
            } catch (e) { /* use default */ }

            // Max survival time
            const maxSurvival = parseInt(localStorage.getItem(LEGACY_KEYS.maxSurvival) || '0');
            if (maxSurvival > 0) {
                profile.statsMeta.maxSurvivalTime = maxSurvival;
            }

            // Session deaths
            const sessionDeaths = parseInt(localStorage.getItem(LEGACY_KEYS.sessionDeaths) || '0');
            if (sessionDeaths > 0) {
                profile.statsMeta.sessionDeaths = sessionDeaths;
            }

            // Max snake length
            const maxSnakeLength = parseInt(localStorage.getItem(LEGACY_KEYS.maxSnakeLength) || '0');
            if (maxSnakeLength > 0) {
                profile.statsMeta.maxSnakeLength = maxSnakeLength;
            }

            // Standard games completed
            const standardGames = parseInt(localStorage.getItem(LEGACY_KEYS.standardGames) || '0');
            if (standardGames > 0) {
                profile.stats.totalGamesPlayed = standardGames;
            }

            // Leaderboard top 3 tracking
            try {
                const top3 = JSON.parse(localStorage.getItem(LEGACY_KEYS.leaderboardTop3) || '{}');
                profile.statsMeta.leaderboardTop3 = top3;
            } catch (e) { /* use default */ }

            // Migrate leaderboards
            const diffs = ['easy', 'medium', 'hard', 'insane'];
            for (const diff of diffs) {
                const raw = localStorage.getItem(LEGACY_KEYS[`leaderboard${diff.charAt(0).toUpperCase() + diff.slice(1)}`]);
                if (raw) {
                    try {
                        const entries = JSON.parse(raw);
                        if (Array.isArray(entries)) {
                            // Only migrate if non-empty and better than current
                            for (const entry of entries) {
                                if (entry && typeof entry.score === 'number') {
                                    profile.scores.standard[diff].push({ ...entry, migrated: true });
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[SaveManager] Failed to migrate leaderboard:', diff, e);
                    }
                }
            }

            // Sort leaderboards
            for (const diff of diffs) {
                profile.scores.standard[diff].sort((a, b) => b.score - a.score);
                profile.scores.standard[diff] = profile.scores.standard[diff].slice(0, 10);
            }

            // Migrate tutorial
            if (localStorage.getItem(LEGACY_KEYS.tutorialComplete) === 'true') {
                profile.progress.tutorialComplete = true;
            }

            // Migrate character options (Princess play style, Arthropod skin)
            try {
                const princessStyle = localStorage.getItem(LEGACY_KEYS.optPrincessPlayStyle);
                if (princessStyle) {
                    profile.settings.princessPlayStyle = princessStyle;
                }
 } catch (e) { /* use default */ }

            try {
                const arthropodSkin = localStorage.getItem(LEGACY_KEYS.optArthropodSkin);
                if (arthropodSkin) {
                    profile.settings.arthropodSkin = arthropodSkin;
                }
            } catch (e) { /* use default */ }

        } catch (err) {
            console.error('[SaveManager] Migration error:', err);
        }

        console.log('[SaveManager] v1 → v2 migration complete');
        return profile;
    }

    // ── Save Profile ───────────────────────────────────────────────────────────
    save(immediate = false) {
        if (!this.profile) return;

        // Update last played
        this.profile.meta.lastPlayedAt = Date.now();

        if (immediate) {
            this._doSave();
        } else {
            // Non-blocking: save on next tick
            if (this._saveTimer) clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => this._doSave(), 0);
        }
    }

    _doSave() {
        if (!this.profile) return;
        try {
            const json = JSON.stringify(this.profile);

            // Check localStorage quota
            if (json.length > 4 * 1024 * 1024) {  // 4MB safety limit
                console.warn('[SaveManager] Save data too large, attempting compression...');
                // Try pruning old leaderboard entries
                this._pruneLeaderboards();
                const pruned = JSON.stringify(this.profile);
                if (pruned.length > 4 * 1024 * 1024) {
                    console.error('[SaveManager] Storage quota exceeded even after pruning');
                    return false;
                }
            }

            localStorage.setItem(SAVE_STORAGE_KEY, json);
            return true;
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                console.error('[SaveManager] localStorage quota exceeded!');
                // Attempt recovery: prune leaderboards and retry
                this._pruneLeaderboards();
                try {
                    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.profile));
                    console.log('[SaveManager] Recovery: pruned leaderboards saved successfully');
                    return true;
                } catch (retryErr) {
                    console.error('[SaveManager] Full save failure:', retryErr);
                    return false;
                }
            }
            console.error('[SaveManager] Save error:', err);
            return false;
        }
    }

    _pruneLeaderboards() {
        for (const mode of Object.keys(this.profile.scores)) {
            for (const diff of Object.keys(this.profile.scores[mode])) {
                // Keep only top 3 entries per leaderboard to save space
                this.profile.scores[mode][diff] = this.profile.scores[mode][diff].slice(0, 3);
            }
        }
    }

    // ── Restore Legacy State ──────────────────────────────────────────────────
    _restoreLegacyState() {
        // After loading v2 profile, sync legacy in-memory variables
        // for backward compatibility with existing game logic
        bank = this.profile.economy.bank;

        const unlockMap = {
            spectrum: 'unlockedSpectrum',
            '9193': 'unlocked9193',
            princess: 'unlockedPrincess',
            arthropod: 'unlockedArthropod',
            dragon: 'unlockedDragon'
        };

        for (const [charId, storageKey] of Object.entries(unlockMap)) {
            const isUnlocked = this.profile.progress.charactersUnlocked.includes(charId);
            if (isUnlocked) {
                localStorage.setItem(LEGACY_KEYS[storageKey], 'true');
            }
        }

        bought9193Hint = this.profile.secrets.cheatCodeUsed;
        boughtMasterHint = this.profile.secrets.masterRitualUsed;

        // Sync tutorial
        if (this.profile.progress.tutorialComplete) {
            localStorage.setItem(LEGACY_KEYS.tutorialComplete, 'true');
        }
    }

    // ── Increment Stats (run-end) ─────────────────────────────────────────────
    recordGameEnd({ score, foodEaten, snakeLength, tickSpeed, characterId, mode, playTimeSeconds }) {
        if (!this.profile) return;

        // Stats update incrementally, not recalculated
        this.profile.stats.totalGamesPlayed++;
        this.profile.stats.totalFoodEaten += foodEaten || 0;
        this.profile.stats.totalDeaths++;
        this.profile.stats.longestSnake = Math.max(this.profile.stats.longestSnake, snakeLength || 0);

        // Track fastest speed survived (lower = faster, e.g. 50 = Insane)
        if (tickSpeed && tickSpeed < (this.profile.stats.highestSpeed || 999)) {
            this.profile.stats.highestSpeed = tickSpeed;
        }

        // Track favorite character (simple: most recent)
        if (characterId) {
            this.profile.stats.favoriteCharacter = characterId;
        }

        // ════ Update Play Time Per Mode ════
        if (mode && playTimeSeconds > 0) {
            if (!this.profile.stats.hoursPerMode) {
                this.profile.stats.hoursPerMode = {
                    standard: 0, chronoshift: 0, sentinel: 0,
                    breach: 0, grid: 0, neural: 0
                };
            }
            if (this.profile.stats.hoursPerMode.hasOwnProperty(mode)) {
                this.profile.stats.hoursPerMode[mode] += playTimeSeconds;
            }
            // Also update total play time
            this.profile.meta.totalPlayTime += playTimeSeconds;
        }

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        if (this.profile.progress.lastPlayedDate === today) {
            this.profile.progress.currentStreak++;
        } else {
            // New day — reset current but may continue streak if consecutive
            const lastDate = new Date(this.profile.progress.lastPlayedDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day — streak continues
                this.profile.progress.currentStreak++;
            } else {
                // Streak broken
                this.profile.progress.currentStreak = 1;
            }
        }
        this.profile.progress.lastPlayedDate = today;
        this.profile.progress.longestStreak = Math.max(
            this.profile.progress.longestStreak,
            this.profile.progress.currentStreak
        );

        // ════ Add Score to Leaderboard (per difficulty) ════
        if (score > 0 && mode) {
            const modeScores = this.profile.scores[mode];
            if (modeScores) {
                // Determine difficulty from tickSpeed
                const difficulty = this._tickSpeedToDifficulty(tickSpeed);
                const entry = { initials: '', score, gameOverTime: Date.now() };

                // Add to the correct difficulty only
                modeScores[difficulty].push({ ...entry });
                modeScores[difficulty].sort((a, b) => b.score - a.score);
                modeScores[difficulty] = modeScores[difficulty].slice(0, 10);
            }
        }

        // ════ Secret Character Unlock Checks ════
        checkSecretUnlocks(this.profile);

        this.save(false);  // Non-blocking auto-save
    }

    // ── Map tickSpeed to difficulty ─────────────────────────────────────────
    _tickSpeedToDifficulty(tickSpeed) {
        if (!tickSpeed) return 'medium';
        if (tickSpeed <= 50) return 'insane';
        if (tickSpeed <= 80) return 'hard';
        if (tickSpeed <= 120) return 'medium';
        return 'easy';
    }

    // ── Add Bank Points ───────────────────────────────────────────────────────
    addToBank(points) {
        if (!this.profile) return;
        this.profile.economy.bank += points;
        bank = this.profile.economy.bank;  // Sync legacy
        this.save(false);
    }

    // ── Unlock Character ────────────────────────────────────────────────────────
    unlockCharacter(charId) {
        if (!this.profile) return false;
        if (!this.profile.progress.charactersUnlocked.includes(charId)) {
            this.profile.progress.charactersUnlocked.push(charId);
            this.save(true);
            return true;
        }
        return false;
    }

    // ── Record Shop Purchase ───────────────────────────────────────────────────
    recordShopPurchase(itemId, cost) {
        if (!this.profile) return false;
        if (!this.profile.economy.shopPurchases.includes(itemId)) {
            this.profile.economy.shopPurchases.push(itemId);
            this.save(true);
            return true;
        }
        return false;
    }

    // ── Update Settings ────────────────────────────────────────────────────────
    updateSetting(key, value) {
        if (!this.profile) return;
        if (this.profile.settings.hasOwnProperty(key)) {
            this.profile.settings[key] = value;
            this.save(true);
        }
    }

    // ── Export Profile ──────────────────────────────────────────────────────────
    exportProfile() {
        if (!this.profile) return null;

        const exportData = {
            [EXPORT_MAGIC]: true,
            version: SAVE_VERSION,
            exported_at: new Date().toISOString(),
            profile: this.profile
        };

        return JSON.stringify(exportData, null, 2);
    }

    downloadExport() {
        const json = this.exportProfile();
        if (!json) return;

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `serpentine-save-${date}.serpentine`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Preview Import Data ──────────────────────────────────────────────────
    previewImport(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate export format
            if (!data[EXPORT_MAGIC]) {
                throw new Error('Invalid save file format: missing magic marker');
            }
            if (!data.profile) {
                throw new Error('Invalid save file: missing profile data');
            }

            // Validate the embedded profile
            if (!this._validateProfile(data.profile)) {
                throw new Error('Corrupted profile data in save file');
            }

            // Build preview
            const profile = data.profile;
            const preview = {
                version: profile.meta?.version || 'unknown',
                createdAt: profile.meta?.createdAt ? new Date(profile.meta.createdAt).toLocaleDateString() : 'unknown',
                lastPlayed: profile.meta?.lastPlayedAt ? new Date(profile.meta.lastPlayedAt).toLocaleDateString() : 'unknown',
                totalPlayTime: Math.round((profile.meta?.totalPlayTime || 0) / 60) + ' min',
                gamesPlayed: profile.stats?.totalGamesPlayed || 0,
                totalDeaths: profile.stats?.totalDeaths || 0,
                bank: (profile.economy?.bank || 0).toLocaleString() + ' PTS',
                charactersUnlocked: profile.progress?.charactersUnlocked?.length || 0,
                achievementsUnlocked: profile.progress?.achievementsUnlocked?.length || 0,
                seasonTier: profile.season?.currentTier || 0,
                modesPlayed: Object.keys(profile.stats?.hoursPerMode || {}).filter(m => profile.stats.hoursPerMode[m] > 0).length
            };

            return { success: true, preview };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // ── Show Import Preview Modal ─────────────────────────────────────────────
    _showImportPreview(preview, jsonString, onConfirm) {
        const modal = document.getElementById('import-preview-modal');
        const contentEl = document.getElementById('import-preview-content');

        if (modal && contentEl) {
            // Build preview HTML
            let html = '<table style="width: 100%; border-collapse: collapse;">';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Version:</td><td style="padding: 4px 8px; color: #00ffcc;">' + preview.version + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Games Played:</td><td style="padding: 4px 8px; color: #fff;">' + preview.gamesPlayed + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Total Deaths:</td><td style="padding: 4px 8px; color: #fff;">' + preview.totalDeaths + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Bank:</td><td style="padding: 4px 8px; color: #ffd700;">' + preview.bank + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Characters:</td><td style="padding: 4px 8px; color: #fff;">' + preview.charactersUnlocked + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Season Tier:</td><td style="padding: 4px 8px; color: #ffd700;">' + preview.seasonTier + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Modes Played:</td><td style="padding: 4px 8px; color: #fff;">' + preview.modesPlayed + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Play Time:</td><td style="padding: 4px 8px; color: #fff;">' + preview.totalPlayTime + '</td></tr>';
            html += '<tr><td style="padding: 4px 8px; color: #888;">Last Played:</td><td style="padding: 4px 8px; color: #fff;">' + preview.lastPlayed + '</td></tr>';
            html += '</table>';
            contentEl.innerHTML = html;

            modal.classList.remove('hidden');

            // Set up button handlers
            const confirmBtn = document.getElementById('btn-import-confirm');
            const cancelBtn = document.getElementById('btn-import-cancel');

            const cleanup = () => {
                modal.classList.add('hidden');
                if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            };

            const handleConfirm = () => {
                cleanup();
                onConfirm();
            };

            const handleCancel = () => {
                cleanup();
            };

            if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
            if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        } else {
            // Fallback if modal not found - just import directly
            onConfirm();
        }
    }

    // ── Import Profile (returns preview first) ───────────────────────────────
    importProfile(jsonString, skipPreview = false) {
        // First get preview
        const previewResult = this.previewImport(jsonString);
        if (!previewResult.success) {
            return { success: false, error: previewResult.error, previewFailed: true };
        }

        if (skipPreview) {
            // Direct import (from preview confirm)
            return this._applyImport(jsonString);
        }

        // Return preview for UI to handle
        return {
            success: true,
            needsConfirmation: true,
            preview: previewResult.preview,
            jsonString: jsonString
        };
    }

    // ── Apply Import (internal) ──────────────────────────────────────────────
    _applyImport(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate export format
            if (!data[EXPORT_MAGIC]) {
                throw new Error('Invalid save file format: missing magic marker');
            }
            if (!data.profile) {
                throw new Error('Invalid save file: missing profile data');
            }

            // Validate the embedded profile
            if (!this._validateProfile(data.profile)) {
                throw new Error('Corrupted profile data in save file');
            }

            // Apply the profile
            this.profile = this._upgradeProfile(data.profile);
            this.save(true);

            // Sync legacy state
            this._restoreLegacyState();

            // Return what was imported
            return {
                success: true,
                profile: this.profile,
                stats: {
                    gamesPlayed: this.profile.stats.totalGamesPlayed,
                    bank: this.profile.economy.bank,
                    characters: this.profile.progress.charactersUnlocked.length
                }
            };

        } catch (err) {
            console.error('[SaveManager] Import error:', err);
            return { success: false, error: err.message };
        }
    }

    // ── Reset All Data ────────────────────────────────────────────────────────
    resetAll() {
        // Clear v2 profile
        localStorage.removeItem(SAVE_STORAGE_KEY);

        // Clear all legacy keys
        Object.values(LEGACY_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear all leaderboard keys
        ['easy', 'medium', 'hard', 'insane'].forEach(d => {
            localStorage.removeItem(`serpentineLB_${d}`);
        });

        // Reset in-memory
        this.profile = createDefaultProfile();
        bank = 0;

        return true;
    }

    // ── Legacy Key Cleanup ────────────────────────────────────────────────────
    // Called after 30 days to remove v1 keys (rollback safety)
    _cleanupLegacyKeys() {
        if (!this.profile || !this.profile._legacyKeysPreserved) return;

        const migratedAt = this.profile._migratedAt || 0;
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        if (Date.now() - migratedAt > thirtyDaysMs) {
            console.log('[SaveManager] Cleaning up legacy v1 keys after 30-day safety period');
            Object.values(LEGACY_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.profile._legacyKeysPreserved = false;
            this.save(true);
        }
    }
}

// Instantiate globally
const saveManager = new SaveManager();

// Initialize save system on load (non-blocking)
saveManager.load().then(profile => {
    console.log('[Serpentine] Save system initialized, profile version:', profile?.meta?.version);
    // Optionally trigger legacy key cleanup if 30 days passed
    saveManager._cleanupLegacyKeys();
});

// ── Auto-Save on Tab Close ────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
    if (typeof saveManager !== 'undefined' && saveManager.profile) {
        // Synchronous save to ensure data is written before tab closes
        saveManager._doSave();
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAILY & WEEKLY CHALLENGE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const ChallengeManager = {
    // ── Challenge State ────────────────────────────────────────────────────────
    state: {
        daily: {
            date: null,        // "YYYY-MM-DD"
            challengeId: null,
            completed: false,
            progress: 0,
            target: 0
        },
        weekly: {
            weekStart: null,   // "YYYY-MM-DD" (Monday of the week)
            challengeId: null,
            completed: false,
            progress: 0,
            target: 0
        }
    },

    // ── Challenge Definitions ──────────────────────────────────────────────────

    // Daily challenges (20 templates) - completable in one session
    DAILY_TEMPLATES: [
        { id: 'standard_complete_easy', type: 'standard_complete', difficulty: 'easy', description: 'Complete a Standard run on Easy', target: 1 },
        { id: 'standard_complete_medium', type: 'standard_complete', difficulty: 'medium', description: 'Complete a Standard run on Medium', target: 1 },
        { id: 'standard_complete_hard', type: 'standard_complete', difficulty: 'hard', description: 'Complete a Standard run on Hard', target: 1 },
        { id: 'standard_complete_insane', type: 'standard_complete', difficulty: 'insane', description: 'Complete a Standard run on Insane', target: 1 },
        { id: 'collect_food_20', type: 'collect_food', amount: 20, description: 'Collect 20 food in one Standard run', target: 20 },
        { id: 'collect_food_30', type: 'collect_food', amount: 30, description: 'Collect 30 food in one Standard run', target: 30 },
        { id: 'collect_food_50', type: 'collect_food', amount: 50, description: 'Collect 50 food in ChronoShift', target: 50, modes: ['chronoshift'] },
        { id: 'reach_wave_5', type: 'reach_wave', wave: 5, description: 'Reach Wave 5 in Sentinel Breach', target: 5, modes: ['sentinel'] },
        { id: 'reach_wave_10', type: 'reach_wave', wave: 10, description: 'Reach Wave 10 in Sentinel Breach', target: 10, modes: ['sentinel'] },
        { id: 'reach_wave_15', type: 'reach_wave', wave: 15, description: 'Reach Wave 15 in Sentinel Breach', target: 15, modes: ['sentinel'] },
        { id: 'win_rounds_3', type: 'win_rounds', count: 3, description: 'Win 3 rounds in Grid Warfare', target: 3, modes: ['grid'] },
        { id: 'win_rounds_5', type: 'win_rounds', count: 5, description: 'Win 5 rounds in Grid Warfare', target: 5, modes: ['grid'] },
        { id: 'survive_60s', type: 'survive_time', seconds: 60, description: 'Survive 60 seconds in ChronoShift', target: 60, modes: ['chronoshift'] },
        { id: 'survive_120s', type: 'survive_time', seconds: 120, description: 'Survive 2 minutes in ChronoShift', target: 120, modes: ['chronoshift'] },
        { id: 'eat_powerups_5', type: 'eat_powerups', count: 5, description: 'Eat 5 power-ups in one run', target: 5 },
        { id: 'reach_score_1000', type: 'reach_score', score: 1000, description: 'Reach 1,000 points in Standard', target: 1000, modes: ['standard'] },
        { id: 'reach_score_3000', type: 'reach_score', score: 3000, description: 'Reach 3,000 points in Standard', target: 3000, modes: ['standard'] },
        { id: 'snake_length_15', type: 'snake_length', length: 15, description: 'Grow your snake to 15 segments', target: 15 },
        { id: 'snake_length_20', type: 'snake_length', length: 20, description: 'Grow your snake to 20 segments', target: 20 },
        { id: 'play_time_10m', type: 'play_time', minutes: 10, description: 'Play for 10 total minutes today', target: 10 }
    ],

    // Weekly challenges (20 templates) - require more dedication
    WEEKLY_TEMPLATES: [
        { id: 'standard_runs_3', type: 'standard_runs', count: 3, description: 'Complete 3 Standard runs', target: 3 },
        { id: 'standard_runs_5', type: 'standard_runs', count: 5, description: 'Complete 5 Standard runs', target: 5 },
        { id: 'clear_wave_20', type: 'clear_wave', wave: 20, description: 'Clear Wave 20 in Sentinel Breach', target: 20, modes: ['sentinel'] },
        { id: 'clear_wave_30', type: 'clear_wave', wave: 30, description: 'Clear Wave 30 in Sentinel Breach', target: 30, modes: ['sentinel'] },
        { id: 'grid_wins_10', type: 'grid_wins', count: 10, description: 'Win 10 Grid Warfare matches', target: 10, modes: ['grid'] },
        { id: 'grid_wins_15', type: 'grid_wins', count: 15, description: 'Win 15 Grid Warfare matches', target: 15, modes: ['grid'] },
        { id: 'total_points_5000', type: 'total_points', points: 5000, description: 'Earn 5,000 total points', target: 5000 },
        { id: 'total_points_10000', type: 'total_points', points: 10000, description: 'Earn 10,000 total points', target: 10000 },
        { id: 'unlock_characters_2', type: 'unlock_characters', count: 2, description: 'Unlock 2 new characters', target: 2 },
        { id: 'play_minutes_60', type: 'play_minutes', minutes: 60, description: 'Play for 60 total minutes', target: 60 },
        { id: 'eat_food_100', type: 'total_food_eaten', count: 100, description: 'Eat 100 total food', target: 100 },
        { id: 'eat_food_200', type: 'total_food_eaten', count: 200, description: 'Eat 200 total food', target: 200 },
        { id: 'chrono_survive_3m', type: 'chrono_survive', minutes: 3, description: 'Survive 3 minutes in ChronoShift', target: 180, modes: ['chronoshift'] },
        { id: 'chrono_rewinds_10', type: 'chrono_rewinds', count: 10, description: 'Use rewind 10 times in ChronoShift', target: 10, modes: ['chronoshift'] },
        { id: 'breach_score_2000', type: 'breach_score', score: 2000, description: 'Score 2,000 in Firewall Breach', target: 2000, modes: ['breach'] },
        { id: 'neural_score_1000', type: 'neural_score', score: 1000, description: 'Score 1,000 in Neural Fit', target: 1000, modes: ['neural'] },
        { id: 'sentinel_kills_50', type: 'sentinel_kills', count: 50, description: 'Destroy 50 Sentinels', target: 50, modes: ['sentinel'] },
        { id: 'win_insane_2', type: 'win_insane', count: 2, description: 'Win on Insane difficulty twice', target: 2 },
        { id: 'games_played_20', type: 'games_played', count: 20, description: 'Play 20 games total', target: 20 },
        { id: 'streak_5', type: 'streak', count: 5, description: 'Maintain a 5-day play streak', target: 5 }
    ],

    // Exclusive character rewards for weekly completion
    WEEKLY_CHARACTER_REWARDS: [
        { id: 'crimson_fang', name: 'CRIMSON FANG' },
        { id: 'cobalt_grid', name: 'COBALT GRID' },
        { id: 'emerald_core', name: 'EMERALD CORE' },
        { id: 'plasma_hydra', name: 'PLASMA HYDRA' },
        { id: 'titanium_coil', name: 'TITANIUM COIL' },
        { id: 'quicksilver', name: 'QUICKSILVER' },
        { id: 'photon_dash', name: 'PHOTON DASH' },
        { id: 'mach_mach', name: 'MACH MACH' },
        { id: 'sonic_boom', name: 'SONIC BOOM' },
        { id: 'flash_protocol', name: 'FLASH PROTOCOL' }
    ],

    // ── Deterministic Challenge Selection ──────────────────────────────────────

    // Seeded random number generator for consistent daily/weekly challenges
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    },

    // Get date string in YYYY-MM-DD format
    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    // Get week start (Monday) as YYYY-MM-DD
    getWeekStartString(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        d.setDate(diff);
        return this.getDateString(d);
    },

    // Get unique seed for a date (combines year, month, day)
    getDailySeed(date = new Date()) {
        const ds = this.getDateString(date);
        return ds.split('-').join('') + '001'; // e.g., "20240531001"
    },

    // Get unique seed for a week
    getWeeklySeed(date = new Date()) {
        const ws = this.getWeekStartString(date);
        return ws.split('-').join('') + '002'; // e.g., "20240527002"
    },

    // Select daily challenge based on date
    selectDailyChallenge(date = new Date()) {
        const seed = this.getDailySeed(date);
        const hash = parseInt(seed, 10);
        const index = Math.floor(this.seededRandom(hash) * this.DAILY_TEMPLATES.length);
        return this.DAILY_TEMPLATES[index];
    },

    // Select weekly challenge based on date
    selectWeeklyChallenge(date = new Date()) {
        const seed = this.getWeeklySeed(date);
        const hash = parseInt(seed, 10);
        const index = Math.floor(this.seededRandom(hash) * this.WEEKLY_TEMPLATES.length);
        return this.WEEKLY_TEMPLATES[index];
    },

    // Get exclusive character for weekly (based on week number)
    getWeeklyCharacterReward(date = new Date()) {
        const weekNum = this.getWeekNumber(date);
        const index = Math.floor(this.seededRandom(weekNum * 17) * this.WEEKLY_CHARACTER_REWARDS.length);
        return this.WEEKLY_CHARACTER_REWARDS[index];
    },

    // Get ISO week number
    getWeekNumber(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    // ── Initialization ────────────────────────────────────────────────────────

    init() {
        // Load state from localStorage
        const savedState = localStorage.getItem('serpentineChallenges');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.warn('[ChallengeManager] Failed to load state, using defaults');
            }
        }

        // Check for resets needed
        this.checkAndResetDaily();
        this.checkAndResetWeekly();

        // Start the timer update loop
        this.startTimerUpdate();
    },

    // ── State Persistence ──────────────────────────────────────────────────────

    save() {
        localStorage.setItem('serpentineChallenges', JSON.stringify(this.state));
    },

    // ── Reset Logic ────────────────────────────────────────────────────────────

    checkAndResetDaily() {
        const today = this.getDateString();
        if (this.state.daily.date !== today) {
            // New day - reset daily challenge
            const newChallenge = this.selectDailyChallenge();
            this.state.daily = {
                date: today,
                challengeId: newChallenge.id,
                challenge: newChallenge,
                completed: false,
                progress: 0,
                target: newChallenge.target
            };
            this.save();
        } else if (!this.state.daily.challenge && this.state.daily.challengeId) {
            // Restore challenge object from ID
            this.state.daily.challenge = this.DAILY_TEMPLATES.find(t => t.id === this.state.daily.challengeId);
        }
    },

    checkAndResetWeekly() {
        const thisWeek = this.getWeekStartString();
        if (this.state.weekly.weekStart !== thisWeek) {
            // New week - reset weekly challenge
            const newChallenge = this.selectWeeklyChallenge();
            this.state.weekly = {
                weekStart: thisWeek,
                challengeId: newChallenge.id,
                challenge: newChallenge,
                completed: false,
                progress: 0,
                target: newChallenge.target
            };
            this.save();
        } else if (!this.state.weekly.challenge && this.state.weekly.challengeId) {
            // Restore challenge object from ID
            this.state.weekly.challenge = this.WEEKLY_TEMPLATES.find(t => t.id === this.state.weekly.challengeId);
        }
    },

    // ── Progress Tracking ──────────────────────────────────────────────────────

    // Called during gameplay to update progress
    updateProgress(type, value) {
        // Update daily if applicable
        if (this.state.daily.challenge && !this.state.daily.completed) {
            const challenge = this.state.daily.challenge;
            if (this.challengeMatches(type, challenge)) {
                this.incrementDailyProgress(value);
            }
        }

        // Update weekly
        if (this.state.weekly.challenge && !this.state.weekly.completed) {
            const challenge = this.state.weekly.challenge;
            if (this.challengeMatches(type, challenge)) {
                this.incrementWeeklyProgress(value);
            }
        }

        // Update UI
        this.updateUI();
    },

    challengeMatches(type, challenge) {
        switch (type) {
            case 'standard_complete':
                return challenge.type === 'standard_complete';
            case 'collect_food':
                // Match any food collection challenge based on mode
                if (challenge.type !== 'collect_food') return false;
                return true; // Any mode counts for general food collection
            case 'food_collected':
                // For ChronoShift-specific food challenges
                return challenge.type === 'collect_food' && challenge.modes?.includes('chronoshift');
            case 'wave_reached':
                return challenge.type === 'reach_wave' || challenge.type === 'clear_wave';
            case 'rounds_won':
                return challenge.type === 'win_rounds' || challenge.type === 'grid_wins';
            case 'survived_time':
                return challenge.type === 'survive_time' || challenge.type === 'chrono_survive';
            case 'powerup_eaten':
                return challenge.type === 'eat_powerups';
            case 'score_reached':
                return challenge.type === 'reach_score' || challenge.type === 'breach_score' || challenge.type === 'neural_score' || challenge.type === 'total_points';
            case 'snake_length':
                return challenge.type === 'snake_length';
            case 'play_time':
                return challenge.type === 'play_time' || challenge.type === 'play_minutes';
            case 'game_ended':
                return challenge.type === 'standard_runs' || challenge.type === 'games_played' || challenge.type === 'win_insane';
            case 'total_food_eaten':
                return challenge.type === 'total_food_eaten';
            case 'sentinel_kills':
                return challenge.type === 'sentinel_kills';
            case 'chrono_rewinds':
                return challenge.type === 'chrono_rewinds';
            case 'unlock_characters':
                return challenge.type === 'unlock_characters';
            case 'streak':
                return challenge.type === 'streak';
            default:
                return false;
        }
    },

    incrementDailyProgress(amount = 1) {
        if (this.state.daily.completed) return;
        this.state.daily.progress = Math.min(this.state.daily.progress + amount, this.state.daily.target);
        if (this.state.daily.progress >= this.state.daily.target) {
            this.completeDailyChallenge();
        }
        this.save();
    },

    incrementWeeklyProgress(amount = 1) {
        if (this.state.weekly.completed) return;
        this.state.weekly.progress = Math.min(this.state.weekly.progress + amount, this.state.weekly.target);
        if (this.state.weekly.progress >= this.state.weekly.target) {
            this.completeWeeklyChallenge();
        }
        this.save();
    },

    // ── Challenge Completion ────────────────────────────────────────────────────

    completeDailyChallenge() {
        this.state.daily.completed = true;

        // Award 25,000 bank points
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.addToBank(25000);
        }

        // Award badge (stored in profile)
        this.awardDailyBadge();

        // Show celebration
        this.showCelebration('daily');

        // Update menu stats
        updateMenuBankDisplay();
    },

    completeWeeklyChallenge() {
        this.state.weekly.completed = true;

        // Award 100,000 bank points
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.addToBank(100000);
        }

        // Unlock exclusive character
        const characterReward = this.getWeeklyCharacterReward();
        if (characterReward && typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.unlockCharacter(characterReward.id);
        }

        // Award badge
        this.awardWeeklyBadge(characterReward);

        // Show celebration
        this.showCelebration('weekly', characterReward);

        // Update menu stats
        updateMenuBankDisplay();
    },

    awardDailyBadge() {
        if (!saveManager.profile) return;
        if (!saveManager.profile.badges) saveManager.profile.badges = [];
        const badgeName = `daily_${this.getDateString()}`;
        if (!saveManager.profile.badges.includes(badgeName)) {
            saveManager.profile.badges.push(badgeName);
            saveManager.save(true);
        }
    },

    awardWeeklyBadge(characterReward = null) {
        if (!saveManager.profile) return;
        if (!saveManager.profile.badges) saveManager.profile.badges = [];
        const weekStr = this.getWeekStartString();
        const badgeName = `weekly_${weekStr}`;
        if (!saveManager.profile.badges.includes(badgeName)) {
            saveManager.profile.badges.push(badgeName);
            saveManager.save(true);
        }
    },

    // ── UI Updates ─────────────────────────────────────────────────────────────

    updateUI() {
        // Daily progress
        const dailyProgressFill = document.getElementById('daily-progress-fill');
        const dailyProgressText = document.getElementById('daily-progress-text');
        const dailyCompleteBadge = document.getElementById('daily-complete-badge');

        if (this.state.daily.challenge) {
            const percent = Math.min(100, (this.state.daily.progress / this.state.daily.target) * 100);
            if (dailyProgressFill) dailyProgressFill.style.width = `${percent}%`;
            if (dailyProgressText) dailyProgressText.textContent = `${this.state.daily.progress} / ${this.state.daily.target}`;
            if (dailyCompleteBadge) {
                if (this.state.daily.completed) {
                    dailyCompleteBadge.classList.remove('hidden');
                } else {
                    dailyCompleteBadge.classList.add('hidden');
                }
            }
        }

        // Weekly progress
        const weeklyProgressFill = document.getElementById('weekly-progress-fill');
        const weeklyProgressText = document.getElementById('weekly-progress-text');
        const weeklyCompleteBadge = document.getElementById('weekly-complete-badge');

        if (this.state.weekly.challenge) {
            const percent = Math.min(100, (this.state.weekly.progress / this.state.weekly.target) * 100);
            if (weeklyProgressFill) weeklyProgressFill.style.width = `${percent}%`;
            if (weeklyProgressText) weeklyProgressText.textContent = `${this.state.weekly.progress} / ${this.state.weekly.target}`;
            if (weeklyCompleteBadge) {
                if (this.state.weekly.completed) {
                    weeklyCompleteBadge.classList.remove('hidden');
                } else {
                    weeklyCompleteBadge.classList.add('hidden');
                }
            }
        }
    },

    showChallengeScreen() {
        hideAllMenus();
        document.getElementById('challenge-screen').classList.remove('hidden');

        // Update challenge text
        if (this.state.daily.challenge) {
            document.getElementById('daily-challenge-text').textContent = this.state.daily.challenge.description;
        }
        if (this.state.weekly.challenge) {
            document.getElementById('weekly-challenge-text').textContent = this.state.weekly.challenge.description;
        }

        // Update progress
        this.updateUI();

        // Update timers
        this.updateResetTimers();

        // Refresh main menu stats to show updated bank
        if (typeof refreshMainMenuStats === 'function') {
            refreshMainMenuStats();
        }
    },

    // ── Timer Updates ───────────────────────────────────────────────────────────

    startTimerUpdate() {
        setInterval(() => this.updateResetTimers(), 1000);
    },

    updateResetTimers() {
        // Daily reset timer
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dailyMs = tomorrow - now;
        const dailyHours = Math.floor(dailyMs / (1000 * 60 * 60));
        const dailyMins = Math.floor((dailyMs % (1000 * 60 * 60)) / (1000 * 60));
        const dailySecs = Math.floor((dailyMs % (1000 * 60)) / 1000);
        const dailyTimer = document.getElementById('daily-reset-timer');
        if (dailyTimer) {
            dailyTimer.textContent = `${String(dailyHours).padStart(2, '0')}:${String(dailyMins).padStart(2, '0')}:${String(dailySecs).padStart(2, '0')}`;
        }

        // Weekly reset timer (next Monday)
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        const weeklyMs = nextMonday - now;
        const weeklyDays = Math.floor(weeklyMs / (1000 * 60 * 60 * 24));
        const weeklyHours = Math.floor((weeklyMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const weeklyMins = Math.floor((weeklyMs % (1000 * 60 * 60)) / (1000 * 60));
        const weeklyTimer = document.getElementById('weekly-reset-timer');
        if (weeklyTimer) {
            weeklyTimer.textContent = `${weeklyDays}d ${String(weeklyHours).padStart(2, '0')}:${String(weeklyMins).padStart(2, '0')}`;
        }
    },

    // ── Celebration Animation ───────────────────────────────────────────────────

    showCelebration(type, characterReward = null) {
        const celebration = document.getElementById('challenge-celebration');
        const title = celebration.querySelector('.celebration-title');
        const subtitle = document.getElementById('celebration-challenge-name');
        const points = document.getElementById('celebration-points');
        const badgeReward = document.getElementById('celebration-badge-reward');
        const characterUnlock = document.getElementById('celebration-character-unlock');
        const characterName = document.getElementById('celebration-character-name');

        if (type === 'daily') {
            title.textContent = 'DAILY COMPLETE!';
            subtitle.textContent = this.state.daily.challenge?.description || 'Daily Challenge';
            points.textContent = '+25,000';
            badgeReward.classList.remove('hidden');
            characterUnlock.classList.add('hidden');
        } else {
            title.textContent = 'WEEKLY COMPLETE!';
            subtitle.textContent = this.state.weekly.challenge?.description || 'Weekly Challenge';
            points.textContent = '+100,000';
            badgeReward.classList.remove('hidden');

            if (characterReward) {
                characterUnlock.classList.remove('hidden');
                characterName.textContent = characterReward.name;
            } else {
                characterUnlock.classList.add('hidden');
            }
        }

        celebration.classList.remove('hidden');
        celebration.classList.add('show');

        // Play celebration sound
        this.playCelebrationSound();
    },

    hideCelebration() {
        const celebration = document.getElementById('challenge-celebration');
        celebration.classList.remove('show');
        setTimeout(() => celebration.classList.add('hidden'), 300);
    },

    playCelebrationSound() {
        // Create a simple victory sound using Web Audio API
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5

            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.warn('[ChallengeManager] Could not play celebration sound');
        }
    },

    // ── Game Event Hooks ───────────────────────────────────────────────────────

    // Call these from game logic when relevant events occur
    onGameEnded(mode, score, foodEaten, snakeLength, difficulty) {
        this.updateProgress('game_ended', 1);

        if (mode === 'standard') {
            this.updateProgress('standard_complete', 1);
            if (score > 0) this.updateProgress('score_reached', score);
            if (snakeLength > 0) this.updateProgress('snake_length', snakeLength);
        }

        if (difficulty === 'insane') {
            this.updateProgress('win_insane', 1);
        }
    },

    onFoodCollected(amount = 1) {
        this.updateProgress('collect_food', amount);
        this.updateProgress('total_food_eaten', amount);
    },

    onPowerupCollected(amount = 1) {
        this.updateProgress('powerup_eaten', amount);
    },

    onWaveReached(wave) {
        this.updateProgress('wave_reached', wave);
        this.updateProgress('clear_wave', wave);
        this.updateProgress('sentinel_kills', wave * 5);
    },

    onRoundsWon(count = 1) {
        this.updateProgress('rounds_won', count);
        this.updateProgress('grid_wins', count);
    },

    onSurvivedTime(seconds) {
        this.updateProgress('survived_time', seconds);
        this.updateProgress('chrono_survive', seconds);
    },

    onChronoRewindUsed(count = 1) {
        this.updateProgress('chrono_rewinds', count);
    },

    onScoreReached(score, mode) {
        this.updateProgress('score_reached', score);
        if (mode === 'breach') this.updateProgress('breach_score', score);
        if (mode === 'neural') this.updateProgress('neural_score', score);
    },

    onPlayTimeAdded(minutes) {
        this.updateProgress('play_time', minutes);
        this.updateProgress('play_minutes', minutes);
    },

    onCharacterUnlocked() {
        this.updateProgress('unlock_characters', 1);
    },

    onStreakUpdated(streak) {
        this.updateProgress('streak', streak);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SEASON TRACK & PROFILE UI FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function showSeasonTrackScreen() {
    const seasonScreen = document.getElementById('season-screen');
    if (!seasonScreen) return;

    hideAllMenus();
    seasonScreen.classList.remove('hidden');

    updateSeasonTrackUI();
}

function updateSeasonTrackUI() {
    const progress = getSeasonProgress();
    const trackContainer = document.getElementById('season-track');
    const tierDisplay = document.getElementById('season-tier-display');
    const pointsDisplay = document.getElementById('season-points-display');
    const progressFill = document.getElementById('season-progress-fill');

    // Update header info
    if (tierDisplay) tierDisplay.textContent = 'TIER ' + progress.currentTier + ' / 50';
    if (pointsDisplay) pointsDisplay.textContent = progress.pointsToNextTier.toLocaleString() + ' PTS to next tier';
    if (progressFill) progressFill.style.width = progress.progress + '%';

    // Generate tier nodes
    if (trackContainer) {
        trackContainer.innerHTML = '';

        for (let tier = 1; tier <= 50; tier++) {
            const tierData = SEASON_TIERS[tier - 1];
            const node = document.createElement('div');
            node.className = 'season-tier-node';
            node.textContent = tier;

            // Determine state
            const isClaimed = progress.claimedTiers.includes(tier);
            const isUnclaimed = progress.unclaimedTiers.includes(tier);
            const isCurrent = tier === progress.currentTier;

            if (isClaimed) {
                node.classList.add('claimed');
            } else if (isUnclaimed) {
                node.classList.add('available');
                // Add claim indicator
                const indicator = document.createElement('div');
                indicator.className = 'claim-indicator';
                node.appendChild(indicator);
            } else if (tier <= progress.currentTier + 5) {
                node.classList.add('available');
            } else {
                node.classList.add('locked');
            }

            if (isCurrent) node.classList.add('current');
            if (tierData?.milestone) node.classList.add('milestone');

            // Tooltip with reward info
            const tooltip = document.createElement('div');
            tooltip.className = 'tier-reward-tooltip';
            tooltip.innerHTML = getTierRewardDescription(tier);
            node.appendChild(tooltip);

            // Click handler
            node.addEventListener('click', () => {
                if (isUnclaimed) {
                    claimSeasonTier(tier);
                    updateSeasonTrackUI();
                    playMenuSelectSound();
                }
            });

            trackContainer.appendChild(node);
        }
    }
}

function getTierRewardDescription(tier) {
    const tierData = SEASON_TIERS[tier - 1];
    if (!tierData) return 'Unknown reward';

    const reward = tierData.reward;
    switch (reward.type) {
        case 'points':
            return '+' + reward.amount.toLocaleString() + ' PTS';
        case 'skin':
            return reward.name;
        case 'variant':
            return reward.name;
        case 'audio':
            return reward.name;
        case 'legendary':
            return 'LEGENDARY: ' + reward.name;
        default:
            return reward.type;
    }
}

function showProfileScreen() {
    const profileScreen = document.getElementById('profile-screen');
    if (!profileScreen) return;

    hideAllMenus();
    profileScreen.classList.remove('hidden');

    updateProfileUI();
}

function updateProfileUI() {
    if (!saveManager?.profile) return;

    const profile = saveManager.profile;
    const titles = profile.titles;
    const badges = profile.badges;

    // Update active title
    const activeTitleEl = document.getElementById('profile-active-title');
    if (activeTitleEl) activeTitleEl.textContent = titles.active || 'APPRENTICE';

    // Update season progress
    const progress = getSeasonProgress();
    const seasonTierEl = document.getElementById('profile-season-tier');
    const seasonPointsEl = document.getElementById('profile-season-points');
    if (seasonTierEl) seasonTierEl.textContent = 'TIER ' + progress.currentTier + ' / 50';
    if (seasonPointsEl) seasonPointsEl.textContent = progress.pointsToNextTier.toLocaleString() + ' / ' + POINTS_PER_TIER.toLocaleString() + ' to next tier';

    // Update badges list
    const badgesList = document.getElementById('profile-badges-list');
    if (badgesList) {
        badgesList.innerHTML = '';
        const allBadges = [
            { id: 'badge_serpentine_pioneer', icon: '🌟', name: 'Serpentine Pioneer' },
            { id: 'badge_daily', icon: '📅', name: 'Daily Challenger' },
            { id: 'badge_weekly', icon: '📆', name: 'Weekly Champion' },
            { id: 'badge_master', icon: '🏆', name: 'Master Player' },
            { id: 'badge_collector', icon: '🎭', name: 'Character Collector' }
        ];

        allBadges.forEach(badge => {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge-icon' + (badges?.earned?.includes(badge.id) ? ' earned' : '');
            badgeEl.innerHTML = badge.icon;
            badgeEl.title = badge.name;
            badgesList.appendChild(badgeEl);
        });
    }

    // Update titles list
    const titlesList = document.getElementById('profile-titles-list');
    if (titlesList) {
        titlesList.innerHTML = '';
        const availableTitles = titles.available || {};

        Object.keys(availableTitles).forEach(titleName => {
            const isUnlocked = titles.unlocked.includes(titleName);
            const isActive = titles.active === titleName;

            const titleEl = document.createElement('div');
            titleEl.className = 'title-badge' + (isActive ? ' active' : '');
            if (!isUnlocked) titleEl.style.opacity = '0.4';
            titleEl.textContent = titleName;

            if (isUnlocked) {
                titleEl.addEventListener('click', () => {
                    setActiveTitle(titleName);
                    updateProfileUI();
                    playMenuSelectSound();
                });
            }

            titlesList.appendChild(titleEl);
        });
    }
}

function showTitleSelector() {
    const titleSelector = document.getElementById('title-selector');
    const titleList = document.getElementById('title-list');
    if (!titleSelector || !titleList) return;

    titleSelector.classList.remove('hidden');
    titleList.innerHTML = '';

    if (!saveManager?.profile) return;

    const titles = saveManager.profile.titles;

    titles.unlocked.forEach(titleName => {
        const isActive = titles.active === titleName;
        const btn = document.createElement('button');
        btn.className = 'title-badge' + (isActive ? ' active' : '');
        btn.textContent = titleName;
        btn.style.margin = '5px';
        btn.style.width = 'auto';
        btn.style.padding = '8px 16px';

        btn.addEventListener('click', () => {
            setActiveTitle(titleName);
            showTitleSelector();
            updateProfileUI();
        });

        titleList.appendChild(btn);
    });
}

// Initialize when SaveManager is ready
window.addEventListener('load', () => {
    if (typeof saveManager !== 'undefined') {
        saveManager.load().then(() => {
            ChallengeManager.init();
        });
    } else {
        // Fallback if SaveManager not loaded yet
        setTimeout(() => {
            if (typeof saveManager !== 'undefined') {
                saveManager.load().then(() => {
                    ChallengeManager.init();
                });
            }
        }, 100);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GAME CORE CONFIGURATION (remaining original code below)
// ═══════════════════════════════════════════════════════════════════════════

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
const continueBtn = document.getElementById('btn-continue');
const menuBtn = document.getElementById('menu-btn');

// Game Core Configuration
const gridSize = 20;
const tileCount = canvas.width / gridSize;
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

// Characters 11-20: Food milestone unlocks
let unlockedCrimsonFang = localStorage.getItem('serpentineUnlockedCrimsonFang') === 'true';
let unlockedCobaltGrid = localStorage.getItem('serpentineUnlockedCobaltGrid') === 'true';
let unlockedEmeraldCore = localStorage.getItem('serpentineUnlockedEmeraldCore') === 'true';
let unlockedVoidStar = localStorage.getItem('serpentineUnlockedVoidStar') === 'true';
let unlockedPlasmaHydra = localStorage.getItem('serpentineUnlockedPlasmaHydra') === 'true';
let unlockedMonochrome = localStorage.getItem('serpentineUnlockedMonochrome') === 'true';
let unlockedMoltenCore = localStorage.getItem('serpentineUnlockedMoltenCore') === 'true';
let unlockedTitaniumCoil = localStorage.getItem('serpentineUnlockedTitaniumCoil') === 'true';
let unlockedQuicksilver = localStorage.getItem('serpentineUnlockedQuicksilver') === 'true';
let unlockedPhotonDash = localStorage.getItem('serpentineUnlockedPhotonDash') === 'true';

// ════ CHARACTERS 21-30: Secret/Easter Egg Unlocks ════
let unlockedNokiaNostalgia = localStorage.getItem('serpentineUnlockedNokiaNostalgia') === 'true';
let unlockedKonamiCode = localStorage.getItem('serpentineUnlockedKonamiCode') === 'true';
let unlockedMissingNo = localStorage.getItem('serpentineUnlockedMissingNo') === 'true';
let unlockedDogecoin = localStorage.getItem('serpentineUnlockedDogecoin') === 'true';
let unlockedBinaryConstrictor = localStorage.getItem('serpentineUnlockedBinaryConstrictor') === 'true';
let unlockedTheDev = localStorage.getItem('serpentineUnlockedTheDev') === 'true';
let unlockedError404 = localStorage.getItem('serpentineUnlockedError404') === 'true';
let unlockedBlueScreen = localStorage.getItem('serpentineUnlockedBlueScreen') === 'true';
let unlockedScanlineSamurai = localStorage.getItem('serpentineUnlockedScanlineSamurai') === 'true';
let unlockedSynthesizer = localStorage.getItem('serpentineUnlockedSynthesizer') === 'true';

// ════ Secret Character Unlock Tracking ════
// These track ongoing progress for unlock conditions
let secretTracking = {
    consecutiveDeaths: 0,       // For MissingNo (500 consecutive deaths)
    totalDeaths: 0,            // For Blue Screen (100 total deaths)
    menuSongPlays: 0,          // For Synthesizer (5 full menu songs)
    breachLevelsCleared: 0,     // For Scanline Samurai (10 levels)
    lastKonamiKey: null,        // Konami code state
    konamiProgress: 0           // Konami code progress index
};

const KONAMI_CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
const KONAMI_SEQUENCE_DISPLAY = '↑↑↓↓←→←→BA';

// ════ CHARACTERS 31-40: Speedrun/Survival/Endless Unlocks ════
let unlockedMachMach = localStorage.getItem('serpentineUnlocked_machmach') === 'true';
let unlockedSonicBoom = localStorage.getItem('serpentineUnlocked_sonicboom') === 'true';
let unlockedQuantumLeap = localStorage.getItem('serpentineUnlocked_quantumleap') === 'true';
let unlockedWarpPython = localStorage.getItem('serpentineUnlocked_warppython') === 'true';
let unlockedFlashProtocol = localStorage.getItem('serpentineUnlocked_flashprotocol') === 'true';
let unlockedAegisDefender = localStorage.getItem('serpentineUnlocked_aegisdefender') === 'true';
let unlockedPhoenixProtocol = localStorage.getItem('serpentineUnlocked_phoenixprotocol') === 'true';
let unlockedJuggernaut = localStorage.getItem('serpentineUnlocked_juggernaut') === 'true';
let unlockedInfinityScale = localStorage.getItem('serpentineUnlocked_infinityscale') === 'true';
let unlockedZenithSerpent = localStorage.getItem('serpentineUnlocked_zenithserpent') === 'true';

// ════ SEASONAL CHARACTERS ════
let unlockedPumpkinProtocol = localStorage.getItem('serpentineUnlocked_pumpkinprotocol') === 'true';
let unlockedFrostSerpent = localStorage.getItem('serpentineUnlocked_frostserpent') === 'true';
let unlockedHeartCore = localStorage.getItem('serpentineUnlocked_heartcore') === 'true';

// ════ CHARACTER VARIANTS ════
let unlockedNeonClassic = localStorage.getItem('serpentineUnlocked_neon_classic') === 'true';
let unlockedNeonPulse = localStorage.getItem('serpentineUnlocked_neon_pulse') === 'true';
let unlockedVoidShadow = localStorage.getItem('serpentineUnlocked_void_shadow') === 'true';
let unlockedVoidNova = localStorage.getItem('serpentineUnlocked_void_nova') === 'true';
let unlockedGlitchClassic = localStorage.getItem('serpentineUnlocked_glitch_classic') === 'true';
let unlockedGlitchDebug = localStorage.getItem('serpentineUnlocked_glitch_debug') === 'true';

// ════ Speedrun/Survival Tracking ════
const characterTracking = {
    speedrunTimes: JSON.parse(localStorage.getItem('serpentineSpeedrunTimes') || '{"insane90":false,"hard60":false,"chronoNoRewind":false,"chronoInsane120":false,"sentinelWave20":false}'),
    maxSurvivalTime: parseInt(localStorage.getItem('serpentineStats_maxSurvival') || '0'),
    sessionDeaths: parseInt(localStorage.getItem('serpentineStats_sessionDeaths') || '0'),
    maxSnakeLength: parseInt(localStorage.getItem('serpentineStats_maxSnakeLength') || '0'),
    standardGamesCompleted: parseInt(localStorage.getItem('serpentineStats_standardGames') || '0'),
    leaderboardTop3: JSON.parse(localStorage.getItem('serpentineStats_leaderboardTop3') || '{}')
};

let speedrunStartTime = 0;
let speedrunActive = false;
let speedrunDifficulty = '';
let speedrunMode = 'standard';

// ════ Seasonal Character Logic ════
function isSeasonalAvailable(seasonId) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    switch(seasonId) {
        case 'pumpkin': return month === 10;
        case 'frost': return month === 12 || (month === 1 && day <= 7);
        case 'heart': return month === 2 && day <= 14;
        default: return false;
    }
}

function getSeasonName(seasonId) {
    switch(seasonId) {
        case 'pumpkin': return 'HALLOWEEN SEASON';
        case 'frost': return 'WINTER SEASON';
        case 'heart': return 'VALENTINE SEASON';
        default: return 'SEASONAL';
    }
}

function isSeasonalCharacter(charId) {
    return ['pumpkin_protocol', 'frost_serpent', 'heart_core'].includes(charId);
}

function getSeasonalBadge(charId) {
    if (charId === 'pumpkin_protocol') return '🎃';
    if (charId === 'frost_serpent') return '❄️';
    if (charId === 'heart_core') return '💕';
    return '';
}

// ════ Character Variants ════
const characterVariants = {
    'neon': { base: 'neon', variants: [
        { id: 'neon_classic', name: 'NEON CLASSIC', lore: 'The original green neon from the first version.', head: '#00ff00', body: '#00cc00', glow: 'rgba(0, 255, 0, 0.5)', food: '#ff0000', foodGlow: 'rgba(255, 0, 0, 0.8)', accent: '#00ff00' },
        { id: 'neon_pulse', name: 'NEON PULSE', lore: 'Bright white variant with rapid pulsing glow.', head: '#ffffff', body: '#eeeeee', glow: 'rgba(255, 255, 255, 0.9)', food: '#00ffcc', foodGlow: 'rgba(0, 255, 204, 1)', accent: '#ffffff', pulseEffect: true }
    ]},
    'void': { base: 'void', variants: [
        { id: 'void_shadow', name: 'VOID SHADOW', lore: 'An even darker variant that absorbs light.', head: '#2a0050', body: '#1a0030', glow: 'rgba(42, 0, 80, 0.4)', food: '#8800ff', foodGlow: 'rgba(136, 0, 255, 0.8)', accent: '#660099', shadowEffect: true },
        { id: 'void_nova', name: 'VOID NOVA', lore: 'Creates bright energy bursts on each move.', head: '#aa00ff', body: '#ff00ff', glow: 'rgba(170, 0, 255, 1)', food: '#00ffff', foodGlow: 'rgba(0, 255, 255, 1)', accent: '#ff66ff', novaEffect: true }
    ]},
    'glitch': { base: 'glitch', variants: [
        { id: 'glitch_classic', name: 'GLITCH CLASSIC', lore: 'Solid magenta without glitch effects.', head: '#cc0066', body: '#aa0055', glow: 'rgba(204, 0, 102, 0.7)', food: '#00ffcc', foodGlow: 'rgba(0, 255, 204, 0.8)', accent: '#ff99cc' },
        { id: 'glitch_debug', name: 'GLITCH DEBUG', lore: 'RGB split effect with visible scanlines.', head: '#ff0000', body: '#00ff00', glow: 'rgba(255, 0, 0, 0.6)', food: '#0000ff', foodGlow: 'rgba(0, 0, 255, 0.8)', accent: '#ffff00', debugEffect: true }
    ]}
};

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
    { id: "dragon", name: "KITE DRAGON", lore: "A legendary articulated festival-kite protocol. Constructed from living pixel-silk and crystalline spikes, it glides through the grid with geometric grace.", head: "#FF4500", body: "#228B22", glow: "rgba(255, 69, 0, 0.7)", food: "#FFD700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#FF6347", locked: !unlockedDragon, unlockCondition: "DECRYPT IN SYSTEM SHOP (100,000 PTS)" },

    // ════ CHARACTERS 11-20: Food Milestone Unlocks ════
    { id: "crimson_fang", name: "CRIMSON FANG", lore: "An aggressive data-packet hunter forged in the deep red sectors. Its razor-sharp geometry tears through the grid with predatory fury.", head: "#8B0000", body: "#8B0000", glow: "rgba(139, 0, 0, 0.8)", food: "#FF0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#FF4444", locked: !unlockedCrimsonFang, unlockCondition: "Consume 30 food units in Standard mode", angularHead: true },
    { id: "cobalt_grid", name: "COBALT GRID", lore: "A cold, geometric surveillance protocol. Its angular chrome body reflects the cold light of the mainframe's deepest vaults.", head: "#0047AB", body: "#0047AB", glow: "rgba(0, 71, 171, 0.7)", food: "#00BFFF", foodGlow: "rgba(0, 191, 255, 0.8)", accent: "#C0C0C0", locked: !unlockedCobaltGrid, unlockCondition: "Consume 40 food units in Standard mode", geometricStyle: true },
    { id: "emerald_core", name: "EMERALD CORE", lore: "A living energy-core anomaly pulsing with organic vitality. Its flowing animations mimic the rhythm of the grid's heart.", head: "#00FF00", body: "#00FF00", glow: "rgba(0, 255, 0, 0.7)", food: "#ADFF2F", foodGlow: "rgba(173, 255, 47, 0.8)", accent: "#7FFF00", locked: !unlockedEmeraldCore, unlockCondition: "Consume 50 food units in Standard mode", organicFlow: true },
    { id: "void_star", name: "VOID STAR", lore: "A paradoxical entity from the space between sectors. Its inverted colors and strobing presence tears at the fabric of the display.", head: "#000000", body: "#000000", glow: "rgba(138, 43, 226, 0.9)", food: "#9400D3", foodGlow: "rgba(148, 0, 211, 0.8)", accent: "#8B00FF", locked: !unlockedVoidStar, unlockCondition: "Consume 60 food units in Standard mode", strobeEffect: true, invertedColors: true },
    { id: "plasma_hydra", name: "PLASMA HYDRA", lore: "A multi-headed plasma projection from the reactor cores. One true head commands three decorative tails of pure energy.", head: "#FF4500", body: "#FF4500", glow: "rgba(255, 69, 0, 0.8)", food: "#FF00FF", foodGlow: "rgba(255, 0, 255, 0.8)", accent: "#9B30FF", locked: !unlockedPlasmaHydra, unlockCondition: "Consume 70 food units in Standard mode", multiHead: true },
    { id: "monochrome", name: "MONOCHROME", lore: "A classic terminal artifact from the first generation. Its stark black-and-white aesthetic pays homage to the CRT pioneers.", head: "#FFFFFF", body: "#C0C0C0", glow: "rgba(192, 192, 192, 0.6)", food: "#FFFFFF", foodGlow: "rgba(255, 255, 255, 0.8)", accent: "#808080", locked: !unlockedMonochrome, unlockCondition: "Consume 80 food units in Standard mode", retroStyle: true },
    { id: "molten_core", name: "MOLTEN CORE", lore: "A fragment of a dying star, imprisoned in code. Ember particles constantly shed from its surface, marking its passage.", head: "#FF8C00", body: "#FF8C00", glow: "rgba(255, 140, 0, 0.8)", food: "#FF0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#FFA500", locked: !unlockedMoltenCore, unlockCondition: "Consume 90 food units in Standard mode", emberParticles: true },
    { id: "titanium_coil", name: "TITANIUM COIL", lore: "Military-grade titanium alloy in snake form. Its reflective chrome surface mirrors the cold efficiency of its calculations.", head: "#C0C0C0", body: "#A9A9A9", glow: "rgba(192, 192, 192, 0.7)", food: "#4682B4", foodGlow: "rgba(70, 130, 180, 0.8)", accent: "#4169E1", locked: !unlockedTitaniumCoil, unlockCondition: "Consume 100+ food units in Standard mode", metallicSheen: true },
    { id: "quicksilver", name: "QUICKSILVER", lore: "The fastest entity in the system. Speed lines trail in its wake as it blurs through the grid at impossible velocities.", head: "#C0C0C0", body: "#87CEEB", glow: "rgba(192, 192, 192, 0.8)", food: "#00FFFF", foodGlow: "rgba(0, 255, 255, 0.8)", accent: "#00CED1", locked: !unlockedQuicksilver, unlockCondition: "Complete Standard mode under 60 seconds", speedLines: true },
    { id: "photon_dash", name: "PHOTON DASH", lore: "Pure light given form. This blinding entity moves so fast it leaves vertical light streaks that linger in its path.", head: "#FFFFFF", body: "#FFFACD", glow: "rgba(255, 255, 255, 0.9)", food: "#FFD700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#FFFF00", locked: !unlockedPhotonDash, unlockCondition: "Complete Standard mode under 45 seconds", lightStreak: true },

    // ════ CHARACTERS 21-30: Secret/Easter Egg Unlocks ════
    { id: "nokia_nostalgia", name: "NOKIA NOSTALGIA", lore: "LEGACY PROTOCOL v3310. A relic from the golden age of Snake. Green phosphor glow on black LCD. The original experience.", head: "#84B500", body: "#84B500", glow: "rgba(132, 181, 0, 0.6)", food: "#84B500", foodGlow: "rgba(132, 181, 0, 0.8)", accent: "#84B500", locked: !unlockedNokiaNostalgia, unlockCondition: "??? (Play 50 games)", hidden: true, lcdStyle: true },
    { id: "konami_code", name: "KONAMI CODE", lore: "The cheat code made flesh. Up, Up, Down, Down, Left, Right, Left, Right, B, A. It knows all secrets.", head: "#FF0000", body: "#0000FF", glow: "rgba(255, 0, 0, 0.6)", food: "#FFFF00", foodGlow: "rgba(255, 255, 0, 0.8)", accent: "#FFFFFF", locked: !unlockedKonamiCode, unlockCondition: "??? (Input the code...)", hidden: true, konamiStyle: true },
    { id: "missing_no", name: "MISSINGNO", lore: "ERR_0x4D5353484E47. A corrupted entity from the void between saves. It shouldn't exist. Don't look at it too long.", head: "#FF00FF", body: "#00FFFF", glow: "rgba(255, 0, 255, 0.9)", food: "#FF0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#00FF00", locked: !unlockedMissingNo, unlockCondition: "??? (Very dead...)", hidden: true, glitchStyle: true, screenTear: true },
    { id: "dogecoin", name: "DOGECOIN", lore: "Much code. Very secret. Wow. A cryptocurrency mascot protocol that mooned its way into the mainframe.", head: "#D4A017", body: "#D4A017", glow: "rgba(212, 160, 23, 0.7)", food: "#C0C0C0", foodGlow: "rgba(192, 192, 192, 0.8)", accent: "#4A90D9", locked: !unlockedDogecoin, unlockCondition: "??? (Much bank)", hidden: true, comicSans: true, shibaFace: true },
    { id: "binary_constrictor", name: "BINARY CONSTRICTOR", lore: "01100001 01110110 01100001 01110010 01111001. A serpent made of pure code. Its trail writes the source of reality.", head: "#00FF00", body: "#00FF00", glow: "rgba(0, 255, 0, 0.8)", food: "#00CC00", foodGlow: "rgba(0, 204, 0, 0.8)", accent: "#00AA00", locked: !unlockedBinaryConstrictor, unlockCondition: "??? (Many food)", hidden: true, matrixStyle: true, binaryTrail: true },
    { id: "the_dev", name: "THE DEV", lore: "👑 CREATOR PROTOCOL 👑. The one who built this. The one who holds the keys. All hail the developer. (Or do they?)", head: "#FFD700", body: "#9400D3", glow: "rgba(255, 215, 0, 1)", food: "#FFD700", foodGlow: "rgba(255, 215, 0, 1)", accent: "#FFD700", locked: !unlockedTheDev, unlockCondition: "??? (Unlock everything)", hidden: true, devStyle: true, crownJewel: true, goldenParticles: true },
    { id: "error_404", name: "ERROR 404", lore: "CHARACTER NOT FOUND. It exists in a state of perpetual 404. Sometimes you see it. Sometimes you don't. Refresh and try again.", head: "#888888", body: "#888888", glow: "rgba(136, 136, 136, 0.5)", food: "#666666", foodGlow: "rgba(102, 102, 102, 0.8)", accent: "#AAAAAA", locked: !unlockedError404, unlockCondition: "??? (Visit the error page)", hidden: true, errorStyle: true, flickerEffect: true },
    { id: "blue_screen", name: "BLUE SCREEN", lore: "FATAL_ERROR: DEATH_COUNT_EXCEEDED. A system failure in snake form. Your computer had feelings about your gameplay.", head: "#0000AA", body: "#0000AA", glow: "rgba(0, 0, 170, 0.8)", food: "#FFFFFF", foodGlow: "rgba(255, 255, 255, 0.8)", accent: "#FFFFFF", locked: !unlockedBlueScreen, unlockCondition: "??? (Many deaths)", hidden: true, bsodStyle: true },
    { id: "scanline_samurai", name: "SCANLINE SAMURAI", lore: "一刀必殺. The samurai of the CRT. Each movement is precise. Each tail strike is lethal. Honor in pixels.", head: "#FF0000", body: "#00FF00", glow: "rgba(255, 0, 0, 0.8)", food: "#FFFF00", foodGlow: "rgba(255, 255, 0, 0.8)", accent: "#FF0000", locked: !unlockedScanlineSamurai, unlockCondition: "??? (Much breach)", hidden: true, samuraiStyle: true, katanaTail: true },
    { id: "synthesizer", name: "SYNTHESIZER", lore: "♫♪◊◊◊♪♫. It IS the music. The body oscillates to the beat. Waveform in snake form. Hear its frequency.", head: "#FF00FF", body: "#00FFFF", glow: "rgba(255, 0, 255, 0.8)", food: "#FFFF00", foodGlow: "rgba(255, 255, 0, 0.8)", accent: "#00FF00", locked: !unlockedSynthesizer, unlockCondition: "??? (Much listening)", hidden: true, synthStyle: true, audioReactive: true },

    // ════ CHARACTERS 31-40: Speedrun/Survival/Endless Unlocks ════
    // Speedrun Characters (31-35)
    { id: "mach_mach", name: "MACH MACH", lore: "Blazing speed incarnate. Red blur on the grid. Complete Insane mode under 90 seconds to unlock.", head: "#ff0000", body: "#cc0000", glow: "rgba(255, 0, 0, 0.9)", food: "#ffff00", foodGlow: "rgba(255, 255, 0, 0.8)", accent: "#ff6666", locked: !unlockedMachMach, unlockCondition: "Complete Insane mode under 90 seconds", speedrunChar: true, blurEffect: true },
    { id: "sonic_boom", name: "SONIC BOOM", lore: "Shocking blue speed demon. Leaves afterimages. Complete Hard mode under 60 seconds.", head: "#4488ff", body: "#2266dd", glow: "rgba(68, 136, 255, 0.8)", food: "#ffffff", foodGlow: "rgba(255, 255, 255, 0.8)", accent: "#88bbff", locked: !unlockedSonicBoom, unlockCondition: "Complete Hard mode under 60 seconds", speedrunChar: true, afterimageEffect: true },
    { id: "quantum_leap", name: "QUANTUM LEAP", lore: "Magenta/cyan quantum entity. Complete ChronoShift without rewinding to prove mastery.", head: "#ff00ff", body: "#00ffff", glow: "rgba(255, 0, 255, 0.8)", food: "#00ff00", foodGlow: "rgba(0, 255, 0, 0.8)", accent: "#ff66ff", locked: !unlockedQuantumLeap, unlockCondition: "Complete ChronoShift without using rewind", chronoChar: true, quantumPulse: true },
    { id: "warp_python", name: "WARP PYTHON", lore: "Deep purple starlight serpent. Complete ChronoShift Insane under 120 seconds for maximum respect.", head: "#4a0080", body: "#2a0050", glow: "rgba(74, 0, 128, 0.9)", food: "#ffd700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#9966ff", locked: !unlockedWarpPython, unlockCondition: "Complete ChronoShift Insane under 120 seconds", chronoChar: true, speedrunChar: true, starlightTrail: true },
    { id: "flash_protocol", name: "FLASH PROTOCOL", lore: "Bright yellow/red energy snake. Clear Sentinel Breach Wave 20 to claim this prize.", head: "#ffff00", body: "#ffcc00", glow: "rgba(255, 255, 0, 0.9)", food: "#ff3300", foodGlow: "rgba(255, 51, 0, 0.8)", accent: "#ffaa00", locked: !unlockedFlashProtocol, unlockCondition: "Clear Sentinel Breach Wave 20", breachChar: true, flashEffect: true },

    // Survival/Endless Characters (36-40)
    { id: "aegis_defender", name: "AEGIS DEFENDER", lore: "Golden shield-bearer. Survive 500+ seconds in one Standard run to earn this protective serpent.", head: "#ffd700", body: "#daa520", glow: "rgba(255, 215, 0, 0.8)", food: "#00ff00", foodGlow: "rgba(0, 255, 0, 0.8)", accent: "#ffeaa7", locked: !unlockedAegisDefender, unlockCondition: "Survive 500 seconds in one Standard run", survivalChar: true, shieldIcon: true, goldenAccents: true },
    { id: "phoenix_protocol", name: "PHOENIX PROTOCOL", lore: "Resurrection serpent. Die and return 10 times in one session. Death is not the end.", head: "#ff4500", body: "#ff6600", glow: "rgba(255, 69, 0, 0.8)", food: "#ffcc00", foodGlow: "rgba(255, 204, 0, 0.8)", accent: "#ff8855", locked: !unlockedPhoenixProtocol, unlockCondition: "Die and respawn 10 times in one session", respawnAnim: true, phoenixEffect: true },
    { id: "juggernaut", name: "JUGGERNAUT", lore: "Massive unstoppable force. Reach 200 segments length to unlock this beast.", head: "#8b4513", body: "#654321", glow: "rgba(139, 69, 19, 0.8)", food: "#ff0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#cd853f", locked: !unlockedJuggernaut, unlockCondition: "Reach 200 segments in one run", massiveSize: true, intimidating: true },
    { id: "infinity_scale", name: "INFINITY SCALE", lore: "Prismatic iridescent perfection. Complete 100 Standard games to unlock this rainbow legend.", head: "#ff00ff", body: "#00ffff", glow: "rgba(255, 0, 255, 0.7)", food: "#ffd700", foodGlow: "rgba(255, 215, 0, 0.8)", accent: "#ffffff", locked: !unlockedInfinityScale, unlockCondition: "Complete 100 Standard games", prismatic: true, iridescent: true },
    { id: "zenith_serpent", name: "ZENITH SERPENT", lore: "Diamond crown blazing trail. Reach top 3 on ALL leaderboards to earn this ultimate accolade.", head: "#e0e0e0", body: "#c0c0c0", glow: "rgba(224, 224, 224, 1)", food: "#00ffff", foodGlow: "rgba(0, 255, 255, 1)", accent: "#ffffff", locked: !unlockedZenithSerpent, unlockCondition: "Reach top 3 on all leaderboards", crownJewel: true, blazingTrail: true },

    // ════ SEASONAL CHARACTERS ════
    { id: "pumpkin_protocol", name: "PUMPKIN PROTOCOL", lore: "🎃 Halloween special! Orange jack-o-lantern head. Only available during October.", head: "#ff6600", body: "#ff9900", glow: "rgba(255, 102, 0, 0.8)", food: "#ffcc00", foodGlow: "rgba(255, 204, 0, 0.8)", accent: "#ff3300", locked: false, seasonal: true, seasonId: 'pumpkin', seasonalOnly: true, jackolantern: true },
    { id: "frost_serpent", name: "FROST SERPENT", lore: "❄️ Winter special! Ice blue/white with snowflake particles. Only available Dec 1 - Jan 7.", head: "#aaddff", body: "#88bbdd", glow: "rgba(170, 221, 255, 0.8)", food: "#ffffff", foodGlow: "rgba(255, 255, 255, 0.8)", accent: "#ccffff", locked: false, seasonal: true, seasonId: 'frost', seasonalOnly: true, snowflakeParticles: true },
    { id: "heart_core", name: "HEART CORE", lore: "💕 Valentine's special! Red/pink with heart-shaped patterns. Only available Feb 1-14.", head: "#ff4466", body: "#ff6688", glow: "rgba(255, 68, 102, 0.8)", food: "#ff99aa", foodGlow: "rgba(255, 153, 170, 0.8)", accent: "#ffbbcc", locked: false, seasonal: true, seasonId: 'heart', seasonalOnly: true, heartPatterns: true },

    // ════ CHARACTER VARIANTS ════
    { id: "neon_classic", name: "NEON CLASSIC", lore: "The original green neon from Serpentine OS v0.9. A nod to the classics.", head: "#00ff00", body: "#00cc00", glow: "rgba(0, 255, 0, 0.5)", food: "#ff0000", foodGlow: "rgba(255, 0, 0, 0.8)", accent: "#00ff00", locked: !unlockedNeonClassic, unlockCondition: "Unlock via Neon Protocol variant", isVariant: true, parentId: 'neon' },
    { id: "neon_pulse", name: "NEON PULSE", lore: "Bright white variant with rapid pulsing glow effects. Energy at maximum.", head: "#ffffff", body: "#eeeeee", glow: "rgba(255, 255, 255, 0.9)", food: "#00ffcc", foodGlow: "rgba(0, 255, 204, 1)", accent: "#ffffff", locked: !unlockedNeonPulse, unlockCondition: "Unlock via Neon Protocol variant", isVariant: true, parentId: 'neon', pulseEffect: true },
    { id: "void_shadow", name: "VOID SHADOW", lore: "An even darker variant of Void Walker that absorbs surrounding light.", head: "#2a0050", body: "#1a0030", glow: "rgba(42, 0, 80, 0.4)", food: "#8800ff", foodGlow: "rgba(136, 0, 255, 0.8)", accent: "#660099", locked: !unlockedVoidShadow, unlockCondition: "Unlock via Void Walker variant", isVariant: true, parentId: 'void', shadowEffect: true },
    { id: "void_nova", name: "VOID NOVA", lore: "Creates bright energy bursts on each movement. Explosive power.", head: "#aa00ff", body: "#ff00ff", glow: "rgba(170, 0, 255, 1)", food: "#00ffff", foodGlow: "rgba(0, 255, 255, 1)", accent: "#ff66ff", locked: !unlockedVoidNova, unlockCondition: "Unlock via Void Walker variant", isVariant: true, parentId: 'void', novaEffect: true },
    { id: "glitch_classic", name: "GLITCH CLASSIC", lore: "Solid magenta without the glitch effects. More stable, less chaotic.", head: "#cc0066", body: "#aa0055", glow: "rgba(204, 0, 102, 0.7)", food: "#00ffcc", foodGlow: "rgba(0, 255, 204, 0.8)", accent: "#ff99cc", locked: !unlockedGlitchClassic, unlockCondition: "Unlock via Glitch-Wave variant", isVariant: true, parentId: 'glitch' },
    { id: "glitch_debug", name: "GLITCH DEBUG", lore: "RGB split effect with visible scanlines. For debugging the matrix.", head: "#ff0000", body: "#00ff00", glow: "rgba(255, 0, 0, 0.6)", food: "#0000ff", foodGlow: "rgba(0, 0, 255, 0.8)", accent: "#ffff00", locked: !unlockedGlitchDebug, unlockCondition: "Unlock via Glitch-Wave variant", isVariant: true, parentId: 'glitch', debugEffect: true }
];

/* --- Audio System Initialization (Session 21) --- */
// Initialize the SerpentineAudio system on first user interaction
// The audio_system.js loads before script.js, so serpentineAudio is available
document.addEventListener('click', () => serpentineAudio.init(), { once: true });
document.addEventListener('keydown', () => serpentineAudio.init(), { once: true });
document.addEventListener('touchstart', () => serpentineAudio.init(), { once: true });

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

/* --- Konami Code Listener (Global - works during gameplay) --- */
document.addEventListener('keydown', (e) => {
    // Reset if wrong key or too much time passed
    if (e.code !== KONAMI_CODE[secretTracking.konamiProgress]) {
        // Check if it's an Arrow key matching first position (allows restart)
        if (e.code === KONAMI_CODE[0]) {
            secretTracking.konamiProgress = 1;
            secretTracking.lastKonamiKey = Date.now();
        } else {
            secretTracking.konamiProgress = 0;
        }
        return;
    }

    // Advance progress
    secretTracking.konamiProgress++;
    secretTracking.lastKonamiKey = Date.now();

    // Check if Konami code complete
    if (secretTracking.konamiProgress >= KONAMI_CODE.length) {
        secretTracking.konamiProgress = 0;

        if (!unlockedKonamiCode) {
            unlockSecretCharacter('konami_code');
            console.log('%c🎮 KONAMI CODE ACTIVATED!', 'color: #FF0000; font-size: 20px; font-weight: bold; background: #0000FF; padding: 5px;');
        }
    }
});

/* --- Leaderboard System --- */
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

function addHighScore(diff, initials, score, isCheater, isChronoMode = false) {
    // ChronoShift uses separate leaderboard
    const lbKey = isChronoMode ? `chrono_${diff}` : diff;
    const board = getLeaderboard(lbKey);
    board.push({ initials, score, cheater: isCheater || false });
    board.sort((a, b) => b.score - a.score);
    saveLeaderboard(lbKey, board.slice(0, 10));
}

function renderLeaderboard(diff) {
    const list = document.getElementById('leaderboard-list');
    // Get the appropriate leaderboard key based on current mode
    const lbKey = currentLeaderboardMode === 'chronoshift' ? `chrono_${diff}` : diff;
    const board = getLeaderboard(lbKey);

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
let pendingHighScoreIsChrono = false;

/* --- 9193 Master Unlock Ritual --- */
let masterUnlockHoldStart = null; // timestamp when 9 was first pressed
let masterUnlockTimer = null;
let ritualToneOsc = null;
let ritualToneGain = null;

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
    localStorage.setItem('serpentineUnlockedCrimsonFang', 'true');
    localStorage.setItem('serpentineUnlockedCobaltGrid', 'true');
    localStorage.setItem('serpentineUnlockedEmeraldCore', 'true');
    localStorage.setItem('serpentineUnlockedVoidStar', 'true');
    localStorage.setItem('serpentineUnlockedPlasmaHydra', 'true');
    localStorage.setItem('serpentineUnlockedMonochrome', 'true');
    localStorage.setItem('serpentineUnlockedMoltenCore', 'true');
    localStorage.setItem('serpentineUnlockedTitaniumCoil', 'true');
    localStorage.setItem('serpentineUnlockedQuicksilver', 'true');
    localStorage.setItem('serpentineUnlockedPhotonDash', 'true');
    // Secret characters 21-30
    localStorage.setItem('serpentineUnlockedNokiaNostalgia', 'true');
    localStorage.setItem('serpentineUnlockedKonamiCode', 'true');
    localStorage.setItem('serpentineUnlockedMissingNo', 'true');
    localStorage.setItem('serpentineUnlockedDogecoin', 'true');
    localStorage.setItem('serpentineUnlockedBinaryConstrictor', 'true');
    localStorage.setItem('serpentineUnlockedTheDev', 'true');
    localStorage.setItem('serpentineUnlockedError404', 'true');
    localStorage.setItem('serpentineUnlockedBlueScreen', 'true');
    localStorage.setItem('serpentineUnlockedScanlineSamurai', 'true');
    localStorage.setItem('serpentineUnlockedSynthesizer', 'true');
    // Sync in-memory flags so the shop re-renders correctly
    unlockedSpectrum = true;
    unlocked9193 = true;
    unlockedPrincess = true;
    unlockedArthropod = true;
    unlockedDragon = true;
    unlockedCrimsonFang = true;
    unlockedCobaltGrid = true;
    unlockedEmeraldCore = true;
    unlockedVoidStar = true;
    unlockedPlasmaHydra = true;
    unlockedMonochrome = true;
    unlockedMoltenCore = true;
    unlockedTitaniumCoil = true;
    unlockedQuicksilver = true;
    unlockedPhotonDash = true;
    unlockedNokiaNostalgia = true;
    unlockedKonamiCode = true;
    unlockedMissingNo = true;
    unlockedDogecoin = true;
    unlockedBinaryConstrictor = true;
    unlockedTheDev = true;
    unlockedError404 = true;
    unlockedBlueScreen = true;
    unlockedScanlineSamurai = true;
    unlockedSynthesizer = true;
    // Also mark hints as already purchased since everything is unlocked
    bought9193Hint = true;
    boughtMasterHint = true;
    localStorage.setItem('bought9193Hint', 'true');
    localStorage.setItem('boughtMasterHint', 'true');

    playUnlockSound();
    for(let i = 0; i < 9; i++) {
        setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, '#ffd700', 50), i * 100);
    }
}

function resetMasterUnlock() {
    masterUnlockHoldStart = null;
    if (masterUnlockTimer) { clearTimeout(masterUnlockTimer); masterUnlockTimer = null; }
    document.querySelector('.arcade-machine').classList.remove('ritual-active');
    stopRitualTone();
}

function startRitualTone() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ritualToneGain = audioCtx.createGain();
    ritualToneGain.gain.value = 0;
    ritualToneGain.connect(audioCtx.destination);
    ritualToneOsc = audioCtx.createOscillator();
    ritualToneOsc.type = 'sine';
    ritualToneOsc.frequency.value = 432;
    ritualToneOsc.connect(ritualToneGain);
    ritualToneOsc.start();
    // Fade in over 0.5s
    ritualToneGain.gain.setTargetAtTime(0.08, audioCtx.currentTime, 0.3);
}

function stopRitualTone() {
    if (!ritualToneGain) return;
    ritualToneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
    setTimeout(() => {
        if (ritualToneOsc) { ritualToneOsc.stop(); ritualToneOsc = null; }
        if (ritualToneGain) { ritualToneGain.disconnect(); ritualToneGain = null; }
    }, 500);
}

/* --- Secret Character Unlock System --- */
function unlockSecretCharacter(charId) {
    const charMap = {
        'nokia_nostalgia': { var: () => unlockedNokiaNostalgia, storageKey: 'serpentineUnlockedNokiaNostalgia', name: 'NOKIA NOSTALGIA' },
        'konami_code': { var: () => unlockedKonamiCode, storageKey: 'serpentineUnlockedKonamiCode', name: 'KONAMI CODE' },
        'missing_no': { var: () => unlockedMissingNo, storageKey: 'serpentineUnlockedMissingNo', name: 'MISSINGNO' },
        'dogecoin': { var: () => unlockedDogecoin, storageKey: 'serpentineUnlockedDogecoin', name: 'DOGECOIN' },
        'binary_constrictor': { var: () => unlockedBinaryConstrictor, storageKey: 'serpentineUnlockedBinaryConstrictor', name: 'BINARY CONSTRICTOR' },
        'the_dev': { var: () => unlockedTheDev, storageKey: 'serpentineUnlockedTheDev', name: 'THE DEV' },
        'error_404': { var: () => unlockedError404, storageKey: 'serpentineUnlockedError404', name: 'ERROR 404' },
        'blue_screen': { var: () => unlockedBlueScreen, storageKey: 'serpentineUnlockedBlueScreen', name: 'BLUE SCREEN' },
        'scanline_samurai': { var: () => unlockedScanlineSamurai, storageKey: 'serpentineUnlockedScanlineSamurai', name: 'SCANLINE SAMURAI' },
        'synthesizer': { var: () => unlockedSynthesizer, storageKey: 'serpentineUnlockedSynthesizer', name: 'SYNTHESIZER' },
        // Characters 31-40
        'mach_mach': { var: () => unlockedMachMach, storageKey: 'serpentineUnlocked_machmach', name: 'MACH MACH' },
        'sonic_boom': { var: () => unlockedSonicBoom, storageKey: 'serpentineUnlocked_sonicboom', name: 'SONIC BOOM' },
        'quantum_leap': { var: () => unlockedQuantumLeap, storageKey: 'serpentineUnlocked_quantumleap', name: 'QUANTUM LEAP' },
        'warp_python': { var: () => unlockedWarpPython, storageKey: 'serpentineUnlocked_warppython', name: 'WARP PYTHON' },
        'flash_protocol': { var: () => unlockedFlashProtocol, storageKey: 'serpentineUnlocked_flashprotocol', name: 'FLASH PROTOCOL' },
        'aegis_defender': { var: () => unlockedAegisDefender, storageKey: 'serpentineUnlocked_aegisdefender', name: 'AEGIS DEFENDER' },
        'phoenix_protocol': { var: () => unlockedPhoenixProtocol, storageKey: 'serpentineUnlocked_phoenixprotocol', name: 'PHOENIX PROTOCOL' },
        'juggernaut': { var: () => unlockedJuggernaut, storageKey: 'serpentineUnlocked_juggernaut', name: 'JUGGERNAUT' },
        'infinity_scale': { var: () => unlockedInfinityScale, storageKey: 'serpentineUnlocked_infinityscale', name: 'INFINITY SCALE' },
        'zenith_serpent': { var: () => unlockedZenithSerpent, storageKey: 'serpentineUnlocked_zenithserpent', name: 'ZENITH SERPENT' },
        // Variants
        'neon_classic': { var: () => unlockedNeonClassic, storageKey: 'serpentineUnlocked_neon_classic', name: 'NEON CLASSIC' },
        'neon_pulse': { var: () => unlockedNeonPulse, storageKey: 'serpentineUnlocked_neon_pulse', name: 'NEON PULSE' },
        'void_shadow': { var: () => unlockedVoidShadow, storageKey: 'serpentineUnlocked_void_shadow', name: 'VOID SHADOW' },
        'void_nova': { var: () => unlockedVoidNova, storageKey: 'serpentineUnlocked_void_nova', name: 'VOID NOVA' },
        'glitch_classic': { var: () => unlockedGlitchClassic, storageKey: 'serpentineUnlocked_glitch_classic', name: 'GLITCH CLASSIC' },
        'glitch_debug': { var: () => unlockedGlitchDebug, storageKey: 'serpentineUnlocked_glitch_debug', name: 'GLITCH DEBUG' }
    };

    const charInfo = charMap[charId];
    if (!charInfo) return;

    // Check if already unlocked
    if (charInfo.var()) return;

    // Set the variable
    switch(charId) {
        case 'nokia_nostalgia': unlockedNokiaNostalgia = true; break;
        case 'konami_code': unlockedKonamiCode = true; break;
        case 'missing_no': unlockedMissingNo = true; break;
        case 'dogecoin': unlockedDogecoin = true; break;
        case 'binary_constrictor': unlockedBinaryConstrictor = true; break;
        case 'the_dev': unlockedTheDev = true; break;
        case 'error_404': unlockedError404 = true; break;
        case 'blue_screen': unlockedBlueScreen = true; break;
        case 'scanline_samurai': unlockedScanlineSamurai = true; break;
        case 'synthesizer': unlockedSynthesizer = true; break;
        case 'mach_mach': unlockedMachMach = true; break;
        case 'sonic_boom': unlockedSonicBoom = true; break;
        case 'quantum_leap': unlockedQuantumLeap = true; break;
        case 'warp_python': unlockedWarpPython = true; break;
        case 'flash_protocol': unlockedFlashProtocol = true; break;
        case 'aegis_defender': unlockedAegisDefender = true; break;
        case 'phoenix_protocol': unlockedPhoenixProtocol = true; break;
        case 'juggernaut': unlockedJuggernaut = true; break;
        case 'infinity_scale': unlockedInfinityScale = true; break;
        case 'zenith_serpent': unlockedZenithSerpent = true; break;
        case 'neon_classic': unlockedNeonClassic = true; break;
        case 'neon_pulse': unlockedNeonPulse = true; break;
        case 'void_shadow': unlockedVoidShadow = true; break;
        case 'void_nova': unlockedVoidNova = true; break;
        case 'glitch_classic': unlockedGlitchClassic = true; break;
        case 'glitch_debug': unlockedGlitchDebug = true; break;
    }

    // Persist to localStorage
    localStorage.setItem(charInfo.storageKey, 'true');

    // Unlock the profile
    const profile = snakeProfiles.find(p => p.id === charId);
    if (profile) profile.locked = false;

    // Play unlock sound and effects
    playUnlockSound();
    for(let i = 0; i < 9; i++) {
        setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, '#ffd700', 50), i * 100);
    }

    // Show unlock notification
    if (typeof showUnlockPopup === 'function') {
        showUnlockPopup(`SECRET UNLOCKED!\n${charInfo.name}`, '#ffd700');
    }

    console.log(`🔓 Secret character unlocked: ${charInfo.name}`);

    // Track in profile secrets if available
    if (saveManager?.profile?.secrets?.foundEasterEggs) {
        if (!saveManager.profile.secrets.foundEasterEggs.includes(charId)) {
            saveManager.profile.secrets.foundEasterEggs.push(charId);
        }
    }
}

function checkAllCharactersUnlocked() {
    // Check if all 30 characters are unlocked (for THE DEV)
    const totalCharacters = snakeProfiles.length;
    const unlockedCount = snakeProfiles.filter(p => !p.locked).length;
    return unlockedCount >= totalCharacters;
}

/* --- Check Secret Character Unlocks --- */
function checkSecretUnlocks(profile) {
    if (!profile) return;

    const stats = profile.stats || {};
    const economy = profile.economy || {};

    // 21. Nokia Nostalgia: Play 50 games
    if (!unlockedNokiaNostalgia && stats.totalGamesPlayed >= 50) {
        unlockSecretCharacter('nokia_nostalgia');
    }

    // 24. Dogecoin: Collect 10000 bank points total
    if (!unlockedDogecoin && economy.bank >= 10000) {
        unlockSecretCharacter('dogecoin');
    }

    // 25. Binary Constrictor: Reach 500 food eaten total
    if (!unlockedBinaryConstrictor && stats.totalFoodEaten >= 500) {
        unlockSecretCharacter('binary_constrictor');
    }

    // 26. The Dev: Unlock all other 29 characters
    if (!unlockedTheDev && checkAllCharactersUnlocked()) {
        unlockSecretCharacter('the_dev');
    }

    // 28. Blue Screen: Die 100 times
    if (!unlockedBlueScreen && stats.totalDeaths >= 100) {
        unlockSecretCharacter('blue_screen');
    }
}

/* --- Error 404 Secret Page Handler --- */
// Hidden URL: /#error404 or accessing a non-existent route
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#error404' || window.location.hash === '#404') {
        if (!unlockedError404) {
            unlockSecretCharacter('error_404');
        }
    }
});

// Also check on page load
if (window.location.hash === '#error404' || window.location.hash === '#404') {
    if (!unlockedError404) {
        unlockSecretCharacter('error_404');
    }
}

/* ===== CHARACTER 31-40 UNLOCK CHECKING SYSTEM ===== */

let currentSpeedrunStartTime = 0;
let currentSpeedrunDifficulty = '';
let currentSpeedrunMode = 'standard';
let currentSpeedrunFoodEaten = 0;
let maxLengthThisRun = 0;

function startSpeedrunTracking(difficulty, mode) {
    if (mode === undefined) mode = 'standard';
    currentSpeedrunStartTime = Date.now();
    currentSpeedrunDifficulty = difficulty;
    currentSpeedrunMode = mode;
    currentSpeedrunFoodEaten = 0;
    maxLengthThisRun = 0;
    speedrunActive = true;
    speedrunStartTime = currentSpeedrunStartTime;
    speedrunDifficulty = difficulty;
    speedrunMode = mode;
}

function updateSpeedrunStats(foodCount, snakeLength) {
    currentSpeedrunFoodEaten = foodCount;
    if (snakeLength > maxLengthThisRun) {
        maxLengthThisRun = snakeLength;
        const saved = parseInt(localStorage.getItem('serpentineStats_maxSnakeLength') || '0');
        localStorage.setItem('serpentineStats_maxSnakeLength', Math.max(saved, snakeLength).toString());
    }
}

function checkSpeedrunUnlocks(wasCompleted, finalTime) {
    if (!speedrunActive) return;
    const elapsedMs = Date.now() - speedrunStartTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const gamesCompleted = (parseInt(localStorage.getItem('serpentineStats_standardGames') || '0') || 0) + 1;
    localStorage.setItem('serpentineStats_standardGames', gamesCompleted.toString());

    if (currentSpeedrunMode === 'standard' && currentSpeedrunDifficulty === 'insane' && wasCompleted && elapsedSec < 90) {
        if (!unlockedMachMach) { unlockSecretCharacter('mach_mach'); console.log('MACH MACH UNLOCKED!'); }
    }
    if (currentSpeedrunMode === 'standard' && currentSpeedrunDifficulty === 'hard' && wasCompleted && elapsedSec < 60) {
        if (!unlockedSonicBoom) { unlockSecretCharacter('sonic_boom'); console.log('SONIC BOOM UNLOCKED!'); }
    }
    const bestTime = parseInt(localStorage.getItem('serpentineBestTime_' + currentSpeedrunDifficulty) || '999999');
    if (elapsedSec < bestTime) localStorage.setItem('serpentineBestTime_' + currentSpeedrunDifficulty, elapsedSec.toString());
    speedrunActive = false;
}

function checkSurvivalUnlocks(survivalTime) {
    const currentMax = parseInt(localStorage.getItem('serpentineStats_maxSurvival') || '0');
    if (survivalTime > currentMax) localStorage.setItem('serpentineStats_maxSurvival', survivalTime.toString());
    if (survivalTime >= 500 && !unlockedAegisDefender) { unlockSecretCharacter('aegis_defender'); console.log('AEGIS DEFENDER UNLOCKED!'); }
}

function checkDeathCountUnlocks(sessionDeaths) {
    const currentDeaths = (parseInt(localStorage.getItem('serpentineStats_sessionDeaths') || '0') || 0) + sessionDeaths;
    localStorage.setItem('serpentineStats_sessionDeaths', currentDeaths.toString());
    if (currentDeaths >= 10 && !unlockedPhoenixProtocol) { unlockSecretCharacter('phoenix_protocol'); console.log('PHOENIX PROTOCOL UNLOCKED!'); }
}

function checkSnakeLengthUnlocks(length) {
    if (length >= 200 && !unlockedJuggernaut) { unlockSecretCharacter('juggernaut'); console.log('JUGGERNAUT UNLOCKED!'); }
}

function checkTotalGamesUnlocks(gamesCompleted) {
    if (gamesCompleted >= 100 && !unlockedInfinityScale) { unlockSecretCharacter('infinity_scale'); console.log('INFINITY SCALE UNLOCKED!'); }
}

function checkLeaderboardUnlocks() {
    const difficulties = ['easy', 'medium', 'hard', 'insane'];
    const allTop3 = difficulties.every(function(diff) {
        const board = getLeaderboard(diff);
        return board.some(function(entry, i) { return i < 3; });
    });
    if (allTop3 && !unlockedZenithSerpent) {
        localStorage.setItem('serpentineStats_leaderboardTop3', JSON.stringify({easy:true,medium:true,hard:true,insane:true}));
        unlockSecretCharacter('zenith_serpent'); console.log('ZENITH SERPENT UNLOCKED!');
    }
}

function checkChronoShiftUnlocks(usedRewind, completionTime, difficulty) {
    if (!usedRewind && !unlockedQuantumLeap) {
        localStorage.setItem('serpentineStats_chronoNoRewind', 'true');
        unlockSecretCharacter('quantum_leap'); console.log('QUANTUM LEAP UNLOCKED!');
    }
    if (difficulty === 'insane' && completionTime < 120 && !unlockedWarpPython) {
        unlockSecretCharacter('warp_python'); console.log('WARP PYTHON UNLOCKED!');
    }
}

function checkSentinelBreachUnlocks(waveReached) {
    if (waveReached >= 20 && !unlockedFlashProtocol) {
        localStorage.setItem('serpentineStats_wave20', 'true');
        unlockSecretCharacter('flash_protocol'); console.log('FLASH PROTOCOL UNLOCKED!');
    }
}

function checkVariantUnlocks(parentId, gamesPlayed) {
    var variantUnlocks = {
        'neon': { 'neon_classic': 10, 'neon_pulse': 25 },
        'void': { 'void_shadow': 10, 'void_nova': 25 },
        'glitch': { 'glitch_classic': 10, 'glitch_debug': 25 }
    };
    var unlocks = variantUnlocks[parentId];
    if (!unlocks) return;
    for (var variantId in unlocks) {
        if (!unlocks.hasOwnProperty(variantId)) continue;
        var gamesRequired = unlocks[variantId];
        var varUnlocked = localStorage.getItem('serpentineVariantGames_' + variantId) || '0';
        var currentGames = parseInt(varUnlocked) + (gamesPlayed > 0 ? 1 : 0);
        if (currentGames >= gamesRequired) {
            switch(variantId) {
                case 'neon_classic': unlockedNeonClassic = true; localStorage.setItem('serpentineUnlocked_neon_classic', 'true'); break;
                case 'neon_pulse': unlockedNeonPulse = true; localStorage.setItem('serpentineUnlocked_neon_pulse', 'true'); break;
                case 'void_shadow': unlockedVoidShadow = true; localStorage.setItem('serpentineUnlocked_void_shadow', 'true'); break;
                case 'void_nova': unlockedVoidNova = true; localStorage.setItem('serpentineUnlocked_void_nova', 'true'); break;
                case 'glitch_classic': unlockedGlitchClassic = true; localStorage.setItem('serpentineUnlocked_glitch_classic', 'true'); break;
                case 'glitch_debug': unlockedGlitchDebug = true; localStorage.setItem('serpentineUnlocked_glitch_debug', 'true'); break;
            }
            var profile = snakeProfiles.find(function(p) { return p.id === variantId; });
            if (profile) profile.locked = false;
            console.log('Variant unlocked: ' + variantId);
        }
        localStorage.setItem('serpentineVariantGames_' + variantId, currentGames.toString());
    }
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
        loreElement.className = 'char-lore-locked';
        
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
        loreElement.className = '';
        
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
            lockText.style.animation = 'lockPulse 1s ease-in-out infinite';
            selectBtn.style.opacity = '0.5';
            selectBtn.style.pointerEvents = 'none';
            selectBtn.textContent = 'LOCKED';
        } else {
            lockText.classList.add('hidden');
            lockText.style.animation = '';
            selectBtn.style.opacity = '1';
            selectBtn.style.pointerEvents = 'auto';
            selectBtn.textContent = 'SELECT';
        }
    }

    // Inject lock pulse animation once
    if (!document.getElementById('lock-pulse-style')) {
        const s = document.createElement('style');
        s.id = 'lock-pulse-style';
        s.textContent = `
            @keyframes lockPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            .char-lore-locked {
                animation: lockPulse 1.2s ease-in-out infinite;
                color: #ffd700 !important;
                font-weight: bold !important;
                letter-spacing: 1px !important;
            }
        `;
        document.head.appendChild(s);
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
let standardRunStartTime = 0; // Track time for speed-based unlocks
let barkCounter = 3; // Track when princess barks
bank = parseInt(localStorage.getItem('serpentineBank')) || 0;
bought9193Hint = localStorage.getItem('bought9193Hint') === 'true';
boughtMasterHint = localStorage.getItem('boughtMasterHint') === 'true';
let isPaused = false;

// --- Power-Up System ---
const POWERUP_TYPES = [
    { id: 'shield',   name: 'SHIELD',      color: '#4488ff', glow: 'rgba(68,136,255,0.8)',  duration: 10000 },
    { id: 'speed',    name: 'SPEED BOOST', color: '#ffdd00', glow: 'rgba(255,221,0,0.8)',    duration: 8000  },
    { id: 'ghost',    name: 'GHOST',       color: '#ffffff', glow: 'rgba(255,255,255,0.6)',  duration: 5000  },
    { id: 'magnet',   name: 'MAGNET',      color: '#aa44ff', glow: 'rgba(170,68,255,0.8)',   duration: 8000  },
    { id: 'double',   name: 'DOUBLE EAT', color: '#44ff88', glow: 'rgba(68,255,136,0.8)',   duration: 10000 }
];
let activePowerUp = null;
let powerUpEndTime = 0;
let powerUpFood = null; // { x, y, type } - the power-up item on the grid
let mercyAvailable = false;

// --- Shop Demo Mode ---
let demoState = null; // { mode, startTime, snake, food, chronoOrbs, particles, tick, phase }
let demoAnimFrame = null;
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
    // Skip if audio context not ready or suspended
    if (!audioCtx || audioCtx.state === 'suspended') return;
    // On file:// protocol, fetch will fail - this is expected, fail silently
    try {
        const response = await fetch('./resources/sounds/princess_bark.mp3');
        if (!response.ok) throw new Error('File not found');
        const arrayBuffer = await response.arrayBuffer();
        princessBarkBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
        // Princess bark is optional - fail silently since procedural bark exists
    }
}

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

function activatePowerUp(type) {
    if (activePowerUp) deactivatePowerUp();
    activePowerUp = type;
    powerUpEndTime = Date.now() + type.duration;
    showUnlockPopup(type.name + ' ACTIVATED', type.color);

    // Show HUD indicator
    const indicator = document.getElementById('powerup-indicator');
    const label = document.getElementById('powerup-label');
    if (indicator && label) {
        indicator.style.visibility = 'visible';
        label.textContent = type.name;
        label.style.color = type.color;
    }
}

function deactivatePowerUp() {
    activePowerUp = null;
    const indicator = document.getElementById('powerup-indicator');
    if (indicator) indicator.style.visibility = 'hidden';
}

// ─────────────────────────────────────────────
// SHOP DEMO MODE
// ─────────────────────────────────────────────

const DEMO_DURATION = 15000; // 15 seconds
const DEMO_TILE = 20; // grid cell size in demo canvas (30px cells, 20 cells = 600px)
const DEMO_GRID = 30; // canvas pixels per cell

function startDemo(mode) {
    hideAllMenus();

    // Show demo overlay
    let demoOverlay = document.getElementById('demo-overlay');
    if (!demoOverlay) {
        demoOverlay = document.createElement('div');
        demoOverlay.id = 'demo-overlay';
        demoOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(5,5,5,0.9); z-index: 100;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
        `;
        document.body.appendChild(demoOverlay);
    }

    // Canvas for demo
    let demoCanvas = document.getElementById('demo-canvas');
    if (!demoCanvas) {
        demoCanvas = document.createElement('canvas');
        demoCanvas.id = 'demo-canvas';
        demoCanvas.width = 600;
        demoCanvas.height = 600;
        demoCanvas.style.cssText = 'border: 2px solid #b026ff; border-radius: 8px;';
        demoOverlay.appendChild(demoCanvas);
    }
    demoCanvas.style.display = 'block';

    // Title
    let demoTitle = document.getElementById('demo-title');
    if (!demoTitle) {
        demoTitle = document.createElement('div');
        demoTitle.id = 'demo-title';
        demoOverlay.appendChild(demoTitle);
    }
    demoTitle.style.cssText = `
        font-family: 'Orbitron', sans-serif; font-size: 1.8rem; font-weight: 900;
        color: #00ffcc; letter-spacing: 4px; margin-bottom: 15px;
        text-shadow: 0 0 15px #00ffcc;
    `;

    // Progress bar
    let demoBar = document.getElementById('demo-bar');
    if (!demoBar) {
        demoBar = document.createElement('div');
        demoBar.id = 'demo-bar';
        demoBar.style.cssText = `
            width: 400px; height: 6px; background: rgba(255,255,255,0.1);
            border-radius: 3px; margin-bottom: 15px; overflow: hidden;
        `;
        demoOverlay.appendChild(demoBar);
    }
    let demoBarFill = document.getElementById('demo-bar-fill');
    if (!demoBarFill) {
        demoBarFill = document.createElement('div');
        demoBarFill.id = 'demo-bar-fill';
        demoBarFill.style.cssText = `
            height: 100%; background: linear-gradient(90deg, #00ffcc, #b026ff);
            width: 0%; transition: width 0.1s linear;
        `;
        demoBar.appendChild(demoBarFill);
    }

    // Skip button
    let demoSkip = document.getElementById('demo-skip');
    if (!demoSkip) {
        demoSkip = document.createElement('button');
        demoSkip.id = 'demo-skip';
        demoSkip.textContent = 'SKIP';
        demoSkip.style.cssText = `
            font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 2px;
            padding: 6px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
            color: #aaa; border-radius: 4px; cursor: pointer; margin-top: 10px;
        `;
        demoSkip.addEventListener('click', stopDemo);
        demoOverlay.appendChild(demoSkip);
    }
    demoSkip.style.display = 'block';

    // Initialize demo state
    const cx = Math.floor(DEMO_TILE / 2);
    const cy = Math.floor(DEMO_TILE / 2);

    demoState = {
        mode,
        startTime: performance.now(),
        snake: [{ x: cx, y: cy }, { x: cx, y: cy + 1 }, { x: cx, y: cy + 2 }],
        dx: 0,
        dy: -1,
        food: { x: cx + 5, y: cy },
        powerUpFood: null,
        particles: [],
        tickAccum: 0,
        phase: 'intro', // intro → action → rewind → outro
        introDone: false,
        rewindFlash: 0,
        rewindGhost: null,
        chronoMeter: 0,
        slowMoActive: false,
        slowMoRemaining: 0,
        ffActive: false,
        ffRemaining: 0
    };

    if (demoAnimFrame) cancelAnimationFrame(demoAnimFrame);
    demoAnimFrame = requestAnimationFrame(runDemo);
}

function runDemo(currentTime) {
    if (!demoState) return;

    const elapsed = currentTime - demoState.startTime;
    const progress = Math.min(elapsed / DEMO_DURATION, 1);

    // Update progress bar
    const barFill = document.getElementById('demo-bar-fill');
    if (barFill) barFill.style.width = (progress * 100) + '%';

    const canvas = document.getElementById('demo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 600, 600);

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= DEMO_TILE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * DEMO_GRID, 0);
        ctx.lineTo(i * DEMO_GRID, 600);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * DEMO_GRID);
        ctx.lineTo(600, i * DEMO_GRID);
        ctx.stroke();
    }

    // Update demo based on mode and time
    const t = elapsed / 1000; // seconds

    if (demoState.mode === 'chrono') {
        runChronoDemo(ctx, t, elapsed);
    } else if (demoState.mode === 'sentinel') {
        runSentinelDemo(ctx, t, elapsed);
    } else if (demoState.mode === 'grid') {
        runGridWarfareDemo(ctx, t, elapsed);
    } else if (demoState.mode === 'neural') {
        runNeuralFitDemo(ctx, t, elapsed);
    } else if (demoState.mode === 'breach') {
        runBreachDemo(ctx, t, elapsed);
    }

    // Particles
    demoState.particles = demoState.particles.filter(p => {
        p.life -= 0.016;
        if (p.life <= 0) return false;
        p.x += p.vx;
        p.y += p.vy;
        return true;
    });
    demoState.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Intro overlay
    if (!demoState.introDone) {
        const titleEl = document.getElementById('demo-title');
        if (titleEl) {
            if (t < 2) {
                titleEl.textContent = t < 0.5 ? 'CHRONOSHIFT' : '';
                titleEl.style.opacity = t < 0.5 ? Math.min(t * 2, 1) : Math.max(1 - (t - 0.5) * 2, 0);
            }
            if (t >= 0.5 && t < 1.5) {
                titleEl.textContent = 'TIME IS YOUR WEAPON';
                titleEl.style.opacity = Math.min((t - 0.5) * 2, 1);
            }
            if (t >= 1.5) {
                titleEl.style.opacity = Math.max(1 - (t - 1.5) * 2, 0);
                if (t >= 2) demoState.introDone = true;
            }
        }
    }

    // Check end
    if (elapsed >= DEMO_DURATION) {
        stopDemo();
        return;
    }

    demoAnimFrame = requestAnimationFrame(runDemo);
}

// ─── CHRONOSHIFT DEMO ───
function runChronoDemo(ctx, t, elapsed) {
    const state = demoState;

    // Chrono meter charges over time
    if (t > 1 && state.chronoMeter < 600) {
        state.chronoMeter = Math.min(600, (t - 1) * 150);
    }

    // Snake auto-moves (every 200ms)
    state.tickAccum += 16;
    const tickRate = state.slowMoActive ? 320 : (state.ffActive ? 100 : 200);

    if (state.tickAccum >= tickRate) {
        state.tickAccum = 0;

        // Record history
        if (!state.history) state.history = [];
        state.history.push({
            snake: state.snake.map(s => ({...s})),
            food: {...state.food},
            powerUpFood: state.powerUpFood ? {...state.powerUpFood} : null
        });
        if (state.history.length > 15) state.history.shift();

        // Move
        if (!state.rewindGhost) {
            const head = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
            // Wall wrap
            if (head.x < 0) head.x = DEMO_TILE - 1;
            if (head.x >= DEMO_TILE) head.x = 0;
            if (head.y < 0) head.y = DEMO_TILE - 1;
            if (head.y >= DEMO_TILE) head.y = 0;
            state.snake.unshift(head);
            // Auto-steer to avoid walls
            if (head.x === 0 || head.x === DEMO_TILE - 1 || head.y === 0 || head.y === DEMO_TILE - 1) {
                state.dx = Math.random() > 0.5 ? 1 : -1; state.dy = 0;
            }
            state.snake.pop();
        }

        // Rewind ghost: animate back
        if (state.rewindGhost) {
            state.rewindGhost.t = Math.max(0, state.rewindGhost.t - 1);
            if (state.rewindGhost.t <= 0) state.rewindGhost = null;
        }
    }

    // SLOW-MO trigger at ~5s
    if (t > 5 && t < 6 && state.chronoMeter >= 200 && !state.slowMoActive && !state.ffActive) {
        state.slowMoActive = true;
        state.slowMoRemaining = 3000;
        state.chronoMeter -= 200;
        showDemoPopup('SLOW-MO');
        // Burst
        for (let i = 0; i < 20; i++) {
            demoState.particles.push({
                x: state.snake[0].x * DEMO_GRID + DEMO_GRID/2,
                y: state.snake[0].y * DEMO_GRID + DEMO_GRID/2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 3 + Math.random() * 3,
                color: '#4488ff',
                life: 0.8
            });
        }
    }
    if (state.slowMoActive) {
        state.slowMoRemaining -= 16;
        if (state.slowMoRemaining <= 0) state.slowMoActive = false;
    }

    // REWIND trigger at ~10s
    if (t > 10 && state.chronoMeter >= 500 && !state.rewindGhost && state.history && state.history.length > 0 && !state.slowMoActive) {
        // Flash and rewind
        state.rewindGhost = { snake: state.history[0].snake.map(s => ({...s})), food: {...state.history[0].food}, t: 8 };
        state.snake = state.history[0].snake.map(s => ({...s}));
        state.food = {...state.history[0].food};
        state.history = [];
        state.chronoMeter -= 500;
        state.rewindFlash = 5;
        showDemoPopup('REWIND!');
    }
    if (state.rewindFlash > 0) state.rewindFlash--;

    // Draw snake
    const drawSnake = (snake, alpha, tint) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? (tint || '#00ffcc') : '#00cc99';
            ctx.shadowBlur = 10;
            ctx.shadowColor = i === 0 ? '#ffffff' : '#00ffcc';
            ctx.beginPath();
            ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
            ctx.fill();
        });
        ctx.restore();
    };

    // Rewind ghost
    if (state.rewindGhost) {
        drawSnake(state.rewindGhost.snake, 0.15 + state.rewindGhost.t * 0.05, '#aaaaaa');
    }

    drawSnake(state.snake, state.slowMoActive ? 0.6 : 1, null);

    // SLOW-MO halo
    if (state.slowMoActive) {
        ctx.save();
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4488ff';
        ctx.beginPath();
        const hx = state.snake[0].x * DEMO_GRID + DEMO_GRID/2;
        const hy = state.snake[0].y * DEMO_GRID + DEMO_GRID/2;
        ctx.arc(hx, hy, DEMO_GRID, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Rewind flash
    if (state.rewindFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${state.rewindFlash * 0.15})`;
        ctx.fillRect(0, 0, 600, 600);
        ctx.restore();
    }

    // Food
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(state.food.x * DEMO_GRID + 3, state.food.y * DEMO_GRID + 3, DEMO_GRID - 6, DEMO_GRID - 6, 4);
    ctx.fill();
    ctx.restore();

    // Chrono orb
    if (state.chronoMeter > 200) {
        const orbPulse = Math.sin(t * 4) * 2;
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(5 * DEMO_GRID + DEMO_GRID/2, 5 * DEMO_GRID + DEMO_GRID/2, DEMO_GRID/2 - 2 + orbPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // HUD
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Orbitron';
    ctx.fillText('CHRONO', 10, 25);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(10, 30, (state.chronoMeter / 600) * 120, 6);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Orbitron';
    ctx.fillText(`${Math.floor(state.chronoMeter)}/600`, 10, 50);

    if (state.slowMoActive) {
        ctx.fillStyle = '#4488ff';
        ctx.font = 'bold 14px Orbitron';
        ctx.fillText('SLOW-MO', 460, 30);
        ctx.fillRect(460, 38, 120 * (state.slowMoRemaining / 3000), 6);
    }
}

// ─── SENTINEL BREACH DEMO ───
function runSentinelDemo(ctx, t, elapsed) {
    const state = demoState;
    if (!state.sentinels) {
        state.sentinels = [];
        state.tickAccum = 0;
        state.waveAnnounce = 0;
        state.score = 0;
    }

    state.tickAccum += 16;
    if (state.tickAccum >= 250) {
        state.tickAccum = 0;
        // Move sentinels toward center
        const cx = DEMO_TILE / 2;
        const cy = DEMO_TILE / 2;
        state.sentinels.forEach(s => {
            const dx = Math.sign(cx - s.x);
            const dy = Math.sign(cy - s.y);
            if (Math.random() > 0.3) s.x += dx;
            else s.y += dy;
        });
    }

    // Spawn sentinels
    if (state.sentinels.length < 5 && Math.random() < 0.02) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) { x = Math.floor(Math.random() * DEMO_TILE); y = 0; }
        else if (edge === 1) { x = DEMO_TILE - 1; y = Math.floor(Math.random() * DEMO_TILE); }
        else if (edge === 2) { x = Math.floor(Math.random() * DEMO_TILE); y = DEMO_TILE - 1; }
        else { x = 0; y = Math.floor(Math.random() * DEMO_TILE); }
        state.sentinels.push({ x, y, segs: [{x, y:y}, {x, y:y+1}, {x, y:y+2}] });
    }

    // Auto-move player snake
    state.tickAccum += 16;
    if (state.tickAccum >= 200) {
        state.tickAccum = 0;
        const h = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
        if (h.x < 0 || h.x >= DEMO_TILE || h.y < 0 || h.y >= DEMO_TILE) {
            state.dx = state.dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            state.dy = state.dx !== 0 ? 0 : (Math.random() > 0.5 ? 1 : -1);
        }
        h.x = state.snake[0].x + state.dx;
        h.y = state.snake[0].y + state.dy;
        state.snake.unshift(h);
        state.snake.pop();
    }

    // Draw nexus at center
    const cx = DEMO_TILE / 2;
    const cy = DEMO_TILE / 2;
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 20 + Math.sin(t * 3) * 5;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx * DEMO_GRID + DEMO_GRID/2, cy * DEMO_GRID + DEMO_GRID/2, DEMO_GRID, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw sentinels
    const colors = ['#4488ff', '#ff00aa', '#ff2200'];
    state.sentinels.forEach((s, i) => {
        ctx.save();
        ctx.fillStyle = colors[i % colors.length];
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        s.segments.forEach((seg, j) => {
            ctx.globalAlpha = j === 0 ? 1 : 0.7;
            ctx.beginPath();
            ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 2);
            ctx.fill();
        });
        ctx.restore();
    });

    // Draw player snake
    ctx.save();
    state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - (i / state.snake.length) * 0.6);
        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });
    ctx.restore();

    // Food
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(state.food.x * DEMO_GRID + 3, state.food.y * DEMO_GRID + 3, DEMO_GRID - 6, DEMO_GRID - 6, 4);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Orbitron';
    ctx.fillText('WAVE 1', 10, 25);
    ctx.fillText('SENTINELS: ' + state.sentinels.length, 10, 45);
}

// ─── GRID WARFARE DEMO ───
function runGridWarfareDemo(ctx, t, elapsed) {
    const state = demoState;
    if (!state.player2) {
        state.player2 = [
            { x: 16, y: 10 }, { x: 17, y: 10 }, { x: 18, y: 10 }
        ];
        state.p2dx = -1; state.p2dy = 0;
        state.tickAccum = 0;
    }

    state.tickAccum += 16;
    if (state.tickAccum >= 200) {
        state.tickAccum = 0;

        // Move both snakes
        const move = (snake, dx, dy) => {
            const h = { x: snake[0].x + dx, y: snake[0].y + dy };
            snake.unshift(h);
            snake.pop();
        };

        // Auto-steer both
        const steerToFood = (snake, dx, dy) => {
            if (Math.random() < 0.3) {
                const fx = state.food.x - snake[0].x;
                const fy = state.food.y - snake[0].y;
                if (Math.abs(fx) > Math.abs(fy)) { return { dx: Math.sign(fx), dy: 0 }; }
                else { return { dx: 0, dy: Math.sign(fy) }; }
            }
            return { dx, dy };
        };

        const p1 = steerToFood(state.snake, state.dx, state.dy);
        state.dx = p1.dx; state.dy = p1.dy;
        move(state.snake, state.dx, state.dy);

        const p2 = steerToFood(state.player2, state.p2dx, state.p2dy);
        state.p2dx = p2.dx; state.p2dy = p2.dy;
        move(state.player2, state.p2dx, state.p2dy);
    }

    // Draw arena border
    ctx.save();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = DEMO_GRID;
    ctx.strokeRect(DEMO_GRID/2, DEMO_GRID/2, 600 - DEMO_GRID, 600 - DEMO_GRID);
    ctx.restore();

    // Draw center line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 600);
    ctx.stroke();
    ctx.restore();

    // Player 1 (cyan)
    ctx.save();
    state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffcc';
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - (i / state.snake.length) * 0.6);
        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });
    ctx.restore();

    // Player 2 (magenta)
    ctx.save();
    state.player2.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#ff0055' : '#cc0044';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff0055';
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - (i / state.player2.length) * 0.6);
        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });
    ctx.restore();

    // Food
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(state.food.x * DEMO_GRID + DEMO_GRID/2, state.food.y * DEMO_GRID + DEMO_GRID/2, DEMO_GRID/2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillText('P1', 10, 25);
    ctx.fillStyle = '#aaa';
    ctx.fillText('ROUNDS: 0/5', 10, 45);
    ctx.fillStyle = '#ff0055';
    ctx.fillText('P2 (AI)', 490, 25);
}

// ─── NEURAL FIT DEMO ───
function runNeuralFitDemo(ctx, t, elapsed) {
    const state = demoState;
    if (!state.drillPath) {
        // Build a figure-8 drill path
        state.drillPath = [];
        // Start center, move right and up in a figure-8
        const cx = DEMO_TILE / 2;
        const cy = DEMO_TILE / 2;
        for (let i = 0; i < 8; i++) state.drillPath.push({ x: cx + i - 4, y: cy });
        for (let i = 0; i < 6; i++) state.drillPath.push({ x: cx + 4, y: cy - i });
        for (let i = 0; i < 8; i++) state.drillPath.push({ x: cx + 4 - i, y: cy - 6 });
        for (let i = 0; i < 6; i++) state.drillPath.push({ x: cx - 4, y: cy - 6 + i });
        state.drillPathIdx = 0;
        state.tickAccum = 0;
        state.accuracy = 100;
        state.combo = 0;
    }

    state.tickAccum += 16;
    if (state.tickAccum >= 200) {
        state.tickAccum = 0;
        // Move drill target
        state.drillPathIdx = (state.drillPathIdx + 1) % state.drillPath.length;
    }

    const targetCell = state.drillPath[state.drillPathIdx];

    // Auto-move player toward target
    state.tickAccum += 16;
    if (state.tickAccum >= 200) {
        state.tickAccum = 0;
        const tx = Math.sign(targetCell.x - state.snake[0].x);
        const ty = Math.sign(targetCell.y - state.snake[0].y);
        if (tx !== 0 || ty !== 0) {
            state.snake.unshift({ x: state.snake[0].x + tx, y: state.snake[0].y + ty });
            state.snake.pop();
        }
    }

    // Draw ghost trail (target path)
    ctx.save();
    state.drillPath.forEach((cell, i) => {
        const alpha = i === state.drillPathIdx ? 0.8 : 0.3;
        ctx.fillStyle = `rgba(74, 74, 106, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(cell.x * DEMO_GRID + 2, cell.y * DEMO_GRID + 2, DEMO_GRID - 4, DEMO_GRID - 4, 3);
        ctx.fill();
    });
    ctx.restore();

    // Active target ring
    ctx.save();
    const pulse = Math.sin(t * 5) * 2;
    ctx.strokeStyle = '#8888ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8888ff';
    ctx.beginPath();
    ctx.arc(targetCell.x * DEMO_GRID + DEMO_GRID/2, targetCell.y * DEMO_GRID + DEMO_GRID/2, DEMO_GRID/2 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Player snake
    ctx.save();
    state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });
    ctx.restore();

    // HUD
    ctx.fillStyle = '#6677ff';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillText('FIGURE-8 SWEEP', 10, 25);
    ctx.fillStyle = '#aaa';
    ctx.fillText('ACCURACY: 94.2%', 10, 45);
    ctx.fillText('COMBO: 23 (2.3x)', 10, 65);
    ctx.fillStyle = '#6677ff';
    ctx.fillText('HARD', 490, 25);
}

// ─── FIREWALL BREACH DEMO ───
function runBreachDemo(ctx, t, elapsed) {
    const state = demoState;
    if (!state.firewallY) {
        state.firewallY = DEMO_TILE - 1;
        state.firewallDirection = -1;
        state.tickAccum = 0;
        state.score = 0;
    }

    state.tickAccum += 16;
    if (state.tickAccum >= 400) {
        state.tickAccum = 0;
        // Firewall moves up/down
        state.firewallY += state.firewallDirection * 0.3;
        if (state.firewallY <= 10 || state.firewallY >= DEMO_TILE - 1) {
            state.firewallDirection *= -1;
        }
    }

    // Auto-move snake
    state.tickAccum += 16;
    if (state.tickAccum >= 200) {
        state.tickAccum = 0;
        // Steer away from firewall
        if (state.snake[0].y > state.firewallY + 2) state.dy = -1, state.dx = 0;
        else if (state.snake[0].y < 3) state.dy = 1, state.dx = 0;
        const h = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
        state.snake.unshift(h);
        state.snake.pop();
    }

    // Draw firewall
    const fwY = Math.floor(state.firewallY);
    ctx.save();
    const grad = ctx.createLinearGradient(0, fwY * DEMO_GRID, 0, (fwY + 1) * DEMO_GRID);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff4500';
    ctx.fillRect(0, fwY * DEMO_GRID, 600, DEMO_GRID);
    // Breach pattern
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    for (let x = 0; x < DEMO_TILE; x++) {
        if ((x + Math.floor(t * 2)) % 3 === 0) {
            ctx.fillRect(x * DEMO_GRID, fwY * DEMO_GRID, DEMO_GRID, DEMO_GRID);
        }
    }
    ctx.restore();

    // Player snake
    ctx.save();
    state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.4, 1 - (i / state.snake.length) * 0.6);
        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });
    ctx.restore();

    // Food
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(state.food.x * DEMO_GRID + 3, state.food.y * DEMO_GRID + 3, DEMO_GRID - 6, DEMO_GRID - 6, 4);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#ff4500';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillText('FIREWALL BREACH', 10, 25);
    ctx.fillStyle = '#aaa';
    ctx.fillText('PUSH BACK: ██████░░░░', 10, 45);
}

function showDemoPopup(text) {
    let popup = document.getElementById('demo-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'demo-popup';
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
            font-family: 'Orbitron', sans-serif; font-size: 2rem; font-weight: 900;
            color: #ffd700; text-shadow: 0 0 20px #ffd700; letter-spacing: 4px;
            pointer-events: none; z-index: 200;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        document.body.appendChild(popup);
    }
    popup.textContent = text;
    popup.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => { popup.style.transform = 'translate(-50%, -50%) scale(0)'; }, 1000);
}

function stopDemo() {
    if (demoAnimFrame) cancelAnimationFrame(demoAnimFrame);
    demoState = null;
    const overlay = document.getElementById('demo-overlay');
    if (overlay) overlay.style.display = 'none';
    const popup = document.getElementById('demo-popup');
    if (popup) popup.remove();
}

function playPowerUpSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
}

function drawPowerUpIndicator() {
    if (!activePowerUp) return;
    const bar = document.getElementById('powerup-bar');
    if (!bar) return;
    const remaining = Math.max(0, powerUpEndTime - Date.now());
    const pct = (remaining / activePowerUp.duration) * 100;
    bar.style.width = pct + '%';
}

// ════ CHARACTER UNLOCK HELPER ════
function unlockCharacter(charId, charName, charColor) {
    localStorage.setItem(`serpentineUnlocked${charName.replace(/[\s-]/g, '')}`, 'true');
    const charProfile = snakeProfiles.find(p => p.id === charId);
    if (charProfile) charProfile.locked = false;

    // Play character unlock cascade sound (Session 21: Audio Expansion)
    serpentineAudio.playSFX('character_unlock_cascade');

    // Celebration particle burst
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            burstParticles(Math.random() * tileCount, Math.random() * tileCount, charColor, 40);
        }, i * 60);
    }

    // Message popup
    showUnlockPopup(charName + ' UNLOCKED', charColor);
}

let unlockPopupTimeout = null;
function showUnlockPopup(text, color) {
    let popup = document.getElementById('unlock-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'unlock-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-family: 'Orbitron', sans-serif;
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: 4px;
            text-align: center;
            text-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease;
            opacity: 0;
            background: rgba(5, 5, 5, 0.85);
            padding: 20px 40px;
            border-radius: 12px;
            border: 2px solid currentColor;
            box-shadow: 0 0 30px currentColor;
        `;
        document.body.appendChild(popup);
    }

    popup.textContent = text;
    popup.style.color = color || '#ffd700';
    popup.style.borderColor = color || '#ffd700';
    popup.style.textShadow = `0 0 20px ${color || '#ffd700'}, 0 0 40px ${color || '#ffd700'}`;
    popup.style.boxShadow = `0 0 30px ${color || '#ffd700'}`;

    // Kill any pending hide
    if (unlockPopupTimeout) clearTimeout(unlockPopupTimeout);

    requestAnimationFrame(() => {
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
        popup.style.opacity = '1';
    });

    unlockPopupTimeout = setTimeout(() => {
        popup.style.transform = 'translate(-50%, -50%) scale(0)';
        popup.style.opacity = '0';
    }, 3000);
}
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

        // ════ Synthesizer Unlock: Track full song plays ════
        // A full song is 64 steps. When we wrap from 63 to 0, a song completed.
        if (currentMenuStep === 63 && !unlockedSynthesizer) {
            secretTracking.menuSongPlays++;
            if (secretTracking.menuSongPlays >= 5) {
                unlockSecretCharacter('synthesizer');
            }
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
    activePowerUp = null;
    powerUpFood = null;
    mercyAvailable = false;
    deactivatePowerUp(); // Hide power-up HUD
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
    // Play food spawn sound (Session 21: Audio Expansion)
    serpentineAudio.playSFX('food_spawn');

    // 15% chance to spawn a power-up instead of food
    powerUpFood = null;
    if (Math.random() < 0.15) {
        let puPos;
        let puOnSnake = true;
        let attempts = 0;
        while (puOnSnake && attempts < 30) {
            puPos = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            puOnSnake = snake.some(s => s.x === puPos.x && s.y === puPos.y) ||
                        (puPos.x === food.x && puPos.y === food.y);
            attempts++;
        }
        if (!puOnSnake && puPos) {
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            powerUpFood = { x: puPos.x, y: puPos.y, type };
            // Play power-up spawn sound (Session 21: Audio Expansion)
            serpentineAudio.playSFX('powerup_spawn');
        }
    }
}

// Loop controlled via requestAnimationFrame for smooth drawing
function main(currentTime) {
    window.requestAnimationFrame(main);

    // Apply performance throttling on low-end mobile devices
    if (!MobileOptimizer.shouldRenderFrame(currentTime)) return;

    // Update mobile D-pad visibility
    MobileOptimizer.updateMobileVisibility();

    // Handle Grid Warfare mode (renders and ticks internally)
    if (GridWarfare.isActive && !GridWarfare.matchOver) {
        // Grid Warfare has its own game loop, skip main draw
        return;
    }

    // Draw elements that require smooth framerates (Particles, Glow pulses)
    draw();

    if (!isPlaying || isPaused) return;

    // Handle ChronoShift mode updates
    if (ChronoShift.active) {
        const deltaTime = currentTime - lastRenderTime;
        updateChronoShift(deltaTime, currentTime);
    }

    const secondsSinceLastLogic = (currentTime - lastRenderTime) / 1000;

    // Apply speed boost power-up (×1.5 speed = shorter interval)
    let effectiveSpeed = currentSpeed;
    if (activePowerUp && activePowerUp.id === 'speed') {
        effectiveSpeed = currentSpeed / 1.5;
    }

    // Apply ChronoShift speed modifiers
    if (ChronoShift.active) {
        effectiveSpeed /= getChronoShiftSpeedModifier();
    }

    // Logic updates happen at dynamic intervals (game speed)
    if (secondsSinceLastLogic >= effectiveSpeed / 1000) {
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
        } else if (ChronoShift.active && checkChronoShiftCollision(head.x, head.y)) {
            // ChronoShift uses its own collision handling (for invincibility)
            triggerGameOver();
            return;
        } else if (!ChronoShift.active) {
            triggerGameOver();
            return;
        }
    }

    // 2. Collision Check - Self
    // 9193 (isCheater) can safely pass through its own segments
    // SHIELD and GHOST power-ups also disable self-collision
    // ChronoShift invincibility after rewind also disables self-collision
    const selfCollisionDisabled = profile.isCheater ||
                                (activePowerUp && (activePowerUp.id === 'shield' || activePowerUp.id === 'ghost')) ||
                                (ChronoShift.active && ChronoShift.invincibilityTimer > 0);
    if (!selfCollisionDisabled && (dx !== 0 || dy !== 0)) {
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                triggerGameOver();
                return;
            }
        }
    }
    
    // Move Head Forward
    snake.unshift(head);

    // ════ REPLAY SYSTEM: Record frame ════
    if (typeof ReplaySystem !== 'undefined' && isPlaying && !ReplaySystem.isReplaying) {
        ReplaySystem.recordFrame(snake, food, score, dx, dy);
    }

    // 3. Collision Check - Food
    if (head.x === food.x && head.y === food.y) {
        // Handle Breach mode food collision
        if (BreachMode.isActive) {
            handleBreachFoodCollision();
            return;
        }

        const pointsPerFood = profile.isCheater ? 90 : 10;
        const multiplier = (activePowerUp && activePowerUp.id === 'double') ? 2 : 1;
        score += pointsPerFood * multiplier;
        foodEaten++;
        scoreElement.textContent = score;

        // Challenge progress tracking
        if (typeof ChallengeManager !== 'undefined') {
            ChallengeManager.onFoodCollected(1);
        }

        // Achievement progress tracking
        if (typeof AchievementManager !== 'undefined') {
            AchievementManager.onFoodCollected();
        }

        // Reset consecutive deaths counter (survived and ate food)
        secretTracking.consecutiveDeaths = 0;

        // Double Eat power-up: grow by 2 segments
        if (activePowerUp && activePowerUp.id === 'double') {
            snake.unshift({ ...head }); // second segment at same spot (safe — head just moved here)
        }
        
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
        // ChronoShift: Suppress food spawn during fast-forward
        if (!ChronoShift.active || !ChronoShift.fastForwardActive) {
            placeFood();
        }
        
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

            // Rainbow screen flash — full-spectrum radial burst from center
            const flashOsc = audioCtx.createOscillator();
            const flashGain = audioCtx.createGain();
            flashOsc.type = 'sawtooth';
            flashOsc.frequency.value = 20;
            flashGain.gain.value = 0.4;
            flashOsc.connect(flashGain);
            flashGain.connect(audioCtx.destination);
            flashOsc.start();
            flashGain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.8, 0.3);
            flashOsc.stop(audioCtx.currentTime + 1.2);

            // Dense rainbow particle storm
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    burstParticles(Math.random() * tileCount, Math.random() * tileCount, `hsl(${Math.random() * 360}, 100%, 60%)`, 60);
                    burstParticles(Math.random() * tileCount, Math.random() * tileCount, `hsl(${Math.random() * 360}, 100%, 50%)`, 40);
                }, i * 80);
            }

            // Message popup
            showUnlockPopup('CHROMATIC PUNCH UNLOCKED', '#ff0055');
        }

        // ════ CHARACTERS 11-20: Food Milestone Unlocks ════
        // Crimson Fang - 30 food
        if (foodEaten >= 30 && localStorage.getItem('serpentineUnlockedCrimsonFang') !== 'true') {
            unlockCharacter('crimson_fang', 'CRIMSON FANG', '#8B0000');
        }
        // Cobalt Grid - 40 food
        if (foodEaten >= 40 && localStorage.getItem('serpentineUnlockedCobaltGrid') !== 'true') {
            unlockCharacter('cobalt_grid', 'COBALT GRID', '#0047AB');
        }
        // Emerald Core - 50 food
        if (foodEaten >= 50 && localStorage.getItem('serpentineUnlockedEmeraldCore') !== 'true') {
            unlockCharacter('emerald_core', 'EMERALD CORE', '#00FF00');
        }
        // Void Star - 60 food
        if (foodEaten >= 60 && localStorage.getItem('serpentineUnlockedVoidStar') !== 'true') {
            unlockCharacter('void_star', 'VOID STAR', '#9400D3');
        }
        // Plasma Hydra - 70 food
        if (foodEaten >= 70 && localStorage.getItem('serpentineUnlockedPlasmaHydra') !== 'true') {
            unlockCharacter('plasma_hydra', 'PLASMA HYDRA', '#FF4500');
        }
        // Monochrome - 80 food
        if (foodEaten >= 80 && localStorage.getItem('serpentineUnlockedMonochrome') !== 'true') {
            unlockCharacter('monochrome', 'MONOCHROME', '#FFFFFF');
        }
        // Molten Core - 90 food
        if (foodEaten >= 90 && localStorage.getItem('serpentineUnlockedMoltenCore') !== 'true') {
            unlockCharacter('molten_core', 'MOLTEN CORE', '#FF8C00');
        }
        // Titanium Coil - 100+ food
        if (foodEaten >= 100 && localStorage.getItem('serpentineUnlockedTitaniumCoil') !== 'true') {
            unlockCharacter('titanium_coil', 'TITANIUM COIL', '#C0C0C0');
        }
    }

    // Power-Up collision check
    if (powerUpFood && head.x === powerUpFood.x && head.y === powerUpFood.y) {
        activatePowerUp(powerUpFood.type);
        playPowerUpSound();
        burstParticles(powerUpFood.x, powerUpFood.y, powerUpFood.type.color, 25);
        powerUpFood = null;
    }

    // Time Orb collision check (ChronoShift mode)
    if (ChronoShift.active) {
        checkTimeOrbCollision(head.x, head.y);
    }

    // Expire power-up if time is up
    if (activePowerUp && Date.now() > powerUpEndTime) {
        deactivatePowerUp();
    }

    // Push current state to ChronoShift history buffer
    if (ChronoShift.active) {
        pushToHistoryBuffer();
    }

    // Pop Tail if we didn't eat
    // 9193 never grows past 9
    if (profile.isCheater && snake.length > 9) {
        snake.pop();
    } else if (!profile.isCheater) {
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
    // Draw body segments first (i=50 down to 1), then head on top (i=0)
    for (let i = 50; i > 0; i--) {
        const theta = previewAngle - (i * 0.08);
        const x = cx + Math.sin(theta) * radius * 1.8;
        const y = cy + Math.sin(theta * 2) * (radius * 0.9);

        ctx.save();
        const opacity = Math.max(0.05, 1 - (i / 50) * 0.95);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = colors.snakeBody;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.snakeGlow;

        ctx.beginPath();
        const size = gridSize - 4;
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw head last so it's always on top
    ctx.save();
    ctx.fillStyle = colors.snakeHead;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffffff';
    const headTheta = previewAngle;
    const headX = cx + Math.sin(headTheta) * radius * 1.8;
    const headY = cy + Math.sin(headTheta * 2) * (radius * 0.9);
    ctx.beginPath();
    ctx.arc(headX, headY, gridSize/2, 0, Math.PI * 2);
    ctx.fill();
    // Draw eyes on head (with approximate direction from theta derivative)
    const nextTheta = previewAngle - 0.08;
    const nextHeadX = cx + Math.sin(nextTheta) * radius * 1.8;
    const nextHeadY = cy + Math.sin(nextTheta * 2) * (radius * 0.9);
    drawPreviewEyes(headX, headY, nextHeadX, nextHeadY);
    ctx.restore();
}

// Main rendering pass
function draw() {
    // Handle special modes rendering
    if (BreachMode.isActive) {
        const time = Date.now();
        drawBreachFirewall(time);
        drawStandardSnake();
        return;
    }

    if (NeuralFit.isActive) {
        const time = Date.now();
        drawNeuralFit(time);
        return;
    }

    // Fill Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ChronoShift mode: Draw temporal effects first (background layer)
    if (ChronoShift.active) {
        const time = Date.now();
        drawChronoShift(ctx, time);
    }

    // Character shifting effect (Spectrum etc.)
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

    drawGrid();
    drawPowerUpIndicator();

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

    // --- Draw Power-Up Food ---
    if (powerUpFood) {
        const pu = powerUpFood;
        const pulse = Math.sin(Date.now() / 120) * 2;
        const size = gridSize - 4 + pulse;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = pu.type.glow;
        ctx.fillStyle = pu.type.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(pu.x * gridSize + gridSize / 2, pu.y * gridSize + gridSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(pu.x * gridSize + gridSize / 2, pu.y * gridSize + gridSize / 2, size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // --- Draw Snake ---
    // Reverse loop: Draw tail-to-head so the Head renders ON TOP of the body segments
    const profileForDraw = snakeProfiles[selectedProfileIndex];
    for (let index = snake.length - 1; index >= 0; index--) {
        const segment = snake[index];
        ctx.save();
        const isHead = index === 0;
        const isTail = index === snake.length - 1;

        if (profileForDraw.id === 'princess') {
            drawPrincess(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'arthropod') {
            drawArthropod(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'dragon') {
            drawDragon(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'nokia_nostalgia') {
            drawNokiaNostalgia(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'missing_no') {
            drawMissingNo(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'dogecoin') {
            drawDogecoin(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'binary_constrictor') {
            drawBinaryConstrictor(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'the_dev') {
            drawTheDev(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'error_404') {
            drawError404(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'blue_screen') {
            drawBlueScreen(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'scanline_samurai') {
            drawScanlineSamurai(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'synthesizer') {
            drawSynthesizer(segment, index, isHead, isTail);
        // ════ CHARACTERS 11-20: Food Milestone Unlocks ════
        } else if (profileForDraw.id === 'crimson_fang') {
            drawCrimsonFang(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'cobalt_grid') {
            drawCobaltGrid(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'emerald_core') {
            drawEmeraldCore(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'void_star') {
            drawVoidStar(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'plasma_hydra') {
            drawPlasmaHydra(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'monochrome') {
            drawMonochrome(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'molten_core') {
            drawMoltenCore(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'titanium_coil') {
            drawTitaniumCoil(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'quicksilver') {
            drawQuicksilver(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'photon_dash') {
            drawPhotonDash(segment, index, isHead, isTail);
        } else {
            if (activePowerUp && activePowerUp.id === 'ghost') {
                ctx.globalAlpha = 0.45;
            }
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

// Draw standard snake for Breach mode
function drawStandardSnake() {
    const profileForDraw = snakeProfiles[selectedProfileIndex];
    for (let index = snake.length - 1; index >= 0; index--) {
        const segment = snake[index];
        ctx.save();
        const isHead = index === 0;
        const isTail = index === snake.length - 1;

        if (profileForDraw.id === 'princess') {
            drawPrincess(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'arthropod') {
            drawArthropod(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'dragon') {
            drawDragon(segment, index, isHead, isTail);
        // ════ CHARACTERS 11-20: Food Milestone Unlocks ════
        } else if (profileForDraw.id === 'crimson_fang') {
            drawCrimsonFang(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'cobalt_grid') {
            drawCobaltGrid(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'emerald_core') {
            drawEmeraldCore(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'void_star') {
            drawVoidStar(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'plasma_hydra') {
            drawPlasmaHydra(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'monochrome') {
            drawMonochrome(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'molten_core') {
            drawMoltenCore(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'titanium_coil') {
            drawTitaniumCoil(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'quicksilver') {
            drawQuicksilver(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'photon_dash') {
            drawPhotonDash(segment, index, isHead, isTail);
        // ════ CHARACTERS 21-30: Secret Unlocks ════
        } else if (profileForDraw.id === 'nokia_nostalgia') {
            drawNokiaNostalgia(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'missing_no') {
            drawMissingNo(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'dogecoin') {
            drawDogecoin(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'binary_constrictor') {
            drawBinaryConstrictor(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'the_dev') {
            drawTheDev(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'error_404') {
            drawError404(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'blue_screen') {
            drawBlueScreen(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'scanline_samurai') {
            drawScanlineSamurai(segment, index, isHead, isTail);
        } else if (profileForDraw.id === 'synthesizer') {
            drawSynthesizer(segment, index, isHead, isTail);
        } else {
            if (activePowerUp && activePowerUp.id === 'ghost') {
                ctx.globalAlpha = 0.45;
            }
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
    VENOMOUS: { shell: '#1B5E00', segment: '#39FF14', legs: '#00FF00', eye: '#FF0000', glow: 'rgba(57,255,20,0.5)', mandible: '#7CFC00', antenna: '#ADFF2F', effect: null },
    INFERNO:  { shell: '#8B0000', segment: '#FF4500', legs: '#FF6600', eye: '#FFD700', glow: 'rgba(255,69,0,0.5)', mandible: '#FF8C00', antenna: '#FF4500', effect: 'fireTrail' },
    PHANTOM:  { shell: '#2E0854', segment: '#9B59B6', legs: '#C39BDB', eye: '#E0E0FF', glow: 'rgba(155,89,182,0.4)', mandible: '#D2B4DE', antenna: '#BB8FCE', effect: 'transparency' }
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

/* --- NOKIA NOSTALGIA: LCD Pixel Grid Effect --- */
function drawNokiaNostalgia(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    const lcdGreen = '#84B500';
    const lcdDark = '#3D4F00';
    ctx.fillStyle = lcdGreen;
    ctx.shadowBlur = 0;
    const pixelSize = gridSize / 4;
    const startX = seg.x * gridSize + 1;
    const startY = seg.y * gridSize + 1;
    for (let px = 0; px < 4; px++) {
        for (let py = 0; py < 4; py++) {
            if (Math.random() > 0.15) {
                ctx.fillRect(startX + px * pixelSize, startY + py * pixelSize, pixelSize - 1, pixelSize - 1);
            }
        }
    }
    ctx.shadowBlur = 5;
    ctx.shadowColor = lcdGreen;
    ctx.fillStyle = lcdGreen;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, gridSize / 3, 0, Math.PI * 2);
    ctx.fill();
    if (isHead) {
        ctx.fillStyle = lcdDark;
        ctx.globalAlpha = 1;
        ctx.fillRect(cx - 4, cy - 3, 3, 3);
        ctx.fillRect(cx + 1, cy - 3, 3, 3);
    }
    ctx.restore();
}

/* --- MISSINGNO: Glitchy Broken Sprite --- */
function drawMissingNo(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    const glitchColors = ['#FF00FF', '#00FFFF', '#FF0000', '#00FF00', '#FFFF00', '#FF00AA', '#00FFAA'];
    const color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
    const glitchX = (Math.random() - 0.5) * 10;
    const glitchY = (Math.random() - 0.5) * 10;
    ctx.save();
    ctx.translate(glitchX, glitchY);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8 + Math.random() * 0.2;
    ctx.fillRect(seg.x * gridSize + Math.random() * 4, seg.y * gridSize + Math.random() * 4, gridSize - 2, gridSize - 2);
    ctx.fillStyle = '#000000';
    for (let n = 0; n < 8; n++) {
        ctx.fillRect(seg.x * gridSize + Math.random() * gridSize, seg.y * gridSize + Math.random() * gridSize, 2, 2);
    }
    ctx.restore();
    if (Math.random() > 0.9) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
        ctx.fillRect(seg.x * gridSize - 20, cy + (Math.random() - 0.5) * gridSize, gridSize + 40, 2);
        ctx.restore();
    }
    if (isHead) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx - 5 + Math.random() * 3, cy - 4 + Math.random() * 3, 4, 4);
        ctx.fillRect(cx + 1 + Math.random() * 3, cy - 4 + Math.random() * 3, 4, 4);
    }
    ctx.restore();
}

/* --- DOGECOIN: Shiba Gold with Comic Sans --- */
function drawDogecoin(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.fillStyle = '#D4A017';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#D4A017';
    ctx.beginPath();
    ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 4);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#8B6914';
    ctx.font = '8px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (ctx.fillText) ctx.fillText('Ð', cx, cy);
    if (isHead) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx - 4, cy - 3, 3, 3);
        ctx.fillRect(cx + 1, cy - 3, 3, 3);
        ctx.fillRect(cx - 1, cy + 1, 3, 2);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cx - 6, cy - 5, 3, 2);
        ctx.fillRect(cx + 3, cy - 5, 3, 2);
    }
    ctx.restore();
}

/* --- BINARY CONSTRICTOR: Matrix Trail --- */
function drawBinaryConstrictor(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.fillStyle = '#00FF00';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00FF00';
    ctx.beginPath();
    ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 3);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#00AA00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const binaryDigit = ((i * 7 + seg.x * 3 + seg.y * 5) % 2).toString();
    if (ctx.fillText) ctx.fillText(binaryDigit, cx, cy);
    if (isTail) {
        ctx.fillStyle = '#00AA00';
        ctx.globalAlpha = 0.4;
        ctx.font = 'bold 10px monospace';
        const trailOffsets = [{ x: -gridSize, y: 0 }, { x: -gridSize * 2, y: 0 }, { x: -gridSize * 3, y: 0 }];
        trailOffsets.forEach((offset, idx) => {
            const trailX = seg.x * gridSize + gridSize / 2 + offset.x;
            const trailY = seg.y * gridSize + gridSize / 2 + offset.y;
            const bit = ((Date.now() / 500 + idx + i) % 2).toString();
            ctx.globalAlpha = 0.3 - idx * 0.1;
            if (ctx.fillText) ctx.fillText(bit, trailX, trailY);
        });
    }
    if (isHead) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#00AA00';
        ctx.shadowBlur = 15;
        ctx.fillRect(cx - 4, cy - 3, 4, 4);
        ctx.fillRect(cx + 0, cy - 3, 4, 4);
    }
    ctx.restore();
}

/* --- THE DEV: Crown Jewel with Golden Particles --- */
function drawTheDev(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    if (Math.random() > 0.95 && typeof burstParticles === 'function') {
        burstParticles(seg.x, seg.y, '#FFD700', 1);
    }
    const t = i / Math.max(snake.length - 1, 1);
    const r = Math.floor(255 - t * (255 - 148));
    const g = Math.floor(215 - t * (215 - 0));
    const b = Math.floor(0 + t * (0 - 211));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.roundRect(seg.x * gridSize + 2, seg.y * gridSize + 2, gridSize - 4, gridSize - 4, 5);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.5;
    const sparkleAngle = (Date.now() / 200 + i) % (Math.PI * 2);
    const sparkleRadius = 3;
    const sx = cx + Math.cos(sparkleAngle) * sparkleRadius;
    const sy = cy + Math.sin(sparkleAngle) * sparkleRadius;
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
    if (isHead) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#FFD700';
        ctx.fillRect(cx - 4, cy - 3, 5, 5);
        ctx.fillRect(cx - 1, cy - 3, 5, 5);
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        const crownY = seg.y * gridSize - 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, crownY + 8);
        ctx.lineTo(cx - 6, crownY);
        ctx.lineTo(cx - 2, crownY + 5);
        ctx.lineTo(cx + 2, crownY);
        ctx.lineTo(cx + 6, crownY + 5);
        ctx.lineTo(cx + 8, crownY);
        ctx.lineTo(cx + 10, crownY + 8);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

/* --- ERROR 404: Flickers in and out --- */
function drawError404(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.globalAlpha = Math.random() > 0.3 ? (0.3 + Math.random() * 0.5) : 0;
    ctx.fillStyle = '#888888';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#AAAAAA';
    ctx.beginPath();
    ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 4);
    ctx.fill();
    if (Math.random() > 0.7) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#AAAAAA';
        ctx.font = 'bold 6px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (ctx.fillText) ctx.fillText('404', cx, cy);
    }
    if (isHead) {
        const blink = Math.random() > 0.9;
        ctx.globalAlpha = blink ? 0 : 1;
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(cx - 4, cy - 3, 4, 3);
        ctx.fillRect(cx + 0, cy - 3, 4, 3);
        if (Math.random() > 0.95) {
            ctx.globalAlpha = 0.6;
            ctx.font = 'bold 8px monospace';
            if (ctx.fillText) ctx.fillText('NOT FOUND', cx, cy - gridSize);
        }
    }
    ctx.restore();
}

/* --- BLUE SCREEN: BSOD Effect --- */
function drawBlueScreen(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.fillStyle = '#0000AA';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0000AA';
    ctx.beginPath();
    ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (isHead) {
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 4);
        ctx.lineTo(cx - 1, cy);
        ctx.moveTo(cx - 1, cy - 4);
        ctx.lineTo(cx - 5, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy - 4);
        ctx.lineTo(cx + 5, cy);
        ctx.moveTo(cx + 5, cy - 4);
        ctx.lineTo(cx + 1, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 3, 0, Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}

/* --- SCANLINE SAMURAI: Katana Tail --- */
function drawScanlineSamurai(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.fillStyle = '#FF0000';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(seg.x * gridSize + gridSize / 2, seg.y * gridSize);
    ctx.lineTo(seg.x * gridSize + gridSize, seg.y * gridSize + gridSize);
    ctx.lineTo(seg.x * gridSize, seg.y * gridSize + gridSize);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#00FF00';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    if (isHead) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#00FF00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 2);
        ctx.lineTo(cx - 2, cy + 2);
        ctx.lineTo(cx - 5, cy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 2);
        ctx.lineTo(cx + 2, cy + 2);
        ctx.lineTo(cx + 5, cy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(cx - 6, cy - 5, 12, 2);
    }
    if (isTail) {
        ctx.fillStyle = '#C0C0C0';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#C0C0C0';
        ctx.globalAlpha = 1;
        let tailAngle = 0;
        if (snake.length > 1) {
            const prev = snake[snake.length - 2];
            tailAngle = Math.atan2(cy - (prev.y * gridSize + gridSize / 2), cx - (prev.x * gridSize + gridSize / 2));
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tailAngle);
        ctx.beginPath();
        ctx.moveTo(-gridSize, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(gridSize * 1.5, 0);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(-gridSize, -2, gridSize * 0.5, 4);
        ctx.restore();
    }
    ctx.restore();
}

/* --- SYNTHESIZER: Audio-Reactive Body --- */
function drawSynthesizer(seg, i, isHead, isTail) {
    const cx = seg.x * gridSize + gridSize / 2;
    const cy = seg.y * gridSize + gridSize / 2;
    ctx.save();
    const beatPhase = (currentMenuStep || 0) % 64;
    const pulse = Math.sin(beatPhase * Math.PI / 16) * 0.5 + 0.5;
    const hue = (beatPhase * 360 / 64 + i * 15) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 10 + pulse * 15;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    const waveOffset = Math.sin(Date.now() / 200 + i * 0.5) * 2;
    const size = gridSize - 2 + waveOffset;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size / 2, size / 2 * (0.8 + pulse * 0.2), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px serif';
    ctx.textAlign = 'center';
    const noteSymbols = ['♪', '♫', '♬', '♩'];
    const noteIdx = (Math.floor(Date.now() / 500) + i) % noteSymbols.length;
    if (ctx.fillText) ctx.fillText(noteSymbols[noteIdx], cx, cy);
    if (isHead) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFFFFF';
        const eyeSize = 4 + pulse * 2;
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 2, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 2, eyeSize / 2, 0, Math.PI * 2);
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

function drawPreviewEyes(x, y, nextX, nextY) {
    // Uses pixel-space coordinates (not grid-space like drawEyes)
    ctx.fillStyle = colors.bg;
    ctx.shadowBlur = 0;
    const eyeSize = 2;
    const offset = 4;

    const dDx = nextX - x;
    const dDy = nextY - y;
    const len = Math.sqrt(dDx * dDx + dDy * dDy) || 1;
    const nDx = dDx / len;
    const nDy = dDy / len;

    let eye1X, eye1Y, eye2X, eye2Y;
    if (nDx > 0.5) {       eye1X = x + 3;  eye1Y = y - offset; eye2X = x + 3;  eye2Y = y + offset; }
    else if (nDx < -0.5) { eye1X = x - 3;  eye1Y = y - offset; eye2X = x - 3;  eye2Y = y + offset; }
    else if (nDy > 0.5) {  eye1X = x - offset; eye1Y = y + 3;  eye2X = x + offset; eye2Y = y + 3; }
    else                  { eye1X = x - offset; eye1Y = y - 3;  eye2X = x + offset; eye2Y = y - 3; }

    ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2); ctx.fill();
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

    // Track run start time for speed-based unlocks
    standardRunStartTime = Date.now();

    // Start speedrun tracking for Characters 31-40
    startSpeedrunTracking(currentDifficultyLabel, 'standard');

    // Start achievement tracking for this run
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.startRun('standard');
    }

    initGrid();
    lastRenderTime = performance.now();
    startMusic();
}

function triggerGameOver() {
    isPlaying = false;
    isPaused = false;
    stopMusic();

    // ChronoShift: End run and calculate bonuses before death sound
    if (ChronoShift.active) {
        endChronoShiftRun();
    }

    playDeathSound();

    // ════ Secret Character Unlock Tracking ════
    // MissingNo: 500 consecutive deaths
    secretTracking.consecutiveDeaths++;
    if (!unlockedMissingNo && secretTracking.consecutiveDeaths >= 500) {
        unlockSecretCharacter('missing_no');
    }
    // Blue Screen: 100 total deaths
    secretTracking.totalDeaths++;
    if (!unlockedBlueScreen && secretTracking.totalDeaths >= 100) {
        unlockSecretCharacter('blue_screen');
    }

    // Resume menu atmosphere after a short delay (post-explosion)
    setTimeout(() => {
        if (!isPlaying) startMenuMusic();
    }, 3000);

    // Shake effect (respects reduced motion and screen shake settings)
    if (settings.screenShake && !settings.reducedMotion) {
        document.querySelector('.arcade-machine').classList.add('shake');
    }

    // Death Explosion on the head (respects particle settings)
    const particleCount = settings.particles === 'OFF' ? 0 : (settings.particles === 'LOW' ? 20 : (settings.particles === 'MEDIUM' ? 40 : 60));
    if (particleCount > 0) {
        burstParticles(snake[0].x, snake[0].y, colors.snakeHead, particleCount);
    }

    // Chain reaction on the tail
    if (particleCount > 0) {
        snake.forEach((segment, index) => {
            if (index > 0) {
                setTimeout(() => {
                    burstParticles(segment.x, segment.y, colors.snakeBody, Math.ceil(particleCount / 4));
                }, index * 40);
            }
        });
    }
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('serpentineHighScore', highScore);
        highScoreElement.textContent = highScore;
        scoreElement.style.color = colors.accent;

        for(let i=0; i<3; i++) {
           setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, colors.accent, 30), i * 300);
        }
    } else {
        scoreElement.style.color = colors.snakeBody;
    }

    finalScoreElement.textContent = score;

    // Mercy system: show continue button if score > 0
    mercyAvailable = score > 0;
    continueBtn.style.display = mercyAvailable ? 'block' : 'none';

    // Accumulate into the Bank
    bank += score;
    localStorage.setItem('serpentineBank', bank);

    // Record stats via SaveManager (non-blocking auto-save after game over)
    if (typeof saveManager !== 'undefined' && saveManager.profile) {
        saveManager.addToBank(score);
        saveManager.recordGameEnd({
            score,
            foodEaten,
            snakeLength: snake.length,
            tickSpeed: currentSpeed,
            characterId: snakeProfiles[selectedProfileIndex]?.id || 'neon',
            mode: ChronoShift.active ? 'chronoshift' : 'standard'
        });
    }

    // Challenge progress tracking
    if (typeof ChallengeManager !== 'undefined') {
        ChallengeManager.onGameEnded(ChronoShift.active ? 'chronoshift' : 'standard', score, foodEaten, snake.length, currentDifficultyLabel);
        ChallengeManager.onFoodCollected(foodEaten);
        ChallengeManager.onScoreReached(score, ChronoShift.active ? 'chronoshift' : 'standard');
    }

    // Achievement progress tracking
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.onGameEnded(ChronoShift.active ? 'chronoshift' : 'standard', score, currentDifficultyLabel);
    }

    // Season points tracking for meta-progression
    if (score > 0) {
        addSeasonPoints(score);
        checkTitleUnlocks(score);
    }

    // ════ REPLAY SYSTEM: Save run and show copy button ════
    if (typeof ReplaySystem !== 'undefined' && ReplaySystem.currentRun) {
        const replayCode = ReplaySystem.saveRun(score);
        if (replayCode) {
            // Show copy replay button on game over screen
            const container = document.getElementById('replay-code-container');
            if (container) {
                container.innerHTML = `
                    <button id="btn-copy-replay" class="btn-menu btn-secondary" style="border-color: #ffd700; color: #ffd700; width: 100%; font-size: 0.85rem; padding: 10px;">
                        📋 COPY REPLAY CODE
                    </button>
                `;
                document.getElementById('btn-copy-replay')?.addEventListener('click', () => {
                    navigator.clipboard.writeText(replayCode).then(() => {
                        // Show success feedback
                        const btn = document.getElementById('btn-copy-replay');
                        if (btn) {
                            btn.textContent = '✓ COPIED!';
                            setTimeout(() => {
                                if (btn) btn.textContent = '📋 COPY REPLAY CODE';
                            }, 2000);
                        }
                    }).catch(() => {
                        // Fallback: show in prompt
                        prompt('Share this replay code:', replayCode);
                    });
                });
            }

            // Store code globally for share functionality
            window.currentReplayCode = replayCode;
        }
    }

    // ════ TIME-BASED UNLOCK CHECKS (Quicksilver, Photon Dash) ════
    const runDuration = (Date.now() - standardRunStartTime) / 1000; // in seconds
    // Quicksilver - Complete under 60s
    if (runDuration < 60 && localStorage.getItem('serpentineUnlockedQuicksilver') !== 'true') {
        unlockCharacter('quicksilver', 'QUICKSILVER', '#C0C0C0');
    }
    // Photon Dash - Complete under 45s
    if (runDuration < 45 && localStorage.getItem('serpentineUnlockedPhotonDash') !== 'true') {
        unlockCharacter('photon_dash', 'PHOTON DASH', '#FFFFFF');
    }

    // ════ CHARACTER 31-40 SPEEDRUN UNLOCKS ════
    // Mach Mach: Complete Insane under 90s, Sonic Boom: Complete Hard under 60s
    checkSpeedrunUnlocks(true, runDuration);

    // ════ SNAKE LENGTH UNLOCKS (Juggernaut) ════
    checkSnakeLengthUnlocks(snake.length);

    // ════ VARIANT UNLOCKS (based on games played as parent) ════
    const currentChar = snakeProfiles[selectedProfileIndex];
    if (currentChar && currentChar.isVariant) {
        // Track games as variant for parent unlock progression
        checkVariantUnlocks(currentChar.parentId, 1);
    } else if (currentChar) {
        // Track games as parent for variant unlocks
        checkVariantUnlocks(currentChar.id, 1);
    }

    // Check if this score qualifies for leaderboard (use ChronoShift-specific leaderboard if active)
    const profile = snakeProfiles[selectedProfileIndex];
    const lbDifficulty = currentDifficultyLabel;
    const isChronoLB = ChronoShift.active;

    setTimeout(() => {
        if (isHighScore(lbDifficulty, score)) {
            if (profile.isCheater) {
                // 9193 auto-submits as CTR in yellow
                addHighScore(lbDifficulty, 'CTR', score, true);
                gameOverScreen.classList.remove('hidden');
            } else {
                // Show initials entry
                isEnteringInitials = true;
                initialsChars = [0, 0, 0];
                initialsSlot = 0;
                pendingHighScoreDiff = lbDifficulty;
                pendingHighScoreValue = score;
                pendingHighScoreIsChrono = isChronoLB;
                updateInitialsDisplay();
                document.getElementById('initials-score').textContent = score;
                initialsScreen.classList.remove('hidden');
            }
        } else {
            gameOverScreen.classList.remove('hidden');
        }
    }, 1500);
}

function useMercy() {
    if (!mercyAvailable) return;
    // Halve the score
    score = Math.floor(score / 2);
    scoreElement.textContent = score;
    mercyAvailable = false;
    continueBtn.style.display = 'none';

    // Deactivate any active power-up
    deactivatePowerUp();

    // ChronoShift: Reset temporal abilities on mercy
    if (ChronoShift.active) {
        ChronoShift.slowMoActive = false;
        ChronoShift.fastForwardActive = false;
        ChronoShift.rewindInProgress = false;
        ChronoShift.historyBuffer = []; // Clear history on mercy
        ChronoShift.invincibilityTimer = 500; // Brief invincibility
        ChronoShift.survivalBonusTimer = 0;
        ChronoShift.survivalBonusAwarded = true;
        updateChronoHUD();
    }

    // Reset snake to starting length (3 segments), keep head position
    const headX = snake[0].x;
    const headY = snake[0].y;
    snake = [{ x: headX, y: headY }];
    // Re-add 2 body segments ahead in the current direction
    for (let i = 0; i < 2; i++) {
        snake.push({ x: headX - dx * (i + 1), y: headY - dy * (i + 1) });
    }

    // Reset speed to base difficulty
    currentSpeed = currentDifficultySpeed;

    // Play mercy activate sound (Session 21: Audio Expansion)
    serpentineAudio.playSFX('mercy_activate');

    // Achievement tracking: track mercy usage
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.onMercyUsed();
    }

    // Resume gameplay
    hideAllMenus();
    isPlaying = true;
    isPaused = false;
    lastRenderTime = performance.now();
    startMusic();
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
    addHighScore(pendingHighScoreDiff, initials, pendingHighScoreValue, false, pendingHighScoreIsChrono);
    isEnteringInitials = false;
    hideAllMenus();
    gameOverScreen.classList.remove('hidden');
}

function markShopItemLoaded(labelEl, btnEl, labelText) {
    labelEl.textContent = labelText;
    btnEl.textContent = "LOADED";
    btnEl.style.opacity = '0.5';
    btnEl.disabled = true;
    btnEl.classList.add('btn-secondary');
}

function updateShopUI() {
    const bankIds = ['shop-bank-main', 'shop-bank-snakes', 'shop-bank-modes', 'shop-bank-other'];
    bankIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = bank.toLocaleString();
    });

    if (bought9193Hint) {
        markShopItemLoaded(
            document.getElementById('label-9193'),
            document.getElementById('btn-buy-9193'),
            "EXPLOIT: Main Menu, 1-2-3-4-5-6-7-8-0"
        );
    }

    if (boughtMasterHint) {
        markShopItemLoaded(
            document.getElementById('label-master'),
            document.getElementById('btn-buy-master'),
            "RITUAL: 9193 selected, Main Menu, HOLD 9 FOR 9 SECONDS"
        );
    }

    if (unlockedPrincess) {
        markShopItemLoaded(
            document.getElementById('label-princess'),
            document.getElementById('btn-buy-princess'),
            "PRINCESS: DECRYPTED"
        );
    }

    if (unlockedArthropod) {
        markShopItemLoaded(
            document.getElementById('label-arthropod'),
            document.getElementById('btn-buy-arthropod'),
            "ARTHROPOD: DECRYPTED"
        );
    }

    if (unlockedDragon) {
        markShopItemLoaded(
            document.getElementById('label-dragon'),
            document.getElementById('btn-buy-dragon'),
            "INFERNAL WYRM: DECRYPTED"
        );
    }
}

function buyItem(id, cost, successCallback) {
    if (bank >= cost) {
        bank -= cost;
        localStorage.setItem('serpentineBank', bank);
        successCallback();
        updateShopUI();
        playUnlockSound();

        // Record shop purchase in SaveManager v2
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.recordShopPurchase(id, cost);
        }
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

// ============================================================================
// SETTINGS SYSTEM v1.0.0
// ============================================================================

// Default Settings
const DEFAULT_SETTINGS = {
    musicVolume: 40,
    sfxVolume: 50,
    muteOnFocus: false,
    scanlines: true,
    screenShake: true,
    particles: 'HIGH',
    fullscreen: false,
    batterySaver: false,
    keyboardScheme: 'WASD',
    touchControls: true,
    swipeSensitivity: 'MEDIUM',
    keyBindings: {
        UP: ['ArrowUp', 'w', 'W'],
        DOWN: ['ArrowDown', 's', 'S'],
        LEFT: ['ArrowLeft', 'a', 'A'],
        RIGHT: ['ArrowRight', 'd', 'D'],
        PAUSE: ['Escape']
    },
    colorBlindMode: 'NONE',
    highContrast: false,
    screenReader: false,
    reducedMotion: false
};

function loadSettings() {
    try {
        const stored = localStorage.getItem('serpentineSettings');
        if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) { console.warn('Settings load failed:', e); }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings() {
    try { localStorage.setItem('serpentineSettings', JSON.stringify(settings)); }
    catch (e) { console.warn('Settings save failed:', e); }
}

let settings = loadSettings();

function announceToScreenReader(msg) {
    const a = document.getElementById('sr-announcer');
    if (a) { a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 50); }
}

// Color Blind Filters
const CB_FILTERS = {
    NONE: null,
    PROTANOPIA: `<feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>`,
    DEUTERANOPIA: `<feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>`,
    TRITANOPIA: `<feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>`
};

function applyColorBlindFilter(mode) {
    const existing = document.getElementById('colorblind-filter-svg');
    if (existing) existing.remove();
    if (mode === 'NONE' || !CB_FILTERS[mode]) { canvas.style.filter = ''; return; }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'colorblind-filter-svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;');
    svg.innerHTML = `<defs><filter id="colorblind-filter">${CB_FILTERS[mode]}</filter></defs>`;
    document.body.appendChild(svg);
    canvas.style.filter = 'url(#colorblind-filter)';
}

function applyReducedMotion(enabled) {
    if (enabled) {
        document.querySelector('.arcade-machine')?.classList.remove('shake');
        document.body.classList.add('reduced-motion');
    } else {
        document.body.classList.remove('reduced-motion');
    }
}

function applyHighContrast(enabled) {
    document.body.classList.toggle('high-contrast', enabled);
}

function applyScanlines(enabled) {
    const w = document.querySelector('.canvas-wrapper');
    if (w) w.classList.toggle('no-scanlines', !enabled);
}

function applyBatterySaver(enabled) {
    document.body.classList.toggle('battery-saver', enabled);
    if (enabled) {
        MobileOptimizer.maxParticles = 30;
        MobileOptimizer.targetFPS = 30;
    } else {
        MobileOptimizer.maxParticles = MobileOptimizer.isLowEnd ? 50 : 200;
        MobileOptimizer.targetFPS = 60;
    }
}

// Keyboard Scheme Application - updates key bindings based on selected scheme
function applyKeyboardScheme(scheme) {
    switch (scheme) {
        case 'WASD':
            settings.keyBindings = {
                UP: ['ArrowUp', 'w', 'W'],
                DOWN: ['ArrowDown', 's', 'S'],
                LEFT: ['ArrowLeft', 'a', 'A'],
                RIGHT: ['ArrowRight', 'd', 'D'],
                PAUSE: ['Escape']
            };
            break;
        case 'ARROWS':
            settings.keyBindings = {
                UP: ['ArrowUp'],
                DOWN: ['ArrowDown'],
                LEFT: ['ArrowLeft'],
                RIGHT: ['ArrowRight'],
                PAUSE: ['Escape']
            };
            break;
        case 'CUSTOM':
            // CUSTOM - keep existing bindings, user can remap
            break;
    }
    saveSettings();
}

// Swipe Sensitivity - updates the deadzone based on sensitivity
function applySwipeSensitivity(sensitivity) {
    switch (sensitivity) {
        case 'LOW': MobileOptimizer.touchSwipeDeadzone = 50; break;
        case 'MEDIUM': MobileOptimizer.touchSwipeDeadzone = 30; break;
        case 'HIGH': MobileOptimizer.touchSwipeDeadzone = 15; break;
        default: MobileOptimizer.touchSwipeDeadzone = 30;
    }
    saveSettings();
}

// Get action for a key code - checks against current keyBindings
function getActionForKey(keyCode) {
    for (const [action, keys] of Object.entries(settings.keyBindings)) {
        if (keys.includes(keyCode)) {
            return action;
        }
    }
    return null;
}

// Update input handling to use dynamic key bindings
function updateInputHandlingForScheme() {
    // This will be called to process direction changes using keyBindings
}

function applySettingChange(setting, value) {
    switch (setting) {
        case 'scanlines': applyScanlines(value); break;
        case 'colorBlindMode': applyColorBlindFilter(value); break;
        case 'highContrast': applyHighContrast(value); break;
        case 'reducedMotion': applyReducedMotion(value); break;
        case 'fullscreen':
            if (value) { (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullScreen)?.call(document.documentElement); }
            else { (document.exitFullscreen || document.webkitCancelFullScreen)?.call(document); }
            break;
        case 'batterySaver': applyBatterySaver(value); break;
        case 'sfxVolume': serpentineAudio.setSFXVolume(value); break;
        case 'musicVolume': serpentineAudio.setMusicVolume(value); break;
        case 'keyboardScheme': applyKeyboardScheme(value); break;
        case 'swipeSensitivity': applySwipeSensitivity(value); break;
    }
}

function initSettingsUI() {
    document.querySelectorAll('.settings-toggle').forEach(btn => {
        const v = settings[btn.dataset.setting];
        btn.dataset.value = String(v);
        btn.textContent = v ? 'ON' : 'OFF';
    });
    document.querySelectorAll('.settings-cycle').forEach(btn => {
        const vals = JSON.parse(btn.dataset.values || '[]');
        const sv = settings[btn.dataset.setting];
        let idx = vals.indexOf(sv);
        if (idx === -1) idx = 0;
        btn.dataset.index = idx;
        btn.textContent = vals[idx] || sv;
        btn.setAttribute('data-active', String(idx > 0 || (typeof sv === 'boolean' && sv)));
    });
    const ms = document.getElementById('setting-music-volume');
    const ss = document.getElementById('setting-sfx-volume');
    if (ms) { ms.value = settings.musicVolume; document.getElementById('music-volume-display').textContent = settings.musicVolume; }
    if (ss) { ss.value = settings.sfxVolume; document.getElementById('sfx-volume-display').textContent = settings.sfxVolume; }
    serpentineAudio.setMusicVolume(settings.musicVolume);
    serpentineAudio.setSFXVolume(settings.sfxVolume);
    applyColorBlindFilter(settings.colorBlindMode);
    applyReducedMotion(settings.reducedMotion);
    applyHighContrast(settings.highContrast);
    applyScanlines(settings.scanlines);
    applyBatterySaver(settings.batterySaver);
    // Apply keyboard scheme and swipe sensitivity on init
    applyKeyboardScheme(settings.keyboardScheme);
    applySwipeSensitivity(settings.swipeSensitivity);
}

function setupToggleHandlers() {
    document.querySelectorAll('.settings-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.setting;
            const nv = btn.dataset.value !== 'true';
            settings[s] = nv;
            btn.dataset.value = String(nv);
            btn.textContent = nv ? 'ON' : 'OFF';
            saveSettings();
            applySettingChange(s, nv);
            announceToScreenReader(`${s} ${nv ? 'on' : 'off'}`);
            playMenuSelectSound();
        });
    });
}

function setupCycleHandlers() {
    document.querySelectorAll('.settings-cycle').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.setting;
            const vals = JSON.parse(btn.dataset.values || '[]');
            let idx = (parseInt(btn.dataset.index) || 0) + 1;
            if (idx >= vals.length) idx = 0;
            const nv = vals[idx];
            settings[s] = nv;
            btn.dataset.index = idx;
            btn.textContent = nv;
            btn.setAttribute('data-active', 'true');
            saveSettings();
            applySettingChange(s, nv);
            announceToScreenReader(`${s}: ${nv}`);
            playMenuSelectSound();
        });
    });
}

function setupSliderHandlers() {
    const ms = document.getElementById('setting-music-volume');
    const ss = document.getElementById('setting-sfx-volume');
    if (ms) ms.addEventListener('input', () => {
        settings.musicVolume = parseInt(ms.value);
        document.getElementById('music-volume-display').textContent = ms.value;
        saveSettings();
        applySettingChange('musicVolume', settings.musicVolume);
    });
    if (ss) ss.addEventListener('input', () => {
        settings.sfxVolume = parseInt(ss.value);
        document.getElementById('sfx-volume-display').textContent = ss.value;
        saveSettings();
    });
}

// Control Remapper
let remapperListening = null;

function initRemapper() {
    renderRemapperList();
}

function renderRemapperList() {
    const c = document.getElementById('remapper-list');
    if (!c) return;
    const actions = [{key:'UP',lbl:'MOVE UP'},{key:'DOWN',lbl:'MOVE DOWN'},{key:'LEFT',lbl:'MOVE LEFT'},{key:'RIGHT',lbl:'MOVE RIGHT'},{key:'PAUSE',lbl:'PAUSE'}];
    c.innerHTML = actions.map(a => {
        const k = settings.keyBindings[a.key]?.[0] || '—';
        return `<div class="remap-row" data-action="${a.key}" tabindex="0" role="button" aria-label="${a.lbl}"><span class="remap-action">${a.lbl}</span><span class="remap-key" data-key="${a.key}">${formatKeyName(k)}</span></div>`;
    }).join('');
    c.querySelectorAll('.remap-row').forEach(row => {
        row.addEventListener('click', () => startListening(row.dataset.action));
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startListening(row.dataset.action); }});
    });
}

function formatKeyName(k) {
    const m = {'ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→',' ':'SPACE','Escape':'ESC'};
    return m[k] || k.toUpperCase();
}

function startListening(action) {
    if (remapperListening) document.querySelector(`.remap-row[data-action="${remapperListening}"]`)?.classList.remove('listening');
    remapperListening = action;
    const row = document.querySelector(`.remap-row[data-action="${action}"]`);
    if (row) { row.classList.add('listening'); row.querySelector('.remap-key').textContent = '...'; }
    announceToScreenReader(`Press key for ${action}`);
    const kh = e => {
        e.preventDefault();
        if (['Control','Alt','Shift','Meta'].includes(e.key)) return;
        const k = e.code;
        const dup = Object.entries(settings.keyBindings).find(([a,ks]) => a !== action && ks.includes(k));
        if (dup) { announceToScreenReader(`Already bound to ${dup[0]}`); playDeathSound(); }
        else {
            settings.keyBindings[action] = [k];
            saveSettings();
            row?.querySelector('.remap-key')?.setAttribute('data-key', k);
            row?.querySelector('.remap-key') && (row.querySelector('.remap-key').textContent = formatKeyName(k));
            row?.classList.remove('listening');
            remapperListening = null;
            announceToScreenReader(`${action} set to ${formatKeyName(k)}`);
            playMenuSelectSound();
        }
        document.removeEventListener('keydown', kh);
    };
    document.addEventListener('keydown', kh);
}

function resetKeyBindings() {
    settings.keyBindings = { ...DEFAULT_SETTINGS.keyBindings };
    saveSettings();
    renderRemapperList();
    announceToScreenReader('Key bindings reset');
    playMenuBackSound();
}

// Export/Import - uses existing Save System v2 if available
function exportSaveData() {
    if (typeof saveManager !== 'undefined') {
        saveManager.downloadExport();
        showUnlockPopup('SAVE EXPORTED', '#00ffcc');
        playMenuSelectSound();
    } else {
        // Fallback implementation
        const d = {
            version:'1.0.0', exportDate:new Date().toISOString(),
            highScore:localStorage.getItem('serpentineHighScore'),
            bank:localStorage.getItem('serpentineBank'),
            unlockedSpectrum:localStorage.getItem('serpentineUnlockedSpectrum'),
            unlocked9193:localStorage.getItem('serpentineUnlocked9193'),
            unlockedPrincess:localStorage.getItem('serpentineUnlockedPrincess'),
            unlockedArthropod:localStorage.getItem('serpentineUnlockedArthropod'),
            unlockedCentipede:localStorage.getItem('serpentineUnlockedCentipede'),
            unlockedDragon:localStorage.getItem('serpentineUnlockedDragon'),
            bought9193Hint:localStorage.getItem('bought9193Hint'),
            boughtMasterHint:localStorage.getItem('boughtMasterHint'),
            leaderboards:{easy:localStorage.getItem('serpentineLB_easy'),medium:localStorage.getItem('serpentineLB_medium'),hard:localStorage.getItem('serpentineLB_hard'),insane:localStorage.getItem('serpentineLB_insane')}
        };
        const blob = new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `serpentine-save-${Date.now()}.serpentine`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        announceToScreenReader('Save exported');
        playUnlockSound();
    }
}

function importSaveData(file) {
    if (typeof saveManager !== 'undefined') {
        const reader = new FileReader();
        reader.onload = ev => {
            const result = saveManager.importProfile(ev.target.result);
            if (result.success) {
                showUnlockPopup('PROFILE IMPORTED', '#00ffcc');
                setTimeout(() => location.reload(), 2000);
            } else {
                showUnlockPopup('IMPORT FAILED', '#ff0055');
            }
        };
        reader.readAsText(file);
    } else {
        // Fallback implementation
        const r = new FileReader();
        r.onload = e => {
            try {
                const d = JSON.parse(e.target.result);
                if (d.highScore) localStorage.setItem('serpentineHighScore', d.highScore);
                if (d.bank) localStorage.setItem('serpentineBank', d.bank);
                ['Spectrum','9193','Princess','Arthropod','Centipede','Dragon'].forEach(k => { const lk = 'serpentineUnlocked'+k; if (d[lk]) localStorage.setItem(lk, d[lk]); });
                if (d.bought9193Hint) localStorage.setItem('bought9193Hint', d.bought9193Hint);
                if (d.boughtMasterHint) localStorage.setItem('boughtMasterHint', d.boughtMasterHint);
                if (d.leaderboards) Object.entries(d.leaderboards).forEach(([k,v]) => { if (v) localStorage.setItem('serpentineLB_'+k, v); });
                announceToScreenReader('Save imported. Reloading...');
                playUnlockSound();
                setTimeout(() => location.reload(), 1000);
            } catch (err) { announceToScreenReader('Import failed. Invalid file.'); playDeathSound(); }
        };
        r.readAsText(file);
    }
}

function setupSettingsNavigation() {
    document.getElementById('btn-settings-menu')?.addEventListener('click', () => { hideAllMenus(); initSettingsUI(); document.getElementById('settings-screen').classList.remove('hidden'); document.getElementById('setting-music-volume')?.focus(); });
    document.getElementById('btn-settings-from-controls')?.addEventListener('click', () => { hideAllMenus(); initSettingsUI(); document.getElementById('settings-screen').classList.remove('hidden'); });
    document.getElementById('btn-back-settings')?.addEventListener('click', () => { hideAllMenus(); mainMenu.classList.remove('hidden'); });
    document.getElementById('btn-open-remapper')?.addEventListener('click', () => { hideAllMenus(); initRemapper(); document.getElementById('remapper-screen').classList.remove('hidden'); });
    document.getElementById('btn-back-remapper')?.addEventListener('click', () => { remapperListening = null; hideAllMenus(); document.getElementById('settings-screen').classList.remove('hidden'); });
    document.getElementById('btn-reset-remaps')?.addEventListener('click', resetKeyBindings);
    // Note: Export/import/reset handlers are set up by Save System v2 below
}

// Focus loss mute
window.addEventListener('blur', () => { if (settings.muteOnFocus && musicGain) musicGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); });
window.addEventListener('focus', () => { if (settings.muteOnFocus && musicGain) musicGain.gain.setTargetAtTime((settings.musicVolume / 100) * 0.4, audioCtx.currentTime, 0.1); });

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
        sentinelTogglePause();
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
                
                // --- 9x9 Master Unlock Ritual (Hold 9 for 9 seconds) ---
                const profile9193 = snakeProfiles.find(p => p.id === '9193');
                if (e.key === '9' && profile9193 && selectedProfileIndex === snakeProfiles.indexOf(profile9193)) {
                    if (!masterUnlockHoldStart) {
                        masterUnlockHoldStart = Date.now();
                        document.querySelector('.arcade-machine').classList.add('ritual-active');
                        startRitualTone();
                        masterUnlockTimer = setTimeout(() => {
                            unlockEverything();
                            masterUnlockHoldStart = null;
                            masterUnlockTimer = null;
                            stopRitualTone();
                            document.querySelector('.arcade-machine').classList.remove('ritual-active');
                        }, 9000);
                    }
                } else {
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

    // Check key against dynamic keyBindings
    const action = getActionForKey(e.code) || getActionForKey(e.key);

    switch (action) {
        case 'UP':
            if (activeDy !== 1) pendingDirection = { dx: 0, dy: -1 };
            break;
        case 'DOWN':
            if (activeDy !== -1) pendingDirection = { dx: 0, dy: 1 };
            break;
        case 'LEFT':
            if (activeDx !== 1) pendingDirection = { dx: -1, dy: 0 };
            break;
        case 'RIGHT':
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

    // Use configurable deadzone from MobileOptimizer (respects swipe sensitivity setting)
    const deadzone = MobileOptimizer.touchSwipeDeadzone;
    if (Math.abs(dxTouch) < deadzone && Math.abs(dyTouch) < deadzone) return;

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
    refreshMainMenuStats();
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
    // Grid Warfare overlays
    document.getElementById('grid-mode-select')?.classList.add('hidden');
    document.getElementById('grid-ai-select')?.classList.add('hidden');
    document.getElementById('grid-char-select')?.classList.add('hidden');
    document.getElementById('grid-match-end')?.classList.add('hidden');
    // Season Track and Profile
    document.getElementById('season-screen')?.classList.add('hidden');
    document.getElementById('profile-screen')?.classList.add('hidden');
    document.getElementById('title-selector')?.classList.add('hidden');
};

function refreshMainMenuStats() {
    const bestScoreEl = document.getElementById('menu-best-score');
    const bankEl = document.getElementById('menu-bank');
    if (bestScoreEl) bestScoreEl.textContent = highScore.toLocaleString();
    if (bankEl) bankEl.textContent = bank.toLocaleString();
}

// Alias for backwards compatibility
const updateMenuBankDisplay = refreshMainMenuStats;

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

document.getElementById('btn-challenges-menu').addEventListener('click', () => {
    ChallengeManager.showChallengeScreen();
});

document.getElementById('btn-back-challenges').addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-challenges-menu').focus();
});

// ─── Season Track Button ──────────────────────────────────────────────────
document.getElementById('btn-season-menu')?.addEventListener('click', () => {
    hideAllMenus();
    showSeasonTrackScreen();
});

document.getElementById('btn-back-season')?.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-season-menu')?.focus();
});

// ─── Profile Button ────────────────────────────────────────────────────────
document.getElementById('btn-profile-menu')?.addEventListener('click', () => {
    hideAllMenus();
    showProfileScreen();
});

document.getElementById('btn-achievements-menu')?.addEventListener('click', () => {
    hideAllMenus();
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.showAchievementsScreen();
    } else {
        document.getElementById('achievements-screen')?.classList.remove('hidden');
    }
});

document.getElementById('btn-back-achievements')?.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-achievements-menu')?.focus();
});

document.getElementById('btn-back-profile')?.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-profile-menu')?.focus();
});

// ─── Title Selector ────────────────────────────────────────────────────────
document.getElementById('btn-change-title')?.addEventListener('click', () => {
    showTitleSelector();
});

document.getElementById('btn-close-title-selector')?.addEventListener('click', () => {
    document.getElementById('title-selector')?.classList.add('hidden');
});

document.getElementById('btn-celebration-close').addEventListener('click', () => {
    ChallengeManager.hideCelebration();
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
let currentLeaderboardMode = 'standard'; // standard or chronoshift

document.querySelectorAll('.btn-lb-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.btn-lb-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentLeaderboardMode = tab.dataset.mode;
        // Default to medium difficulty when switching modes
        renderLeaderboard('medium');
    });
});

document.querySelectorAll('.btn-lb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        renderLeaderboard(tab.dataset.diff);
    });
});

document.getElementById('btn-controls-menu').addEventListener('click', () => {
    hideAllMenus();
    renderControlsKeyboard();
    controlsScreen.classList.remove('hidden');
    document.getElementById('btn-back-controls').focus();
});

function renderControlsKeyboard() {
    const container = document.getElementById('controls-keyboard');
    if (!container) return;
    container.innerHTML = '';

    const sections = [
        {
            label: 'MENU NAVIGATION',
            rows: [
                [
                    { label: 'W', cls: 'key-wide', hint: 'UP' },
                    { label: 'A', cls: 'key-wide', hint: 'LEFT' },
                    { label: 'S', cls: 'key-wide', hint: 'DOWN' },
                    { label: 'D', cls: 'key-wide', hint: 'RIGHT' },
                ],
                [
                    { label: '↑', cls: 'key-wide', hint: 'UP' },
                    { label: '←', cls: 'key-wide', hint: 'LEFT' },
                    { label: '↓', cls: 'key-wide', hint: 'DOWN' },
                    { label: '→', cls: 'key-wide', hint: 'RIGHT' },
                ],
                [
                    { label: 'SPACE', cls: 'key-xl', hint: 'SELECT' },
                    { label: 'ESC', cls: 'key-wide', hint: 'BACK' },
                ],
            ]
        },
        {
            label: 'IN-GAME',
            rows: [
                [
                    { label: 'W', cls: 'key-wide', hint: 'UP' },
                    { label: 'A', cls: 'key-wide', hint: 'LEFT' },
                    { label: 'S', cls: 'key-wide', hint: 'DOWN' },
                    { label: 'D', cls: 'key-wide', hint: 'RIGHT' },
                ],
                [
                    { label: '↑', cls: 'key-wide', hint: 'UP' },
                    { label: '←', cls: 'key-wide', hint: 'LEFT' },
                    { label: '↓', cls: 'key-wide', hint: 'DOWN' },
                    { label: '→', cls: 'key-wide', hint: 'RIGHT' },
                ],
                [
                    { label: '9', cls: 'key-wide', hint: 'RITUAL' },
                    { label: 'ESC', cls: 'key-wide', hint: 'PAUSE' },
                ],
            ]
        },
        {
            label: 'INITIALS ENTRY',
            rows: [
                [
                    { label: '↑', cls: 'key-wide', hint: 'SCROLL UP' },
                    { label: '↓', cls: 'key-wide', hint: 'SCROLL DOWN' },
                ],
                [
                    { label: '←', cls: 'key-wide', hint: 'PREV SLOT' },
                    { label: '→', cls: 'key-wide', hint: 'NEXT SLOT' },
                ],
                [
                    { label: 'SPACE', cls: 'key-xl', hint: 'SUBMIT' },
                ],
            ]
        }
    ];

    const style = document.createElement('style');
    style.textContent = `
        .kbd-section { margin-bottom: 18px; }
        .kbd-section-label {
            font-size: 0.65rem;
            letter-spacing: 3px;
            color: #888;
            margin-bottom: 8px;
            text-align: center;
        }
        .kbd-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 6px; }
        .kbd-key {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.4);
        }
        .kbd-key .lbl { font-size: 0.9rem; font-weight: 700; }
        .kbd-key .hint { font-size: 0.45rem; color: #888; letter-spacing: 1px; margin-top: 2px; }
        .key-wide { width: 42px; height: 42px; }
        .key-wide .lbl { font-size: 0.9rem; }
        .key-xl { width: 90px; height: 42px; }
        .key-xl .lbl { font-size: 0.75rem; }
        .key-tall { height: 52px; }
    `;
    if (!document.querySelector('style[data-kbd]')) {
        style.setAttribute('data-kbd', 'true');
        document.head.appendChild(style);
    }

    sections.forEach(section => {
        const sec = document.createElement('div');
        sec.className = 'kbd-section';
        sec.innerHTML = `<div class="kbd-section-label">${section.label}</div>`;
        section.rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'kbd-row';
            row.forEach(k => {
                const key = document.createElement('div');
                key.className = `kbd-key ${k.cls}`;
                key.innerHTML = `<span class="lbl">${k.label}</span><span class="hint">${k.hint}</span>`;
                rowEl.appendChild(key);
            });
            sec.appendChild(rowEl);
        });
        container.appendChild(sec);
    });
}

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

document.getElementById('btn-reset-data').addEventListener('click', () => {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('reset-modal-step1').textContent = 'Are you sure? This will erase ALL saved progress including high scores, unlocks, bank points, and achievements.';
        document.getElementById('reset-confirm-fields').style.display = 'none';
        document.getElementById('btn-reset-confirm-1').textContent = 'PROCEED';
        document.getElementById('btn-reset-confirm-1').dataset.step = '1';
    }
});

document.getElementById('btn-exit-menu').addEventListener('click', () => {
    mainMenu.innerHTML = "<h2 style='color:#ff0055; text-align:center; font-size:3rem; margin-top:100px;'>SYSTEM OFFLINE</h2>";
});

// Demo Mode buttons
document.querySelectorAll('.btn-demo-mode').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (demoState) return; // already running
        startDemo(mode);
    });
});

// Mode selection state
let selectedMode = 'standard'; // standard, chronoshift, breach, neural

document.getElementById('btn-standard').addEventListener('click', () => {
    selectedMode = 'standard';
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

document.getElementById('btn-chronoshift')?.addEventListener('click', () => {
    selectedMode = 'chronoshift';
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

document.getElementById('btn-breach')?.addEventListener('click', () => {
    selectedMode = 'breach';
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

document.getElementById('btn-neural')?.addEventListener('click', () => {
    // Neural Fit has its own drill selection, not difficulty selection
    loadNeuralUnlockProgress();
    hideAllMenus();
    showNeuralDrillSelect();
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

        // Launch the appropriate mode based on selection
        if (selectedMode === 'breach') {
            startBreachMode(currentDifficultyLabel);
        } else if (selectedMode === 'chronoshift') {
            startChronoShiftGame();
        } else {
            // Standard mode
            startGame();
        }
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
continueBtn.addEventListener('click', useMercy);

// ============================================================
// MOBILE OPTIMIZATION & TOUCH CONTROLS
// Session 3: Mobile Optimization (MASTERPLAN.md Section 4)
// ============================================================

/* --- Device Detection & Mobile Optimizer --- */
const MobileOptimizer = {
    isMobile: false,
    isLowEnd: false,
    isLandscape: true,
    touchSwipeDeadzone: 30,
    maxParticles: 200,
    targetFPS: 60,

    init() {
        this.detectDevice();
        this.detectLowEnd();
        this.setupOrientationHandler();
        this.setupFullscreenHandler();
        this.setupDPadControls();
        this.applyPerformanceCaps();
        this.injectMobileStyles();
    },

    detectDevice() {
        const hasTouchEvents = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isMobile = hasTouchEvents && (isSmallScreen || isMobileUA);
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            console.log('[MobileOptimizer] Mobile device detected');
        }
    },

    detectLowEnd() {
        const cores = navigator.hardwareConcurrency || 4;
        this.isLowEnd = cores <= 4;
        if (this.isLowEnd) {
            this.maxParticles = 50;
            this.targetFPS = 30;
            document.body.classList.add('low-end-device');
            console.log('[MobileOptimizer] Low-end device - performance caps applied');
        }
    },

    setupOrientationHandler() {
        const checkOrientation = () => {
            this.isLandscape = window.innerWidth > window.innerHeight;
            const warning = document.getElementById('orientation-warning');
            if (!warning) return;
            if (this.isMobile && !this.isLandscape && isPlaying) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        };
        window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 100));
        window.addEventListener('resize', checkOrientation);
        checkOrientation();
    },

    setupFullscreenHandler() {
        const fullscreenBtn = document.getElementById('mobile-fullscreen');
        if (!fullscreenBtn) return;
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    },

    toggleFullscreen() {
        const container = document.querySelector('.arcade-machine') || document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const requestFS = container.requestFullscreen || container.webkitRequestFullscreen;
            if (requestFS) requestFS.call(container).catch(() => {});
        } else {
            const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
            if (exitFS) exitFS.call(document);
        }
    },

    onFullscreenChange() {
        const isFs = document.fullscreenElement || document.webkitFullscreenElement;
        const fullscreenBtn = document.getElementById('mobile-fullscreen');
        if (fullscreenBtn) {
            if (isFs) {
                fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 8h2v-3h3v-2h-5v5zm2-8v3h2V5h-5v2h3zm-3 5h-2v3h5v-5h-3v2z"/></svg>';
                fullscreenBtn.setAttribute('aria-label', 'Exit Fullscreen');
            } else {
                fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
                fullscreenBtn.setAttribute('aria-label', 'Toggle Fullscreen');
            }
        }
    },

    setupDPadControls() {
        const directions = [
            { id: 'dpad-up', dx: 0, dy: -1 },
            { id: 'dpad-down', dx: 0, dy: 1 },
            { id: 'dpad-left', dx: -1, dy: 0 },
            { id: 'dpad-right', dx: 1, dy: 0 }
        ];
        const self = this;

        directions.forEach(dir => {
            const btn = document.getElementById(dir.id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                self.handleDPadPress(dir.dx, dir.dy);
                btn.classList.add('pressed');
                Haptics.feedback('menu');
            }, { passive: false });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            }, { passive: false });
            btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'));
            btn.addEventListener('mousedown', () => {
                self.handleDPadPress(dir.dx, dir.dy);
                btn.classList.add('pressed');
            });
            btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
        });

        const pauseBtn = document.getElementById('mobile-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (isPlaying) togglePause();
                Haptics.feedback('menu');
            }, { passive: false });
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isPlaying) togglePause();
            });
        }

        this.updateDPadColor();
    },

    handleDPadPress(dx, dy) {
        if (!isPlaying || isPaused || isEnteringInitials) return;
        const activeDx = pendingDirection ? pendingDirection.dx : dx;
        const activeDy = pendingDirection ? pendingDirection.dy : dy;
        if (dx !== 0 && activeDx !== -dx) {
            pendingDirection = { dx, dy: 0 };
        } else if (dy !== 0 && activeDy !== -dy) {
            pendingDirection = { dx: 0, dy };
        }
    },

    updateDPadColor() {
        const dpad = document.getElementById('mobile-dpad');
        if (!dpad) return;
        dpad.classList.remove('glow-cyan', 'glow-magenta', 'glow-gold', 'glow-purple');
        const profile = snakeProfiles[selectedProfileIndex];
        const color = profile ? profile.head.toLowerCase() : '#00ffcc';
        if (color.includes('ff0055') || color.includes('magenta')) {
            dpad.classList.add('glow-magenta');
        } else if (color.includes('ffd700') || color.includes('gold')) {
            dpad.classList.add('glow-gold');
        } else if (color.includes('8a2be2') || color.includes('purple')) {
            dpad.classList.add('glow-purple');
        } else {
            dpad.classList.add('glow-cyan');
        }
    },

    applyPerformanceCaps() {
        const self = this;
        const originalBurst = burstParticles;
        window.burstParticles = function(x, y, color, amount) {
            const cappedAmount = Math.min(amount, self.maxParticles);
            for (let i = 0; i < cappedAmount; i++) {
                originalBurst(x, y, color, 1);
            }
        };
    },

    shouldRenderFrame(currentTime) {
        if (!this.isLowEnd) return true;
        const minFrameTime = 1000 / this.targetFPS;
        const now = performance.now();
        if (now - this.lastFrameTime >= minFrameTime) {
            this.lastFrameTime = now;
            return true;
        }
        return false;
    },

    updateMobileVisibility() {
        const dpad = document.getElementById('mobile-dpad');
        if (!dpad) return;
        if (this.isMobile && isPlaying) {
            dpad.classList.remove('hidden');
        } else {
            dpad.classList.add('hidden');
        }
    },

    injectMobileStyles() {
        if (!document.getElementById('mobile-touch-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-touch-styles';
            style.textContent = `
                .mobile-controls, .dpad-btn, .mobile-btn {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                .dpad-btn:focus, .mobile-btn:focus {
                    outline: none;
                    box-shadow: none;
                }
                .dpad-btn, .mobile-btn {
                    -webkit-transition: background 0.1s, transform 0.1s, box-shadow 0.1s;
                    transition: background 0.1s, transform 0.1s, box-shadow 0.1s;
                }
                @media (hover: none), (pointer: coarse) {
                    .dpad-btn:active, .mobile-btn:active {
                        background: rgba(0, 255, 204, 0.4) !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

/* --- Haptic Feedback System --- */
const Haptics = {
    supported: false,
    init() {
        this.supported = 'vibrate' in navigator;
    },
    feedback(type) {
        if (!this.supported) return;
        try {
            switch (type) {
                case 'eat': navigator.vibrate(10); break;
                case 'death': navigator.vibrate([100, 50, 100, 50, 200]); break;
                case 'menu': navigator.vibrate(5); break;
                case 'powerup': navigator.vibrate([20, 30, 20]); break;
                case 'unlock': navigator.vibrate([50, 50, 50, 50, 50, 100, 200]); break;
                default: navigator.vibrate(10);
            }
        } catch (e) {}
    }
};

/* --- Swipe Controller with configurable deadzone --- */
const SwipeController = {
    startX: 0,
    startY: 0,
    deadzone: 30,
    init() {
        const savedDeadzone = localStorage.getItem('serpentineSwipeDeadzone');
        if (savedDeadzone) this.deadzone = parseInt(savedDeadzone) || 30;
    },
    setDeadzone(value) {
        this.deadzone = Math.max(15, Math.min(60, value));
        localStorage.setItem('serpentineSwipeDeadzone', this.deadzone);
    }
};

// Initialize mobile systems immediately
MobileOptimizer.init();
Haptics.init();
SwipeController.init();

/* --- Integrate Haptics with Game Events --- */
const originalPlayEatSound = playEatSound;
playEatSound = function() {
    originalPlayEatSound();
    Haptics.feedback('eat');
};

const originalPlayDeathSound = playDeathSound;
playDeathSound = function() {
    originalPlayDeathSound();
    Haptics.feedback('death');
};

const originalPlayUnlockSound = playUnlockSound;
playUnlockSound = function() {
    originalPlayUnlockSound();
    Haptics.feedback('unlock');
};

const originalPlayPowerUpSound = playPowerUpSound;
playPowerUpSound = function() {
    originalPlayPowerUpSound();
    Haptics.feedback('powerup');
};

/* --- Button haptic feedback --- */
document.addEventListener('click', (e) => {
    if (e.target.matches && e.target.matches('.btn-menu, .dpad-btn, .mobile-btn, button')) {
        Haptics.feedback('menu');
    }
}, true);

/* --- Update D-pad color when character changes --- */
const originalUpdateProfileStyle = updateProfileStyle;
updateProfileStyle = function() {
    originalUpdateProfileStyle();
    MobileOptimizer.updateDPadColor();
};

// ============================================================
// END MOBILE OPTIMIZATION
// ============================================================

/* --- Integrate Swipe Sensitivity with Settings --- */
const originalSwipeControllerInit = SwipeController.init;
SwipeController.init = function() {
    originalSwipeControllerInit();
    // Apply swipe sensitivity from settings
    if (typeof settings !== 'undefined' && settings.swipeSensitivity) {
        const sensMap = { low: 45, medium: 30, high: 15 };
        const deadzone = sensMap[settings.swipeSensitivity.toLowerCase()] || 30;
        this.setDeadzone(deadzone);
    }
};

// Button Bindings
continueBtn.addEventListener('click', useMercy);
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

// Initialization - Check for tutorial on first run
document.getElementById('btn-initialize').addEventListener('click', () => {
    hideAllMenus();

    // Initialize audio on user gesture
    if (window.serpentineAudio && !window.serpentineAudio.isInitialized) {
        window.serpentineAudio.init();
    }
    // Resume audio context if suspended
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Check if tutorial should run (first time player)
    if (typeof TutorialSystem !== 'undefined' && TutorialSystem.shouldRunTutorial()) {
        TutorialSystem.startTutorial();
    } else {
        // Skip tutorial, go straight to main menu
        mainMenu.classList.remove('hidden');
        startMenuMusic();
        document.getElementById('btn-play-menu').focus();
    }
});

// ── Save System v2 UI Bindings ──────────────────────────────────────────────
document.getElementById('btn-export-save')?.addEventListener('click', () => {
    if (typeof saveManager !== 'undefined') {
        saveManager.downloadExport();
        showUnlockPopup('SAVE EXPORTED', '#00ffcc');
        playMenuSelectSound();
    }
});

document.getElementById('btn-import-save')?.addEventListener('click', () => {
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) fileInput.click();
    playMenuSelectSound();
});

document.getElementById('import-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const json = ev.target?.result;
        if (typeof json !== 'string') {
            showUnlockPopup('IMPORT FAILED', '#ff0055');
            return;
        }

        if (typeof saveManager !== 'undefined' && saveManager) {
            // First try to preview
            const previewResult = saveManager.previewImport(json);

            if (!previewResult.success) {
                showUnlockPopup('IMPORT FAILED\n' + (previewResult.error || 'Unknown error'), '#ff0055');
                return;
            }

            // Show preview modal
            saveManager._showImportPreview(previewResult.preview, json, () => {
                // User confirmed - apply import
                const result = saveManager._applyImport(json);
                if (result.success) {
                    showUnlockPopup(`PROFILE IMPORTED\nGames: ${result.stats.gamesPlayed} | Chars: ${result.stats.characters}`, '#00ffcc');
                    // Reload the page to reflect all changes
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showUnlockPopup('IMPORT FAILED\n' + (result.error || 'Unknown error'), '#ff0055');
                }
            });
        }
    };
    reader.onerror = () => {
        showUnlockPopup('FILE READ ERROR', '#ff0055');
    };
    reader.readAsText(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
});

document.getElementById('btn-open-reset-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('reset-modal-step1').textContent = 'Are you sure? This will erase ALL saved progress including high scores, unlocks, bank points, and achievements.';
        document.getElementById('reset-confirm-fields').style.display = 'none';
        document.getElementById('btn-reset-confirm-1').textContent = 'PROCEED';
        document.getElementById('btn-reset-confirm-1').dataset.step = '1';
    }
    playMenuSelectSound();
});

document.getElementById('btn-reset-confirm-1')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-reset-confirm-1');
    const step = btn?.dataset.step;

    if (step === '1') {
        // Show second confirmation
        document.getElementById('reset-modal-step1').textContent = 'This is your LAST chance. All data will be permanently deleted.';
        document.getElementById('reset-confirm-fields').style.display = 'block';
        document.getElementById('reset-confirm-input').value = '';
        document.getElementById('reset-confirm-input').focus();
        btn.textContent = 'CONFIRM';
        btn.dataset.step = '2';
    } else if (step === '2') {
        const inputVal = document.getElementById('reset-confirm-input')?.value;
        if (inputVal?.toUpperCase() === 'RESET') {
            // Execute reset
            if (typeof saveManager !== 'undefined') {
                saveManager.resetAll();
            }
            showUnlockPopup('ALL DATA RESET', '#ff0055');
            setTimeout(() => location.reload(), 1500);
        } else {
            showUnlockPopup('TYPE "RESET" TO CONFIRM', '#ff0055');
            document.getElementById('reset-confirm-input')?.focus();
        }
    }
});

document.getElementById('btn-reset-cancel')?.addEventListener('click', () => {
    const modal = document.getElementById('reset-modal');
    if (modal) modal.classList.add('hidden');
    // Reset button state
    const btn = document.getElementById('btn-reset-confirm-1');
    if (btn) {
        btn.textContent = 'PROCEED';
        btn.dataset.step = '1';
    }
});

// Close modal on overlay click
document.getElementById('reset-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'reset-modal') {
        document.getElementById('reset-modal')?.classList.add('hidden');
        const btn = document.getElementById('btn-reset-confirm-1');
        if (btn) {
            btn.textContent = 'PROCEED';
            btn.dataset.step = '1';
        }
    }
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

// Initialize Settings System
setupSettingsNavigation();
setupToggleHandlers();
setupCycleHandlers();
setupSliderHandlers();

// ═══════════════════════════════════════════════════════════════════════════
// GRID WARFARE MODE — Two-Player Battle System
// ═══════════════════════════════════════════════════════════════════════════

// Grid Warfare State
const GridWarfare = {
    // Mode settings
    isActive: false,
    is1Player: true,      // true = vs AI, false = 2P local
    aiDifficulty: 'medium',
    tickRate: 120,
    maxFood: 3,

    // Players
    players: {
        1: { snake: [], score: 0, wins: 0, profileIndex: 0, alive: true, dx: 1, dy: 0, pendingDx: 1, pendingDy: 0, foodEaten: 0 },
        2: { snake: [], score: 0, wins: 0, profileIndex: 3, alive: true, dx: -1, dy: 0, pendingDx: -1, pendingDy: 0, foodEaten: 0 }
    },

    // Match state
    currentRound: 1,
    roundsToWin: 5,
    matchOver: false,
    winner: null,

    // Game state
    food: [],
    foodTimer: null,
    gameLoop: null,
    lastTickTime: 0,
    particles: [],

    // Countdown
    countdown: 3,
    countdownInterval: null,
    isCountingDown: false,

    // Audio
    audioCtx: null,

    // Starting positions
    START_POSITIONS: {
        1: { x: 3, y: 10, dx: 1, dy: 0 },
        2: { x: 16, y: 10, dx: -1, dy: 0 }
    },

    // Colors
    COLORS: {
        P1_HEAD: '#00ffcc',
        P1_BODY: '#00cc99',
        P1_GLOW: 'rgba(0,255,204,0.5)',
        P2_HEAD: '#ff0055',
        P2_BODY: '#cc0044',
        P2_GLOW: 'rgba(255,0,85,0.5)',
        FOOD: '#ffd700',
        FOOD_GLOW: 'rgba(255,215,0,0.8)',
        WALL: '#333333',
        CENTER_LINE: 'rgba(255,255,255,0.06)'
    }
};

// Grid Warfare Sound Effects
function gwPlayEatSound() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.value = 660;
    osc2.type = 'square';
    osc2.frequency.value = 880;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.1);
    osc2.stop(now + 0.1);
}

function gwPlayDeathSound() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
}

function gwPlayRoundWinSound() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    [300, 400, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
    });
}

function gwPlayMatchWinSound() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    // Fanfare chord
    [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
    });
}

function gwPlayCountdownTick() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 1000;

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
}

function gwPlayGoSound() {
    if (!GridWarfare.audioCtx) GridWarfare.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = GridWarfare.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 1200;

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
}

// Grid Warfare Navigation Setup
function setupGridWarfareUI() {
    // Mode select button
    document.getElementById('btn-grid-warfare')?.addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('grid-mode-select').classList.remove('hidden');
        playMenuSelectSound();
    });

    // Back from mode select
    document.getElementById('btn-back-gw-mode')?.addEventListener('click', () => {
        hideAllMenus();
        modeSelect.classList.remove('hidden');
        playMenuBackSound();
    });

    // 1P or 2P selection
    document.getElementById('btn-gw-1p')?.addEventListener('click', () => {
        GridWarfare.is1Player = true;
        hideAllMenus();
        document.getElementById('grid-ai-select').classList.remove('hidden');
        playMenuSelectSound();
    });

    document.getElementById('btn-gw-2p')?.addEventListener('click', () => {
        GridWarfare.is1Player = false;
        // Skip AI difficulty, go directly to character select
        hideAllMenus();
        document.getElementById('grid-ai-select').classList.add('hidden');
        GridWarfare.showCharSelect();
        playMenuSelectSound();
    });

    // Back from AI difficulty
    document.getElementById('btn-back-gw-ai')?.addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('grid-mode-select').classList.remove('hidden');
        playMenuBackSound();
    });

    // AI difficulty buttons
    ['easy', 'medium', 'hard', 'insane'].forEach(diff => {
        const speedMap = { easy: 180, medium: 120, hard: 80, insane: 50 };
        const maxFoodMap = { easy: 5, medium: 3, hard: 2, insane: 1 };

        document.getElementById(`btn-gw-${diff}`)?.addEventListener('click', () => {
            GridWarfare.aiDifficulty = diff;
            GridWarfare.tickRate = speedMap[diff];
            GridWarfare.maxFood = maxFoodMap[diff];
            hideAllMenus();
            GridWarfare.showCharSelect();
            playMenuSelectSound();
        });
    });

    // Character navigation
    document.querySelectorAll('.gw-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const player = parseInt(btn.dataset.player);
            const dir = parseInt(btn.dataset.dir);
            GridWarfare.navigateCharacter(player, dir);
            playMenuNavSound();
        });
    });

    // Start battle
    document.getElementById('btn-gw-start')?.addEventListener('click', () => {
        GridWarfare.startMatch();
        playMenuSelectSound();
    });

    // Back from character select
    document.getElementById('btn-back-gw-char')?.addEventListener('click', () => {
        hideAllMenus();
        if (GridWarfare.is1Player) {
            document.getElementById('grid-ai-select').classList.remove('hidden');
        } else {
            document.getElementById('grid-mode-select').classList.remove('hidden');
        }
        playMenuBackSound();
    });

    // Match end buttons
    document.getElementById('btn-gw-replay')?.addEventListener('click', () => {
        GridWarfare.resetMatch();
        GridWarfare.startMatch();
        playMenuSelectSound();
    });

    document.getElementById('btn-gw-new-chars')?.addEventListener('click', () => {
        hideAllMenus();
        GridWarfare.resetMatch();
        GridWarfare.showCharSelect();
        playMenuSelectSound();
    });

    document.getElementById('btn-gw-main-menu')?.addEventListener('click', () => {
        GridWarfare.cleanup();
        hideAllMenus();
        mainMenu.classList.remove('hidden');
        playMenuBackSound();
    });
}

GridWarfare.showCharSelect = function() {
    // Update P2 title for AI mode
    const p2Title = document.getElementById('gw-p2-title');
    if (p2Title) {
        p2Title.textContent = this.is1Player ? 'AI OPPONENT' : 'PLAYER 2';
    }

    // Update P2 controls display
    const p2Ctrl = document.getElementById('gw-p2-ctrl');
    if (p2Ctrl) {
        p2Ctrl.textContent = this.is1Player ? 'AI AUTO-PLAY' : 'ARROWS + ENTER';
    }

    // Update P2 name/lore for AI
    if (this.is1Player) {
        const p2Name = document.getElementById('gw-p2-name');
        const p2Lore = document.getElementById('gw-p2-lore');
        if (p2Name) {
            const aiNames = { easy: 'ROOKIE BOT', medium: 'HUNTER BOT', hard: 'ELITE BOT', insane: 'NEMESIS BOT' };
            p2Name.textContent = aiNames[this.aiDifficulty] || 'HUNTER BOT';
        }
        if (p2Lore) p2Lore.textContent = `Difficulty: ${this.aiDifficulty.toUpperCase()}`;
    } else {
        const p2Profile = snakeProfiles[this.players[2].profileIndex];
        const p2Name = document.getElementById('gw-p2-name');
        const p2Lore = document.getElementById('gw-p2-lore');
        if (p2Name && p2Profile) p2Name.textContent = p2Profile.name;
        if (p2Lore && p2Profile) p2Lore.textContent = p2Profile.lore.substring(0, 50) + '...';
    }

    this.updateCharDisplay();
    document.getElementById('grid-char-select').classList.remove('hidden');
};

GridWarfare.navigateCharacter = function(player, direction) {
    const p = this.players[player];

    // Get available profiles (not locked)
    const available = snakeProfiles
        .map((profile, index) => ({ profile, index }))
        .filter(item => !item.profile.locked)
        .map(item => item.index);

    if (available.length === 0) return;

    let currentIdx = available.indexOf(p.profileIndex);
    if (currentIdx === -1) currentIdx = 0;

    currentIdx = (currentIdx + direction + available.length) % available.length;
    p.profileIndex = available[currentIdx];

    this.updateCharDisplay();
};

GridWarfare.updateCharDisplay = function() {
    // Update P1
    const p1 = this.players[1];
    const p1Profile = snakeProfiles[p1.profileIndex];
    document.getElementById('gw-p1-name').textContent = p1Profile.name;
    document.getElementById('gw-p1-lore').textContent = p1Profile.lore.substring(0, 60) + (p1Profile.lore.length > 60 ? '...' : '');
    document.getElementById('gw-p1-name').style.color = p1Profile.head;

    // Update P2
    const p2 = this.players[2];
    const p2NameEl = document.getElementById('gw-p2-name');
    const p2LoreEl = document.getElementById('gw-p2-lore');

    if (this.is1Player) {
        p2NameEl.style.color = '#ff0055';
    } else {
        const p2Profile = snakeProfiles[p2.profileIndex];
        p2NameEl.textContent = p2Profile.name;
        p2LoreEl.textContent = p2Profile.lore.substring(0, 60) + (p2Profile.lore.length > 60 ? '...' : '');
        p2NameEl.style.color = p2Profile.head;
    }
};

GridWarfare.startMatch = function() {
    this.isActive = true;
    this.matchOver = false;
    this.winner = null;
    this.currentRound = 1;

    // Reset player stats
    this.players[1].wins = 0;
    this.players[1].score = 0;
    this.players[2].wins = 0;
    this.players[2].score = 0;

    hideAllMenus();
    document.getElementById('game-over').classList.add('hidden');

    // Create HUD
    this.createHUD();

    // Start round
    this.startRound();
};

GridWarfare.createHUD = function() {
    // Remove existing HUD if any
    const existing = document.getElementById('grid-warfare-hud');
    if (existing) existing.remove();

    const wrapper = document.querySelector('.canvas-wrapper');

    const hud = document.createElement('div');
    hud.id = 'grid-warfare-hud';
    hud.innerHTML = `
        <div class="gw-hud-player p1">
            <div class="gw-hud-name p1" id="hud-p1-name">P1</div>
            <div class="gw-hud-score p1" id="hud-p1-score">0</div>
            <div class="gw-hud-wins" id="hud-p1-wins"></div>
        </div>
        <div class="gw-hud-center">
            <div class="gw-hud-round" id="hud-round">ROUND</div>
            <div class="gw-hud-round-label" id="hud-round-num">1/5</div>
        </div>
        <div class="gw-hud-player p2">
            <div class="gw-hud-name p2" id="hud-p2-name">P2</div>
            <div class="gw-hud-score p2" id="hud-p2-score">0</div>
            <div class="gw-hud-wins" id="hud-p2-wins"></div>
        </div>
    `;

    wrapper.appendChild(hud);
    this.updateHUD();
};

GridWarfare.updateHUD = function() {
    // Update scores
    document.getElementById('hud-p1-score').textContent = this.players[1].score;
    document.getElementById('hud-p2-score').textContent = this.players[2].score;

    // Update round
    document.getElementById('hud-round-num').textContent = `${this.currentRound}/5`;

    // Update win pips
    this.updateWinPips('p1', this.players[1].wins);
    this.updateWinPips('p2', this.players[2].wins);
};

GridWarfare.updateWinPips = function(player, wins) {
    const container = document.getElementById(`hud-${player}-wins`);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < this.roundsToWin; i++) {
        const pip = document.createElement('div');
        pip.className = 'gw-win-pip' + (i < wins ? ' filled' : '');
        container.appendChild(pip);
    }
};

GridWarfare.startRound = function() {
    // Reset snakes
    this.initSnakes();

    // Clear food
    this.food = [];

    // Clear particles
    this.particles = [];

    // Reset alive status
    this.players[1].alive = true;
    this.players[2].alive = true;

    // Spawn initial food
    for (let i = 0; i < this.maxFood; i++) {
        this.spawnFood();
    }

    // Update HUD
    this.updateHUD();

    // Start countdown
    this.startCountdown();
};

GridWarfare.initSnakes = function() {
    const p1Start = this.START_POSITIONS[1];
    const p2Start = this.START_POSITIONS[2];

    // P1 starts facing right
    this.players[1].snake = [
        { x: p1Start.x, y: p1Start.y },
        { x: p1Start.x - 1, y: p1Start.y },
        { x: p1Start.x - 2, y: p1Start.y }
    ];
    this.players[1].dx = p1Start.dx;
    this.players[1].dy = p1Start.dy;
    this.players[1].pendingDx = p1Start.dx;
    this.players[1].pendingDy = p1Start.dy;

    // P2 starts facing left
    this.players[2].snake = [
        { x: p2Start.x, y: p2Start.y },
        { x: p2Start.x + 1, y: p2Start.y },
        { x: p2Start.x + 2, y: p2Start.y }
    ];
    this.players[2].dx = p2Start.dx;
    this.players[2].dy = p2Start.dy;
    this.players[2].pendingDx = p2Start.dx;
    this.players[2].pendingDy = p2Start.dy;
};

GridWarfare.startCountdown = function() {
    this.isCountingDown = true;
    this.countdown = 3;

    // Remove existing countdown
    const existing = document.getElementById('grid-countdown');
    if (existing) existing.remove();

    const wrapper = document.querySelector('.canvas-wrapper');
    const countdown = document.createElement('div');
    countdown.id = 'grid-countdown';
    countdown.textContent = this.countdown;
    wrapper.appendChild(countdown);

    gwPlayCountdownTick();

    this.countdownInterval = setInterval(() => {
        this.countdown--;

        if (this.countdown > 0) {
            countdown.textContent = this.countdown;
            countdown.style.animation = 'none';
            countdown.offsetHeight; // Trigger reflow
            countdown.style.animation = 'countdownPulse 1s ease-out';
            gwPlayCountdownTick();
        } else {
            countdown.textContent = 'GO!';
            countdown.style.animation = 'none';
            countdown.offsetHeight;
            countdown.style.animation = 'countdownPulse 1s ease-out';
            gwPlayGoSound();

            setTimeout(() => {
                countdown.remove();
                this.isCountingDown = false;
                this.startGameLoop();
            }, 500);
        }
    }, 1000);
};

GridWarfare.startGameLoop = function() {
    this.lastTickTime = performance.now();

    // Start food spawn timer
    this.foodTimer = setInterval(() => {
        if (this.food.length < this.maxFood) {
            this.spawnFood();
        }
    }, 2000);

    // Start game loop
    this.gameLoop = requestAnimationFrame((time) => this.gameLoopTick(time));
};

GridWarfare.gameLoopTick = function(currentTime) {
    if (!this.isActive || this.matchOver) return;

    // Render
    this.render();

    // Check if it's time for a tick
    const elapsed = currentTime - this.lastTickTime;

    if (!this.isCountingDown && elapsed >= this.tickRate) {
        this.lastTickTime = currentTime;
        this.tick();
    }

    // Continue loop
    this.gameLoop = requestAnimationFrame((time) => this.gameLoopTick(time));
};

GridWarfare.tick = function() {
    // Apply pending directions
    this.players[1].dx = this.players[1].pendingDx;
    this.players[1].dy = this.players[1].pendingDy;
    this.players[2].dx = this.players[2].pendingDx;
    this.players[2].dy = this.players[2].pendingDy;

    // AI move for P2 if 1P mode
    if (this.is1Player && this.players[2].alive) {
        this.aiMove();
    }

    // Calculate new heads
    const p1Head = {
        x: this.players[1].snake[0].x + this.players[1].dx,
        y: this.players[1].snake[0].y + this.players[1].dy
    };
    const p2Head = {
        x: this.players[2].snake[0].x + this.players[2].dx,
        y: this.players[2].snake[0].y + this.players[2].dy
    };

    // Collision tracking
    let p1Dead = false;
    let p2Dead = false;
    let deathReason = { p1: null, p2: null };

    // 1. Check wall collision
    if (p1Head.x < 0 || p1Head.x >= tileCount || p1Head.y < 0 || p1Head.y >= tileCount) {
        p1Dead = true;
        deathReason.p1 = 'wall';
    }
    if (p2Head.x < 0 || p2Head.x >= tileCount || p2Head.y < 0 || p2Head.y >= tileCount) {
        p2Dead = true;
        deathReason.p2 = 'wall';
    }

    // 2. Check opponent body collision (if still alive)
    if (!p1Dead && this.players[2].alive) {
        for (let i = 0; i < this.players[2].snake.length; i++) {
            if (p1Head.x === this.players[2].snake[i].x && p1Head.y === this.players[2].snake[i].y) {
                p1Dead = true;
                deathReason.p1 = 'opponent-body';
                break;
            }
        }
    }
    if (!p2Dead && this.players[1].alive) {
        for (let i = 0; i < this.players[1].snake.length; i++) {
            if (p2Head.x === this.players[1].snake[i].x && p2Head.y === this.players[1].snake[i].y) {
                p2Dead = true;
                deathReason.p2 = 'opponent-body';
                break;
            }
        }
    }

    // 3. Check own body collision (excluding new head position)
    if (!p1Dead) {
        for (let i = 0; i < this.players[1].snake.length - 1; i++) {
            if (p1Head.x === this.players[1].snake[i].x && p1Head.y === this.players[1].snake[i].y) {
                p1Dead = true;
                deathReason.p1 = 'self';
                break;
            }
        }
    }
    if (!p2Dead) {
        for (let i = 0; i < this.players[2].snake.length - 1; i++) {
            if (p2Head.x === this.players[2].snake[i].x && p2Head.y === this.players[2].snake[i].y) {
                p2Dead = true;
                deathReason.p2 = 'self';
                break;
            }
        }
    }

    // 4. Check head-to-head collision
    if (!p1Dead && !p2Dead && p1Head.x === p2Head.x && p1Head.y === p2Head.y) {
        p1Dead = true;
        p2Dead = true;
        deathReason.p1 = 'head-to-head';
        deathReason.p2 = 'head-to-head';
    }

    // Move snakes (even if dead to preserve visual)
    if (this.players[1].alive) {
        this.players[1].snake.unshift(p1Head);

        // Check food collision
        const foodIdx = this.food.findIndex(f => f.x === p1Head.x && f.y === p1Head.y);
        if (foodIdx !== -1) {
            this.food.splice(foodIdx, 1);
            this.players[1].score += 5;
            this.players[1].foodEaten++;
            gwPlayEatSound();
            this.burstParticles(p1Head.x, p1Head.y, GridWarfare.COLORS.FOOD);
        } else {
            this.players[1].snake.pop();
        }
    }

    if (this.players[2].alive) {
        this.players[2].snake.unshift(p2Head);

        const foodIdx2 = this.food.findIndex(f => f.x === p2Head.x && f.y === p2Head.y);
        if (foodIdx2 !== -1) {
            this.food.splice(foodIdx2, 1);
            this.players[2].score += 5;
            this.players[2].foodEaten++;
            gwPlayEatSound();
            this.burstParticles(p2Head.x, p2Head.y, GridWarfare.COLORS.FOOD);
        } else {
            this.players[2].snake.pop();
        }
    }

    // Handle deaths
    if (p1Dead && this.players[1].alive) {
        this.handleDeath(1, deathReason.p1);
    }
    if (p2Dead && this.players[2].alive) {
        this.handleDeath(2, deathReason.p2);
    }

    // Update HUD
    this.updateHUD();
};

GridWarfare.handleDeath = function(player, reason) {
    const opponent = player === 1 ? 2 : 1;
    this.players[player].alive = false;

    gwPlayDeathSound();
    this.screenShake();

    // Burst particles from dead snake
    this.players[player].snake.forEach(seg => {
        this.burstParticles(seg.x, seg.y, player === 1 ? GridWarfare.COLORS.P1_HEAD : GridWarfare.COLORS.P2_HEAD, 5);
    });

    // Score points for opponent
    if (reason === 'opponent-body') {
        this.players[opponent].score += 500;
    } else if (reason === 'wall' || reason === 'self') {
        this.players[opponent].score += 100;
    }

    this.updateHUD();

    // Check if round is over
    if (!this.players[1].alive || !this.players[2].alive) {
        setTimeout(() => this.endRound(reason === 'head-to-head' ? null : opponent), 1000);
    }
};

GridWarfare.endRound = function(winner) {
    // Stop game loop temporarily
    if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
    }

    const isDraw = winner === null;

    if (isDraw) {
        // Both get survival bonus, round doesn't count
        this.players[1].score += 25;
        this.players[2].score += 25;
        this.showRoundAnnounce('DRAW!');
    } else {
        // Winner gets a round
        this.players[winner].wins++;
        gwPlayRoundWinSound();
        this.showRoundAnnounce(`PLAYER ${winner} WINS ROUND!`);

        // Check for match win
        if (this.players[winner].wins >= this.roundsToWin) {
            setTimeout(() => this.endMatch(winner), 2000);
            return;
        }
    }

    this.updateHUD();

    // Next round after delay
    setTimeout(() => {
        if (!this.matchOver) {
            this.currentRound++;
            this.startRound();
        }
    }, 3000);
};

GridWarfare.showRoundAnnounce = function(text) {
    let announce = document.getElementById('grid-round-announce');
    if (!announce) {
        const wrapper = document.querySelector('.canvas-wrapper');
        announce = document.createElement('div');
        announce.id = 'grid-round-announce';
        wrapper.appendChild(announce);
    }

    announce.textContent = text;
    announce.classList.add('visible');

    setTimeout(() => {
        announce.classList.remove('visible');
    }, 2000);
};

GridWarfare.endMatch = function(winner) {
    this.matchOver = true;
    this.winner = winner;

    // Cleanup
    if (this.foodTimer) clearInterval(this.foodTimer);
    if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
    }

    gwPlayMatchWinSound();

    // Challenge progress tracking
    if (typeof ChallengeManager !== 'undefined' && winner === 1) {
        ChallengeManager.onRoundsWon(1);
        ChallengeManager.onGameEnded('grid', this.players[1].score, 0, this.players[1].snake.length, this.aiDifficulty);
    }

    // Achievement progress tracking
    if (typeof AchievementManager !== 'undefined' && winner === 1) {
        // Track total wins (this.players[1].wins is set to 5 when match won)
        AchievementManager.onGridWarfareWin(this.players[1].wins);
    }

    // Show match end screen
    document.getElementById('grid-warfare-hud')?.remove();

    const winnerText = document.getElementById('gw-winner-text');
    const p1Final = document.getElementById('gw-p1-final');
    const p2Final = document.getElementById('gw-p2-final');

    if (winner === 1) {
        winnerText.textContent = 'PLAYER 1 WINS!';
        winnerText.style.color = GridWarfare.COLORS.P1_HEAD;
    } else if (winner === 2) {
        winnerText.textContent = this.is1Player ? 'AI WINS!' : 'PLAYER 2 WINS!';
        winnerText.style.color = GridWarfare.COLORS.P2_HEAD;
    }

    p1Final.textContent = this.players[1].score;
    p2Final.textContent = this.players[2].score;

    hideAllMenus();
    document.getElementById('grid-match-end').classList.remove('hidden');

    // Burst victory particles
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            this.burstParticles(Math.random() * tileCount, Math.random() * 5, '#ffd700', 20);
        }, i * 100);
    }
};

GridWarfare.resetMatch = function() {
    this.players[1].wins = 0;
    this.players[1].score = 0;
    this.players[2].wins = 0;
    this.players[2].score = 0;
    this.currentRound = 1;
    this.matchOver = false;
    this.winner = null;
};

GridWarfare.cleanup = function() {
    this.isActive = false;
    this.matchOver = true;

    if (this.foodTimer) {
        clearInterval(this.foodTimer);
        this.foodTimer = null;
    }
    if (this.gameLoop) {
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
    }
    if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
    }

    // Remove HUD elements
    document.getElementById('grid-warfare-hud')?.remove();
    document.getElementById('grid-countdown')?.remove();
    document.getElementById('grid-round-announce')?.remove();
    document.getElementById('grid-match-end')?.classList.add('hidden');
};

// Grid Warfare Rendering
GridWarfare.render = function() {
    const profile = snakeProfiles[this.players[1].profileIndex];

    // Fill background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1a1a2e';
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

    // Draw arena border (walls)
    ctx.strokeStyle = GridWarfare.COLORS.WALL;
    ctx.lineWidth = gridSize;
    ctx.strokeRect(gridSize / 2, gridSize / 2, canvas.width - gridSize, canvas.height - gridSize);

    // Draw center line
    ctx.save();
    ctx.strokeStyle = GridWarfare.COLORS.CENTER_LINE;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.restore();

    // Draw food
    this.food.forEach(f => {
        ctx.save();
        ctx.fillStyle = GridWarfare.COLORS.FOOD;
        ctx.shadowBlur = 15;
        ctx.shadowColor = GridWarfare.COLORS.FOOD_GLOW;
        ctx.beginPath();
        const pulse = Math.sin(Date.now() / 150) * 1.5;
        ctx.arc(f.x * gridSize + gridSize / 2, f.y * gridSize + gridSize / 2, gridSize / 2 - 3 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw Player 1 snake
    this.renderSnake(1);

    // Draw Player 2 snake
    this.renderSnake(2);

    // Draw particles
    this.particles = this.particles.filter(p => {
        p.life -= 0.02;
        if (p.life <= 0) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * gridSize + gridSize / 2, p.y * gridSize + gridSize / 2, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
    });

    // Draw AI indicator
    if (this.is1Player) {
        const aiIndicator = document.createElement('div');
        aiIndicator.className = 'gw-ai-indicator';
        aiIndicator.textContent = `AI: ${this.aiDifficulty.toUpperCase()}`;
        const wrapper = document.querySelector('.canvas-wrapper');
        const existing = wrapper.querySelector('.gw-ai-indicator');
        if (existing) existing.remove();
        wrapper.appendChild(aiIndicator);
    }
};

GridWarfare.renderSnake = function(player) {
    const p = this.players[player];
    const profile = snakeProfiles[p.profileIndex];

    if (!p.alive && p.snake.length === 0) return;

    const headColor = profile.head || (player === 1 ? GridWarfare.COLORS.P1_HEAD : GridWarfare.COLORS.P2_HEAD);
    const bodyColor = profile.body || (player === 1 ? GridWarfare.COLORS.P1_BODY : GridWarfare.COLORS.P2_BODY);
    const glowColor = profile.glow || (player === 1 ? GridWarfare.COLORS.P1_GLOW : GridWarfare.COLORS.P2_GLOW);

    p.snake.forEach((seg, i) => {
        ctx.save();

        const isHead = i === 0;

        if (isHead) {
            ctx.fillStyle = headColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
        } else {
            const opacity = Math.max(0.4, 1 - (i / p.snake.length) * 0.6);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = bodyColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = glowColor;
        }

        const pad = 1;
        ctx.beginPath();
        ctx.roundRect(
            seg.x * gridSize + pad,
            seg.y * gridSize + pad,
            gridSize - pad * 2,
            gridSize - pad * 2,
            isHead ? 5 : 3
        );
        ctx.fill();

        // Draw eyes on head
        if (isHead) {
            const centerX = seg.x * gridSize + gridSize / 2;
            const centerY = seg.y * gridSize + gridSize / 2;
            const offset = 4;

            ctx.fillStyle = '#050505';
            ctx.shadowBlur = 0;

            let eye1X, eye1Y, eye2X, eye2Y;
            if (p.dx === 1) {
                eye1X = centerX + 3; eye1Y = centerY - offset;
                eye2X = centerX + 3; eye2Y = centerY + offset;
            } else if (p.dx === -1) {
                eye1X = centerX - 3; eye1Y = centerY - offset;
                eye2X = centerX - 3; eye2Y = centerY + offset;
            } else if (p.dy === 1) {
                eye1X = centerX - offset; eye1Y = centerY + 3;
                eye2X = centerX + offset; eye2Y = centerY + 3;
            } else {
                eye1X = centerX - offset; eye1Y = centerY - 3;
                eye2X = centerX + offset; eye2Y = centerY - 3;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // AI indicator pulse on P2 if AI controlled
        if (this.is1Player && player === 2 && isHead) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
            ctx.beginPath();
            ctx.arc(seg.x * gridSize + gridSize / 2, seg.y * gridSize + gridSize / 2, gridSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    });
};

GridWarfare.spawnFood = function() {
    let pos;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
        pos = {
            x: Math.floor(Math.random() * (tileCount - 2)) + 1,
            y: Math.floor(Math.random() * (tileCount - 2)) + 1
        };

        // Check not on any snake
        const onP1 = this.players[1].snake.some(s => s.x === pos.x && s.y === pos.y);
        const onP2 = this.players[2].snake.some(s => s.x === pos.x && s.y === pos.y);
        const onFood = this.food.some(f => f.x === pos.x && f.y === pos.y);

        // Minimum distance from heads
        const p1Dist = Math.abs(this.players[1].snake[0].x - pos.x) + Math.abs(this.players[1].snake[0].y - pos.y);
        const p2Dist = Math.abs(this.players[2].snake[0].x - pos.x) + Math.abs(this.players[2].snake[0].y - pos.y);

        valid = !onP1 && !onP2 && !onFood && p1Dist >= 3 && p2Dist >= 3;
        attempts++;
    }

    if (valid && pos) {
        this.food.push(pos);
    }
};

GridWarfare.burstParticles = function(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            size: Math.random() * 4 + 2,
            color,
            life: 1
        });
    }
};

GridWarfare.screenShake = function() {
    if (settings && !settings.screenShake) return;
    const machine = document.querySelector('.arcade-machine');
    if (machine) {
        machine.classList.add('shake');
        setTimeout(() => machine.classList.remove('shake'), 500);
    }
};

// Grid Warfare AI
GridWarfare.aiMove = function() {
    const p = this.players[2];
    if (!p.alive) return;

    const head = p.snake[0];
    const p1Head = this.players[1].snake[0];

    // Find nearest food
    let nearestFood = null;
    let nearestDist = Infinity;
    this.food.forEach(f => {
        const dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestFood = f;
        }
    });

    // Possible directions (avoid 180 turn)
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ].filter(d => !(d.dx === -p.dx && d.dy === -p.dy)); // No 180 turn

    // Score each direction
    const scoredDirs = directions.map(d => {
        const newX = head.x + d.dx;
        const newY = head.y + d.dy;
        let score = 0;

        // Check wall collision (fatal)
        if (newX <= 0 || newX >= tileCount - 1 || newY <= 0 || newY >= tileCount - 1) {
            score -= 1000;
        }

        // Check own body collision
        const selfCollision = p.snake.some((s, i) => i > 0 && s.x === newX && s.y === newY);
        if (selfCollision) score -= 500;

        // Check P1 body collision
        const p1Collision = this.players[1].snake.some(s => s.x === newX && s.y === newY);
        if (p1Collision) score -= 200;

        // Move toward food
        if (nearestFood) {
            const toFood = Math.abs(nearestFood.x - newX) + Math.abs(nearestFood.y - newY);
            score += (20 - toFood) * 10;
        }

        // Move toward P1 head if aggressive (harder difficulties)
        if (this.aiDifficulty === 'hard' || this.aiDifficulty === 'insane') {
            const toP1 = Math.abs(p1Head.x - newX) + Math.abs(p1Head.y - newY);
            score += (30 - toP1) * 5;
        }

        // Random factor based on difficulty
        const mistakeChance = this.aiDifficulty === 'easy' ? 0.3 :
                              this.aiDifficulty === 'medium' ? 0.15 :
                              this.aiDifficulty === 'hard' ? 0.05 : 0.02;

        if (Math.random() < mistakeChance) {
            score += Math.random() * 20;
        }

        // Avoid corners if possible
        if (newX <= 1 || newX >= tileCount - 2 || newY <= 1 || newY >= tileCount - 2) {
            score -= 30;
        }

        return { ...d, score };
    });

    // Sort by score and pick best
    scoredDirs.sort((a, b) => b.score - a.score);

    if (scoredDirs.length > 0) {
        p.pendingDx = scoredDirs[0].dx;
        p.pendingDy = scoredDirs[0].dy;
    }
};

// Input handling for Grid Warfare
function handleGridWarfareInput(e) {
    if (!GridWarfare.isActive || GridWarfare.matchOver || GridWarfare.isCountingDown) return;

    const p1 = GridWarfare.players[1];
    const p2 = GridWarfare.players[2];

    // Player 1: WASD + Space
    if (e.key === 'w' || e.key === 'W') {
        if (p1.pendingDy !== 1) {
            p1.pendingDx = 0;
            p1.pendingDy = -1;
        }
    } else if (e.key === 's' || e.key === 'S') {
        if (p1.pendingDy !== -1) {
            p1.pendingDx = 0;
            p1.pendingDy = 1;
        }
    } else if (e.key === 'a' || e.key === 'A') {
        if (p1.pendingDx !== 1) {
            p1.pendingDx = -1;
            p1.pendingDy = 0;
        }
    } else if (e.key === 'd' || e.key === 'D') {
        if (p1.pendingDx !== -1) {
            p1.pendingDx = 1;
            p1.pendingDy = 0;
        }
    }

    // Player 2: Arrows + Enter
    if (!GridWarfare.is1Player && p2.alive) {
        if (e.key === 'ArrowUp') {
            if (p2.pendingDy !== 1) {
                p2.pendingDx = 0;
                p2.pendingDy = -1;
            }
        } else if (e.key === 'ArrowDown') {
            if (p2.pendingDy !== -1) {
                p2.pendingDx = 0;
                p2.pendingDy = 1;
            }
        } else if (e.key === 'ArrowLeft') {
            if (p2.pendingDx !== 1) {
                p2.pendingDx = -1;
                p2.pendingDy = 0;
            }
        } else if (e.key === 'ArrowRight') {
            if (p2.pendingDx !== -1) {
                p2.pendingDx = 1;
                p2.pendingDy = 0;
            }
        }
    }

    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE SELECTION BUTTON HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Breach mode button
document.getElementById('btn-breach')?.addEventListener('click', () => {
    selectedMode = 'breach';
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

// Neural Fit mode button
document.getElementById('btn-neural')?.addEventListener('click', () => {
    selectedMode = 'neural';
    loadNeuralUnlockProgress();
    showNeuralDrillSelect();
});

// Neural Fit drill selection back button
document.getElementById('btn-back-neural')?.addEventListener('click', () => {
    hideAllMenus();
    modeSelect.classList.remove('hidden');
    document.getElementById('btn-neural').focus();
});

// Neural Fit results buttons
document.getElementById('btn-neural-retry')?.addEventListener('click', () => {
    if (NeuralFit.pendingRetryDrill) {
        hideAllMenus();
        startNeuralDrill(NeuralFit.pendingRetryDrill);
    }
});

document.getElementById('btn-neural-other')?.addEventListener('click', () => {
    hideAllMenus();
    showNeuralDrillSelect();
});

document.getElementById('btn-neural-menu')?.addEventListener('click', () => {
    hideAllMenus();
    mainMenu.classList.remove('hidden');
    document.getElementById('btn-play-menu').focus();
});

// Chronoshift mode button (if exists)
document.getElementById('btn-chronoshift')?.addEventListener('click', () => {
    selectedMode = 'chronoshift';
    hideAllMenus();
    diffSelect.classList.remove('hidden');
    document.getElementById('btn-medium').focus();
});

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOSHIFT MODE - Integrated via chronoshift_impl.js
// ═══════════════════════════════════════════════════════════════════════════

function startChronoShiftGame() {
    // Initialize ChronoShift mode
    initChronoShift(currentDifficultyLabel);

    // Initialize grid with standard snake
    initGrid();

    // Sync the game state with ChronoShift
    lastRenderTime = performance.now();
    startMusic();
    isPlaying = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL FIT DRILL DATA (from NEURAL_FIT.md spec)
// ═══════════════════════════════════════════════════════════════════════════

// Drill definitions (also in firewall_neural_modes.js but referenced here)
const DRILLS = [
    { id: 'warmup', name: 'WARM UP', duration: 30000, difficulty: 'EASY', tickRate: 200, unlocked: true },
    { id: 'figure8', name: 'FIGURE-8 SWEEP', duration: 45000, difficulty: 'MEDIUM', tickRate: 160, unlocked: true },
    { id: 'zigzag', name: 'ZIGZAG CASCADE', duration: 40000, difficulty: 'MEDIUM', tickRate: 140, unlocked: false },
    { id: 'spiral', name: 'SPIRAL IN', duration: 60000, difficulty: 'HARD', tickRate: 130, unlocked: false },
    { id: 'wave', name: 'SERPENTINE WAVE', duration: 50000, difficulty: 'HARD', tickRate: 120, unlocked: false },
    { id: 'gauntlet', name: 'THE GAUNTLET', duration: 90000, difficulty: 'INSANE', tickRate: 100, unlocked: false }
];

// ═══════════════════════════════════════════════════════════════════════════
// FIREWALL BREACH MODE STATE (from concepts.md spec)
// ═══════════════════════════════════════════════════════════════════════════

const BreachMode = {
    isActive: false,
    firewallMargin: 6,
    maxFirewallMargin: 6,
    minFirewallMargin: 0,
    firewallTickAccum: 0,
    firewallTickInterval: 10000,
    breachParticles: [],
    alarmGain: null,
    alarmOsc: null
};

// Breach mode leaderboard helpers
function getBreachLeaderboard(diff) {
    return JSON.parse(localStorage.getItem(`serpentineLB_breach_${diff}`) || '[]');
}

function addBreachHighScore(diff, score) {
    const board = getBreachLeaderboard(diff);
    board.push({ score, time: Date.now() });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(`serpentineLB_breach_${diff}`, JSON.stringify(board.slice(0, 10)));
}

// Breach mode initialization
function startBreachMode(difficulty) {
    stopMusic();
    hideAllMenus();

    const diffMap = { easy: 180, medium: 120, hard: 80, insane: 50 };
    currentDifficultySpeed = diffMap[difficulty] || 120;
    currentDifficultyLabel = difficulty;

    initGrid();

    // Start speedrun tracking for Sentinel Breach unlocks
    startSpeedrunTracking(difficulty, 'breach');

    BreachMode.isActive = true;
    BreachMode.firewallMargin = BreachMode.maxFirewallMargin;
    BreachMode.firewallTickAccum = 0;
    BreachMode.breachParticles = [];

    score = 0;
    foodEaten = 0;
    scoreElement.textContent = score;

    if (audioCtx.state === 'suspended') audioCtx.resume();
    startBreachMusic();

    isPlaying = true;
    lastRenderTime = performance.now();
}

// Breach mode music (alarm drone)
let breachMusicInterval = null;
let breachMusicStep = 0;

function startBreachMusic() {
    if (breachMusicInterval) clearInterval(breachMusicInterval);

    // Alarm oscillator
    BreachMode.alarmGain = audioCtx.createGain();
    BreachMode.alarmGain.gain.value = 0.02;
    BreachMode.alarmGain.connect(audioCtx.destination);

    BreachMode.alarmOsc = audioCtx.createOscillator();
    BreachMode.alarmOsc.type = 'sawtooth';
    BreachMode.alarmOsc.frequency.value = 55;
    BreachMode.alarmOsc.connect(BreachMode.alarmGain);
    BreachMode.alarmOsc.start();

    // Pulsing alarm every 2 seconds
    breachMusicInterval = setInterval(() => {
        if (BreachMode.alarmGain && BreachMode.isActive) {
            BreachMode.alarmGain.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
            setTimeout(() => {
                if (BreachMode.alarmGain) {
                    BreachMode.alarmGain.gain.setTargetAtTime(0.02, audioCtx.currentTime, 0.3);
                }
            }, 500);
        }
    }, 2000);
}

function stopBreachMusic() {
    if (breachMusicInterval) {
        clearInterval(breachMusicInterval);
        breachMusicInterval = null;
    }
    if (BreachMode.alarmGain) {
        BreachMode.alarmGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }
    if (BreachMode.alarmOsc) {
        BreachMode.alarmOsc.stop();
        BreachMode.alarmOsc = null;
    }
}

// Breach mode update
function updateBreachLogic(deltaTime) {
    if (!BreachMode.isActive || !isPlaying) return;

    BreachMode.firewallTickAccum += deltaTime;

    // Speed up as score increases
    const speedMultiplier = Math.max(0.3, 1 - (score * 0.001));
    const currentInterval = BreachMode.firewallTickInterval * speedMultiplier;

    if (BreachMode.firewallTickAccum >= currentInterval) {
        BreachMode.firewallTickAccum = 0;

        if (BreachMode.firewallMargin > BreachMode.minFirewallMargin) {
            BreachMode.firewallMargin--;

            // Check if snake is trapped
            const head = snake[0];
            const safeMin = BreachMode.firewallMargin;
            const safeMax = tileCount - BreachMode.firewallMargin - 1;

            if (head.x < safeMin || head.x > safeMax || head.y < safeMin || head.y > safeMax) {
                triggerBreachGameOver();
                return;
            }

            // Spawn breach particles
            spawnBreachParticles();
        }
    }

    // Update breach particles
    BreachMode.breachParticles = BreachMode.breachParticles.filter(p => {
        p.life -= deltaTime / 1000;
        if (p.life <= 0) return false;
        p.y += p.vy * deltaTime / 16;
        p.x += p.vx * deltaTime / 16;
        return true;
    });
}

function spawnBreachParticles() {
    const margin = BreachMode.firewallMargin;
    const count = 10;

    // Top edge
    for (let i = 0; i < count; i++) {
        BreachMode.breachParticles.push({
            x: Math.random() * canvas.width,
            y: margin * gridSize,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ff0000',
            life: 1.5
        });
    }
    // Bottom
    for (let i = 0; i < count; i++) {
        BreachMode.breachParticles.push({
            x: Math.random() * canvas.width,
            y: (tileCount - margin - 1) * gridSize,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 2 + 1),
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ff0000',
            life: 1.5
        });
    }
    // Left
    for (let i = 0; i < count; i++) {
        BreachMode.breachParticles.push({
            x: margin * gridSize,
            y: Math.random() * canvas.height,
            vx: Math.random() * 2 + 1,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ff0000',
            life: 1.5
        });
    }
    // Right
    for (let i = 0; i < count; i++) {
        BreachMode.breachParticles.push({
            x: (tileCount - margin - 1) * gridSize,
            y: Math.random() * canvas.height,
            vx: -(Math.random() * 2 + 1),
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff4500' : '#ff0000',
            life: 1.5
        });
    }

    playTone(100, 'square', 0.3, 0.1);
}

// Breach mode drawing
function drawBreachFirewall(time) {
    if (!BreachMode.isActive) return;

    const margin = BreachMode.firewallMargin;
    const fwX = margin * gridSize;
    const fwY = margin * gridSize;
    const fwSize = canvas.width - margin * gridSize * 2;
    const pulse = Math.sin(time / 200) * 0.3 + 0.7;

    ctx.save();

    // Top border gradient
    const gradTop = ctx.createLinearGradient(0, fwY - 20, 0, fwY + 10);
    gradTop.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradTop.addColorStop(0.5, `rgba(255, 69, 0, ${0.6 * pulse})`);
    gradTop.addColorStop(1, `rgba(255, 0, 0, ${0.3 * pulse})`);
    ctx.fillStyle = gradTop;
    ctx.fillRect(fwX, fwY - 20, fwSize, 30);

    // Bottom
    const gradBottom = ctx.createLinearGradient(0, fwY + fwSize - 10, 0, fwY + fwSize + 20);
    gradBottom.addColorStop(0, `rgba(255, 0, 0, ${0.3 * pulse})`);
    gradBottom.addColorStop(0.5, `rgba(255, 69, 0, ${0.6 * pulse})`);
    gradBottom.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(fwX, fwY + fwSize - 10, fwSize, 30);

    // Left
    const gradLeft = ctx.createLinearGradient(fwX - 20, 0, fwX + 10, 0);
    gradLeft.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradLeft.addColorStop(0.5, `rgba(255, 69, 0, ${0.6 * pulse})`);
    gradLeft.addColorStop(1, `rgba(255, 0, 0, ${0.3 * pulse})`);
    ctx.fillStyle = gradLeft;
    ctx.fillRect(fwX - 20, fwY, 30, fwSize);

    // Right
    const gradRight = ctx.createLinearGradient(fwX + fwSize - 10, 0, fwX + fwSize + 20, 0);
    gradRight.addColorStop(0, `rgba(255, 0, 0, ${0.3 * pulse})`);
    gradRight.addColorStop(0.5, `rgba(255, 69, 0, ${0.6 * pulse})`);
    gradRight.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = gradRight;
    ctx.fillRect(fwX + fwSize - 10, fwY, 30, fwSize);

    // Digital pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    const patternOffset = Math.floor(time / 100) % 3;
    for (let i = 0; i < tileCount - margin * 2; i++) {
        if ((i + patternOffset) % 3 === 0) {
            ctx.fillRect(fwX + i * gridSize, fwY, gridSize - 2, 8);
            ctx.fillRect(fwX + i * gridSize, fwY + fwSize - 8, gridSize - 2, 8);
            ctx.fillRect(fwX, fwY + i * gridSize, 8, gridSize - 2);
            ctx.fillRect(fwX + fwSize - 8, fwY + i * gridSize, 8, gridSize - 2);
        }
    }

    ctx.restore();

    // Particles
    ctx.save();
    BreachMode.breachParticles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();

    // HUD
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 20);
    const progress = BreachMode.firewallMargin / BreachMode.maxFirewallMargin;
    const barColor = progress > 0.5 ? '#00ff00' : (progress > 0.25 ? '#ffff00' : '#ff0000');
    ctx.fillStyle = barColor;
    ctx.fillRect(12, 12, 196 * progress, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Orbitron';
    ctx.fillText('FIREWALL INTEGRITY', 10, 42);
    ctx.fillText(`${Math.floor(progress * 100)}%`, 180, 42);
    ctx.restore();
}

// Breach food collision
function handleBreachFoodCollision() {
    score += 10;
    foodEaten++;
    scoreElement.textContent = score;

    // Reset consecutive deaths on eating food
    secretTracking.consecutiveDeaths = 0;

    if (BreachMode.firewallMargin < BreachMode.maxFirewallMargin) {
        BreachMode.firewallMargin++;
        showUnlockPopup('FIREWALL PUSHED BACK', '#00ff00');
        playTone(600, 'square', 0.2, 0.15);
        burstParticles(food.x, food.y, '#00ff00', 30);

        // ════ Scanline Samurai Unlock Check: 10 levels cleared ════
        // A level is "cleared" when the firewall is pushed back to max
        if (BreachMode.firewallMargin === BreachMode.maxFirewallMargin) {
            secretTracking.breachLevelsCleared++;
            if (!unlockedScanlineSamurai && secretTracking.breachLevelsCleared >= 10) {
                unlockSecretCharacter('scanline_samurai');
            }
        }
    } else {
        playEatSound();
        burstParticles(food.x, food.y);
    }

    scoreElement.style.transform = 'scale(1.4)';
    setTimeout(() => scoreElement.style.transform = 'scale(1)', 150);

    placeFood();
    currentSpeed = Math.max(currentDifficultySpeed / 2, currentDifficultySpeed - (score * 0.5));
}

// Breach game over
function triggerBreachGameOver() {
    isPlaying = false;
    stopBreachMusic();

    // ════ Secret Character Unlock Tracking ════
    secretTracking.consecutiveDeaths++;
    if (!unlockedMissingNo && secretTracking.consecutiveDeaths >= 500) {
        unlockSecretCharacter('missing_no');
    }
    secretTracking.totalDeaths++;
    if (!unlockedBlueScreen && secretTracking.totalDeaths >= 100) {
        unlockSecretCharacter('blue_screen');
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('serpentineHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    addBreachHighScore(currentDifficultyLabel, score);

    bank += score;
    localStorage.setItem('serpentineBank', bank);

    if (typeof saveManager !== 'undefined' && saveManager.profile) {
        saveManager.addToBank(score);
        saveManager.recordGameEnd({ score, foodEaten, snakeLength: snake.length, tickSpeed: currentSpeed, characterId: snakeProfiles[selectedProfileIndex]?.id, mode: 'breach' });
    }

    // ════ SENTINEL BREACH UNLOCKS ════
    // Flash Protocol: Clear Wave 20
    if (BreachMode.currentWave >= 20) {
        checkSentinelBreachUnlocks(BreachMode.currentWave);
    }

    playDeathSound();

    if (settings.screenShake && !settings.reducedMotion) {
        document.querySelector('.arcade-machine').classList.add('shake');
    }

    const particleCount = settings.particles === 'OFF' ? 0 : (settings.particles === 'LOW' ? 20 : (settings.particles === 'MEDIUM' ? 40 : 60));
    if (particleCount > 0) {
        burstParticles(snake[0].x, snake[0].y, '#ff4500', particleCount);
    }

    finalScoreElement.textContent = score;
    hideAllMenus();
    gameOverScreen.classList.remove('hidden');
    document.getElementById('restart-btn').focus();

    BreachMode.isActive = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL FIT MODE
// ═══════════════════════════════════════════════════════════════════════════

const NeuralFit = {
    isActive: false,
    currentDrill: null,
    drillStartTime: 0,
    drillElapsed: 0,
    snake: [],
    targetPath: [],
    targetIndex: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    perfectHits: 0,
    goodHits: 0,
    okHits: 0,
    misses: 0,
    accuracy: 100,
    padOsc: null,
    padGain: null,
    padLFO: null,
    snakeDx: 0,
    snakeDy: -1,
    pendingRetryDrill: null
};

// Neural Fit path generation
function generateNeuralPath(type) {
    const path = [];
    const cx = Math.floor(tileCount / 2);
    const cy = Math.floor(tileCount / 2);

    switch (type) {
        case 'warmup':
            // Simple horizontal lines
            for (let i = 0; i < 8; i++) path.push({ x: cx - 4 + i, y: cy });
            for (let i = 0; i < 4; i++) path.push({ x: cx + 4, y: cy - 2 + i });
            for (let i = 0; i < 8; i++) path.push({ x: cx + 4 - i, y: cy + 2 });
            break;
        case 'figure8':
            // Figure-8 pattern
            for (let i = 0; i < 5; i++) path.push({ x: cx + i, y: cy - 2 });
            for (let i = 0; i < 4; i++) path.push({ x: cx + 5, y: cy - 2 + i });
            for (let i = 0; i < 5; i++) path.push({ x: cx + 5 - i, y: cy + 2 });
            for (let i = 0; i < 4; i++) path.push({ x: cx - 1, y: cy + 2 - i });
            for (let i = 0; i < 5; i++) path.push({ x: cx - 1 + i, y: cy - 2 });
            break;
        case 'zigzag':
            // Sharp zigzag
            for (let i = 0; i < 10; i++) {
                path.push({ x: cx - 5 + i, y: cy });
                path.push({ x: cx - 5 + i, y: cy + 2 });
                path.push({ x: cx - 5 + i, y: cy });
                path.push({ x: cx - 5 + i, y: cy - 2 });
            }
            break;
        case 'spiral':
            // Spiral from center
            let x = cx, y = cy, radius = 1, dir = 0;
            for (let i = 0; i < 15; i++) {
                for (let j = 0; j < radius * 2; j++) {
                    if (dir === 0) x++;
                    else if (dir === 1) y++;
                    else if (dir === 2) x--;
                    else y--;
                    x = Math.max(2, Math.min(tileCount - 3, x));
                    y = Math.max(2, Math.min(tileCount - 3, y));
                    path.push({ x, y });
                }
                dir = (dir + 1) % 4;
                if (dir % 2 === 0) radius++;
            }
            break;
        case 'wave':
            // Sine wave
            for (let i = 0; i < 20; i++) {
                const y = cy + Math.round(4 * Math.sin((i / 8) * Math.PI * 2));
                path.push({ x: cx - 10 + i, y: Math.max(2, Math.min(tileCount - 3, y)) });
            }
            break;
        case 'gauntlet':
            // Combination
            for (let i = 0; i < 6; i++) path.push({ x: cx - 6 + i, y: cy });
            for (let i = 0; i < 6; i++) path.push({ x: cx + 6, y: cy - 3 + i });
            for (let i = 0; i < 6; i++) path.push({ x: cx + 6 - i, y: cy + 3 });
            for (let i = 0; i < 6; i++) path.push({ x: cx - 6, y: cy + 3 - i });
            break;
    }

    return path.slice(0, 30);
}

// Neural Fit unlock progress
function loadNeuralUnlockProgress() {
    const unlocked = JSON.parse(localStorage.getItem('serpentineUnlocked_neuralfit_drills') || '["warmup", "figure8"]');
    const bestScores = JSON.parse(localStorage.getItem('serpentineNeural_bestScores') || '{}');
    const bestAccuracy = JSON.parse(localStorage.getItem('serpentineNeural_bestAccuracy') || '{}');

    DRILLS.forEach(drill => {
        drill.unlocked = unlocked.includes(drill.id);
        drill.bestScore = bestScores[drill.id] || 0;
        drill.bestAccuracy = bestAccuracy[drill.id] || 0;
    });

    // Check unlock requirements
    DRILLS.forEach(drill => {
        if (drill.unlockRequirement) {
            const reqDrill = DRILLS.find(d => d.id === drill.unlockRequirement.drill);
            if (reqDrill && reqDrill.bestAccuracy >= drill.unlockRequirement.accuracy) {
                drill.unlocked = true;
            }
        }
    });
}

function saveNeuralUnlockProgress() {
    const unlocked = DRILLS.filter(d => d.unlocked).map(d => d.id);
    localStorage.setItem('serpentineUnlocked_neuralfit_drills', JSON.stringify(unlocked));

    const bestScores = {}, bestAccuracy = {};
    DRILLS.forEach(drill => {
        bestScores[drill.id] = drill.bestScore || 0;
        bestAccuracy[drill.id] = drill.bestAccuracy || 0;
    });
    localStorage.setItem('serpentineNeural_bestScores', JSON.stringify(bestScores));
    localStorage.setItem('serpentineNeural_bestAccuracy', JSON.stringify(bestAccuracy));
}

// Neural Fit drill selection UI
function showNeuralDrillSelect() {
    loadNeuralUnlockProgress();
    hideAllMenus();

    const drillList = document.getElementById('drill-list');
    if (!drillList) return;

    drillList.innerHTML = '';

    const drillDefs = [
        { id: 'warmup', name: 'WARM UP', duration: 30, difficulty: 'EASY', unlocked: true },
        { id: 'figure8', name: 'FIGURE-8 SWEEP', duration: 45, difficulty: 'MEDIUM', unlocked: true },
        { id: 'zigzag', name: 'ZIGZAG CASCADE', duration: 40, difficulty: 'MEDIUM', unlocked: false, req: '80% on Figure-8' },
        { id: 'spiral', name: 'SPIRAL IN', duration: 60, difficulty: 'HARD', unlocked: false, req: '85% on Zigzag' },
        { id: 'wave', name: 'SERPENTINE WAVE', duration: 50, difficulty: 'HARD', unlocked: false, req: '85% on Spiral' },
        { id: 'gauntlet', name: 'THE GAUNTLET', duration: 90, difficulty: 'INSANE', unlocked: false, req: '90% on Wave' }
    ];

    const diffColors = { 'EASY': '#00aa00', 'MEDIUM': '#ffaa00', 'HARD': '#ff4500', 'INSANE': '#ff0055' };

    drillDefs.forEach((drill, idx) => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: ${drill.unlocked ? 'rgba(102, 119, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border: 1px solid ${drill.unlocked ? 'rgba(102, 119, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 8px;
            padding: 12px 15px;
            cursor: ${drill.unlocked ? 'pointer' : 'not-allowed'};
            opacity: ${drill.unlocked ? '1' : '0.6'};
            transition: all 0.2s;
        `;

        const badge = `<span style="background: ${diffColors[drill.difficulty]}; color: #fff; font-size: 0.6rem; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">${drill.difficulty}</span>`;
        const lockIcon = !drill.unlocked ? '<span style="color: #ff4500; margin-right: 8px;">🔒</span>' : '';
        const bestScore = DRILLS[idx]?.bestScore || 0;
        const bestAcc = DRILLS[idx]?.bestAccuracy || 0;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>${lockIcon}<span style="font-size: 0.9rem; font-weight: bold;">${drill.name}</span>${badge}</div>
                <div style="font-size: 0.7rem; color: #aaa;">${drill.duration}s</div>
            </div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 4px;">
                ${drill.unlocked ? `Best: ${bestScore} pts | ${bestAcc}% acc` : `Requires: ${drill.req}`}
            </div>
        `;

        if (drill.unlocked) {
            card.addEventListener('click', () => startNeuralDrill(drill.id));
            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(102, 119, 255, 0.2)';
                playMenuNavSound();
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(102, 119, 255, 0.1)';
            });
        }

        drillList.appendChild(card);
    });

    document.getElementById('neural-select').classList.remove('hidden');
}

// Start Neural Fit drill
function startNeuralDrill(drillId) {
    hideAllMenus();

    const drillMap = {
        'warmup': { name: 'WARM UP', duration: 30000, tickRate: 200 },
        'figure8': { name: 'FIGURE-8 SWEEP', duration: 45000, tickRate: 160 },
        'zigzag': { name: 'ZIGZAG CASCADE', duration: 40000, tickRate: 140 },
        'spiral': { name: 'SPIRAL IN', duration: 60000, tickRate: 130 },
        'wave': { name: 'SERPENTINE WAVE', duration: 50000, tickRate: 120 },
        'gauntlet': { name: 'THE GAUNTLET', duration: 90000, tickRate: 100 }
    };

    const drill = drillMap[drillId];
    if (!drill) return;

    NeuralFit.isActive = true;
    NeuralFit.currentDrill = drill;
    NeuralFit.currentDrill.id = drillId;
    NeuralFit.drillStartTime = performance.now();
    NeuralFit.drillElapsed = 0;
    NeuralFit.combo = 0;
    NeuralFit.maxCombo = 0;
    NeuralFit.score = 0;
    NeuralFit.perfectHits = 0;
    NeuralFit.goodHits = 0;
    NeuralFit.okHits = 0;
    NeuralFit.misses = 0;
    NeuralFit.accuracy = 100;
    NeuralFit.snakeDx = 0;
    NeuralFit.snakeDy = -1;
    NeuralFit.pendingRetryDrill = drillId;

    const cx = Math.floor(tileCount / 2);
    const cy = Math.floor(tileCount / 2);
    NeuralFit.snake = [
        { x: cx, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy + 2 }
    ];

    NeuralFit.targetPath = generateNeuralPath(drillId);
    NeuralFit.targetIndex = 0;

    initNeuralAudio();

    isPlaying = true;
    lastRenderTime = performance.now();
}

// Neural Fit audio
function initNeuralAudio() {
    if (NeuralFit.padOsc) {
        NeuralFit.padOsc.stop();
        NeuralFit.padGain = null;
        NeuralFit.padOsc = null;
    }

    NeuralFit.padGain = audioCtx.createGain();
    NeuralFit.padGain.gain.value = 0.03;
    NeuralFit.padGain.connect(audioCtx.destination);

    NeuralFit.padOsc = audioCtx.createOscillator();
    NeuralFit.padOsc.type = 'sine';
    NeuralFit.padOsc.frequency.value = 293.66; // D4
    NeuralFit.padOsc.connect(NeuralFit.padGain);
    NeuralFit.padOsc.start();

    NeuralFit.padLFO = audioCtx.createOscillator();
    NeuralFit.padLFO.type = 'sine';
    NeuralFit.padLFO.frequency.value = 0.5;

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.01;
    NeuralFit.padLFO.connect(lfoGain);
    lfoGain.connect(NeuralFit.padGain.gain);
    NeuralFit.padLFO.start();
}

function stopNeuralAudio() {
    if (NeuralFit.padOsc) {
        NeuralFit.padOsc.stop();
        NeuralFit.padOsc = null;
    }
    if (NeuralFit.padLFO) {
        NeuralFit.padLFO.stop();
        NeuralFit.padLFO = null;
    }
    NeuralFit.padGain = null;
}

// Neural Fit sounds
function playNeuralHitSound(rating) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freqs = { perfect: 880, good: 660, ok: 440, miss: 120 };
    const vols = { perfect: 0.15, good: 0.12, ok: 0.08, miss: 0.1 };
    const durs = { perfect: 0.06, good: 0.05, ok: 0.04, miss: 0.03 };

    osc.type = 'sine';
    osc.frequency.value = freqs[rating] || 440;

    gain.gain.setValueAtTime(vols[rating] || 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + durs[rating]);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durs[rating]);
}

function playNeuralComboSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
    });
}

// Neural Fit update
function updateNeuralLogic(deltaTime) {
    if (!NeuralFit.isActive || !isPlaying) return;

    NeuralFit.drillElapsed = performance.now() - NeuralFit.drillStartTime;

    if (NeuralFit.drillElapsed >= NeuralFit.currentDrill.duration) {
        endNeuralDrill();
        return;
    }

    const tickInterval = NeuralFit.currentDrill.tickRate;
    const expectedIndex = Math.floor(NeuralFit.drillElapsed / tickInterval);

    while (NeuralFit.targetIndex < expectedIndex && NeuralFit.targetIndex < NeuralFit.targetPath.length) {
        const targetCell = NeuralFit.targetPath[NeuralFit.targetIndex];
        const playerHead = NeuralFit.snake[0];

        const dx = Math.abs(playerHead.x - targetCell.x);
        const dy = Math.abs(playerHead.y - targetCell.y);
        const distance = Math.max(dx, dy);

        if (distance === 0) {
            NeuralFit.perfectHits++;
            NeuralFit.combo++;
            NeuralFit.score += 100 * getComboMultiplier();
            playNeuralHitSound('perfect');
            burstParticles(playerHead.x, playerHead.y, '#00ffcc', 8);
        } else if (distance <= 1) {
            NeuralFit.goodHits++;
            NeuralFit.combo++;
            NeuralFit.score += 50 * getComboMultiplier();
            playNeuralHitSound('good');
        } else if (distance <= 2) {
            NeuralFit.okHits++;
            NeuralFit.combo++;
            NeuralFit.score += 25 * getComboMultiplier();
            playNeuralHitSound('ok');
        } else {
            NeuralFit.misses++;
            NeuralFit.combo = 0;
            playNeuralHitSound('miss');
            burstParticles(targetCell.x, targetCell.y, '#ff4444', 5);
        }

        if ([10, 25, 50].includes(NeuralFit.combo)) {
            playNeuralComboSound();
            showUnlockPopup(`${NeuralFit.combo}x COMBO!`, '#ffd700');
        }

        NeuralFit.maxCombo = Math.max(NeuralFit.maxCombo, NeuralFit.combo);

        const total = NeuralFit.perfectHits + NeuralFit.goodHits + NeuralFit.okHits + NeuralFit.misses;
        NeuralFit.accuracy = total > 0 ? ((NeuralFit.perfectHits * 1.0 + NeuralFit.goodHits * 0.8 + NeuralFit.okHits * 0.5) / total * 100) : 100;

        NeuralFit.targetIndex++;
    }

    // Move snake
    NeuralFit.tickAccum = (NeuralFit.tickAccum || 0) + deltaTime;
    if (NeuralFit.tickAccum >= NeuralFit.currentDrill.tickRate) {
        NeuralFit.tickAccum = 0;

        const head = NeuralFit.snake[0];
        const newHead = { x: head.x + NeuralFit.snakeDx, y: head.y + NeuralFit.snakeDy };

        if (newHead.x < 0) newHead.x = tileCount - 1;
        if (newHead.x >= tileCount) newHead.x = 0;
        if (newHead.y < 0) newHead.y = tileCount - 1;
        if (newHead.y >= tileCount) newHead.y = 0;

        NeuralFit.snake.unshift(newHead);
        NeuralFit.snake.pop();
    }

    scoreElement.textContent = NeuralFit.score;
}

function getComboMultiplier() {
    return 1 + NeuralFit.combo * 0.1;
}

// Neural Fit end
function endNeuralDrill() {
    NeuralFit.isActive = false;
    isPlaying = false;
    stopNeuralAudio();

    const drill = NeuralFit.currentDrill;
    const total = NeuralFit.perfectHits + NeuralFit.goodHits + NeuralFit.okHits + NeuralFit.misses;
    const finalAccuracy = total > 0 ? ((NeuralFit.perfectHits * 1.0 + NeuralFit.goodHits * 0.8 + NeuralFit.okHits * 0.5) / total * 100) : 100;

    let bonus = 0;
    let badge = '';

    if (NeuralFit.misses === 0) {
        bonus = 500;
        badge = 'FLAWLESS!';
    } else if (NeuralFit.misses <= 3) {
        bonus = 200;
        badge = 'CLEAN!';
    }

    NeuralFit.score += bonus;

    // Update best scores
    const drillIdx = DRILLS.findIndex(d => d.id === drill.id);
    if (drillIdx >= 0) {
        if (NeuralFit.score > (DRILLS[drillIdx].bestScore || 0)) {
            DRILLS[drillIdx].bestScore = NeuralFit.score;
        }
        if (finalAccuracy > (DRILLS[drillIdx].bestAccuracy || 0)) {
            DRILLS[drillIdx].bestAccuracy = finalAccuracy;
        }

        // Check unlocks
        const nextDrillId = ['zigzag', 'spiral', 'wave', 'gauntlet'][drillIdx];
        if (nextDrillId) {
            const nextIdx = DRILLS.findIndex(d => d.id === nextDrillId);
            if (nextIdx >= 0 && !DRILLS[nextIdx].unlocked) {
                const reqs = { zigzag: 80, spiral: 85, wave: 85, gauntlet: 90 };
                if (finalAccuracy >= reqs[nextDrillId]) {
                    DRILLS[nextIdx].unlocked = true;
                    showUnlockPopup(`${DRILLS[nextIdx].name} UNLOCKED!`, '#ffd700');
                }
            }
        }
    }

    saveNeuralUnlockProgress();

    bank += NeuralFit.score;
    localStorage.setItem('serpentineBank', bank);

    if (typeof saveManager !== 'undefined' && saveManager.profile) {
        saveManager.addToBank(NeuralFit.score);
        saveManager.recordGameEnd({ score: NeuralFit.score, foodEaten: 0, snakeLength: NeuralFit.snake.length, tickSpeed: drill.tickRate, characterId: 'neural_fit', mode: 'neural' });
    }

    showNeuralResults(drill, finalAccuracy, badge, bonus);
}

function showNeuralResults(drill, accuracy, badge, bonus) {
    hideAllMenus();

    const drillName = document.getElementById('neural-results-drill');
    if (drillName) drillName.textContent = `${drill.name}`;

    const breakdown = document.getElementById('neural-results-breakdown');
    if (breakdown) {
        breakdown.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #00ffcc;">PERFECT</span><span>${NeuralFit.perfectHits}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #88ff88;">GOOD</span><span>${NeuralFit.goodHits}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #ffff88;">OK</span><span>${NeuralFit.okHits}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ff4444;"><span>MISS</span><span>${NeuralFit.misses}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #aaa;"><span>MAX COMBO</span><span>${NeuralFit.maxCombo}x</span></div>
            ${bonus > 0 ? `<div style="display: flex; justify-content: space-between; color: #ffd700;"><span>${badge} BONUS</span><span>+${bonus}</span></div>` : ''}
        `;
    }

    const scoreEl = document.getElementById('neural-results-score');
    if (scoreEl) scoreEl.textContent = NeuralFit.score.toLocaleString();

    const accEl = document.getElementById('neural-results-accuracy');
    if (accEl) accEl.textContent = accuracy.toFixed(1) + '%';

    const badgeEl = document.getElementById('neural-results-badge');
    if (badgeEl) badgeEl.textContent = badge;

    document.getElementById('neural-results')?.classList.remove('hidden');
}

// Neural Fit rendering
function drawNeuralFit(time) {
    if (!NeuralFit.isActive) return;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(26, 26, 46, 0.25)';
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

    // Target trail
    const currentTarget = NeuralFit.targetPath[NeuralFit.targetIndex];

    NeuralFit.targetPath.forEach((cell, idx) => {
        const alpha = idx < NeuralFit.targetIndex ? 0.2 :
                      idx === NeuralFit.targetIndex ? 0.8 :
                      idx <= NeuralFit.targetIndex + 3 ? 0.4 : 0.2;

        ctx.fillStyle = `rgba(74, 74, 106, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(cell.x * gridSize + 2, cell.y * gridSize + 2, gridSize - 4, gridSize - 4, 3);
        ctx.fill();
    });

    // Active target ring
    if (currentTarget) {
        const pulse = Math.sin(time / 100) * 2;
        ctx.strokeStyle = '#8888ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#8888ff';
        ctx.beginPath();
        ctx.arc(currentTarget.x * gridSize + gridSize / 2, currentTarget.y * gridSize + gridSize / 2, gridSize / 2 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Player snake
    NeuralFit.snake.forEach((seg, idx) => {
        const isHead = idx === 0;
        ctx.fillStyle = isHead ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = isHead ? 15 : 8;
        ctx.shadowColor = isHead ? '#ffffff' : '#00ffcc';
        ctx.globalAlpha = 0.9;

        ctx.beginPath();
        ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, isHead ? 5 : 3);
        ctx.fill();

        if (isHead) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(seg.x * gridSize + gridSize / 3, seg.y * gridSize + gridSize / 4, 2, 0, Math.PI * 2);
            ctx.arc(seg.x * gridSize + gridSize * 2 / 3, seg.y * gridSize + gridSize / 4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // HUD
    drawNeuralHUD(time);
}

function drawNeuralHUD(time) {
    const drill = NeuralFit.currentDrill;
    const elapsed = NeuralFit.drillElapsed;
    const remaining = Math.max(0, drill.duration - elapsed);
    const progress = remaining / drill.duration;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 250, 50);

    ctx.fillStyle = '#6677ff';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillText(`DRILL: ${drill.name}`, 15, 28);

    ctx.fillStyle = '#333';
    ctx.fillRect(15, 35, 200, 8);
    ctx.fillStyle = progress > 0.5 ? '#00ffcc' : (progress > 0.25 ? '#ffff00' : '#ff0055');
    ctx.fillRect(15, 35, 200 * progress, 8);

    ctx.fillStyle = '#aaa';
    ctx.font = '10px Orbitron';
    ctx.fillText(`${Math.ceil(remaining / 1000)}s`, 220, 42);

    ctx.fillStyle = NeuralFit.combo >= 10 ? '#ffd700' : '#aaa';
    ctx.font = 'bold 12px Orbitron';
    ctx.fillText(`COMBO: ${NeuralFit.combo} (${getComboMultiplier().toFixed(1)}x)`, 280, 25);

    ctx.fillStyle = '#6677ff';
    ctx.fillText(`ACC: ${NeuralFit.accuracy.toFixed(1)}%`, 280, 42);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 14px Orbitron';
    ctx.fillText(`SCORE: ${NeuralFit.score}`, 280, 60);

    ctx.restore();
}

// Neural Fit keyboard input
document.addEventListener('keydown', (e) => {
    if (!NeuralFit.isActive || !isPlaying) return;

    if (e.key === 'w' || e.key === 'ArrowUp') {
        NeuralFit.snakeDx = 0;
        NeuralFit.snakeDy = -1;
    } else if (e.key === 's' || e.key === 'ArrowDown') {
        NeuralFit.snakeDx = 0;
        NeuralFit.snakeDy = 1;
    } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        NeuralFit.snakeDx = -1;
        NeuralFit.snakeDy = 0;
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
        NeuralFit.snakeDx = 1;
        NeuralFit.snakeDy = 0;
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DRAW STANDARD SNAKE (for Breach mode)
// ═══════════════════════════════════════════════════════════════════════════

function drawStandardSnake() {
    const profileForDraw = snakeProfiles[selectedProfileIndex];
    for (let index = snake.length - 1; index >= 0; index--) {
        const segment = snake[index];
        ctx.save();
        const isHead = index === 0;

        if (profileForDraw.id === 'princess') {
            drawPrincess(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'arthropod') {
            drawArthropod(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'dragon') {
            drawDragon(segment, index, isHead, index === snake.length - 1);
        // ════ CHARACTERS 11-20: Food Milestone Unlocks ════
        } else if (profileForDraw.id === 'crimson_fang') {
            drawCrimsonFang(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'cobalt_grid') {
            drawCobaltGrid(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'emerald_core') {
            drawEmeraldCore(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'void_star') {
            drawVoidStar(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'plasma_hydra') {
            drawPlasmaHydra(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'monochrome') {
            drawMonochrome(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'molten_core') {
            drawMoltenCore(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'titanium_coil') {
            drawTitaniumCoil(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'quicksilver') {
            drawQuicksilver(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'photon_dash') {
            drawPhotonDash(segment, index, isHead, index === snake.length - 1);
        // ════ CHARACTERS 21-30: Secret Unlocks ════
        } else if (profileForDraw.id === 'nokia_nostalgia') {
            drawNokiaNostalgia(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'missing_no') {
            drawMissingNo(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'dogecoin') {
            drawDogecoin(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'binary_constrictor') {
            drawBinaryConstrictor(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'the_dev') {
            drawTheDev(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'error_404') {
            drawError404(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'blue_screen') {
            drawBlueScreen(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'scanline_samurai') {
            drawScanlineSamurai(segment, index, isHead, index === snake.length - 1);
        } else if (profileForDraw.id === 'synthesizer') {
            drawSynthesizer(segment, index, isHead, index === snake.length - 1);
        } else {
            if (activePowerUp && activePowerUp.id === 'ghost') {
                ctx.globalAlpha = 0.45;
            }
            if (isHead) {
                ctx.fillStyle = colors.snakeHead;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffffff';
            } else {
                const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.8);
                ctx.globalAlpha = opacity;
                ctx.fillStyle = colors.snakeBody;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colors.snakeGlow;
            }

            const pad = 1;
            ctx.beginPath();
            ctx.roundRect(segment.x * gridSize + pad, segment.y * gridSize + pad, gridSize - pad * 2, gridSize - pad * 2, isHead ? 5 : 3);
            ctx.fill();

            if (isHead) {
                drawEyes(segment.x, segment.y);
            }
        }

        ctx.restore();
    }
}

// Initialize Grid Warfare
setupGridWarfareUI();

// Add input listener
document.addEventListener('keydown', (e) => {
    if (GridWarfare.isActive) {
        handleGridWarfareInput(e);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// CHRONOSHIFT MODE — Full Implementation
// Level 9 Protocol: Time Manipulation Survival
// ═══════════════════════════════════════════════════════════════════════════

// ── ChronoShift State ──────────────────────────────────────────────────────
const ChronoShift = {
    active: false,
    meter: 0,
    maxMeter: 1000,
    historyBuffer: [],
    maxHistoryEntries: 25,
    costs: { rewind: 500, slowmo: 200, fastforward: 300, pulse: 150 },
    durations: { slowmo: 5, fastforward: 5 },
    slowMoActive: false,
    slowMoEndTime: 0,
    ffActive: false,
    ffEndTime: 0,
    rewindInvincible: false,
    rewindInvincibleEnd: 0,
    isRewinding: false,
    rewindPhase: 0,
    rewindTimer: 0,
    timeOrbs: [],
    maxTimeOrbs: 2,
    orbSpawnInterval: 4000,
    lastOrbSpawn: 0,
    orbSpawnRate: 4000,
    startingMeter: 0,
    lastRewindTime: 0,
    usedRewind: false,
    usedSlowMo: false,
    usedFF: false,
    usedPulse: false,
    ffCompleted: false,
    slowMoScoreAccum: 0,
    timeTrail: [],
    runStartTime: 0,
    difficultyPresets: {
        easy: { costs: { rewind: 400, slowmo: 200, fastforward: 300, pulse: 150 }, orbSpawnRate: 3000, maxOrbs: 3, startingMeter: 200, durations: { slowmo: 5, fastforward: 5 }, speedMult: 1.0 },
        medium: { costs: { rewind: 500, slowmo: 200, fastforward: 300, pulse: 150 }, orbSpawnRate: 4000, maxOrbs: 2, startingMeter: 0, durations: { slowmo: 5, fastforward: 5 }, speedMult: 1.0 },
        hard: { costs: { rewind: 600, slowmo: 200, fastforward: 300, pulse: 150 }, orbSpawnRate: 5000, maxOrbs: 1, startingMeter: 0, durations: { slowmo: 4, fastforward: 4 }, speedMult: 1.0 },
        insane: { costs: { rewind: 700, slowmo: 200, fastforward: 300, pulse: 9999 }, orbSpawnRate: 6000, maxOrbs: 1, startingMeter: 0, durations: { slowmo: 4, fastforward: 4 }, speedMult: 1.2, pulseDisabled: true }
    },

    init(difficulty) {
        const preset = this.difficultyPresets[difficulty] || this.difficultyPresets.medium;
        this.active = true;
        this.meter = preset.startingMeter;
        this.historyBuffer = [];
        this.timeOrbs = [];
        this.lastOrbSpawn = Date.now();
        this.orbSpawnInterval = preset.orbSpawnRate;
        this.maxTimeOrbs = preset.maxOrbs;
        this.costs = { ...preset.costs };
        this.durations = { ...preset.durations };
        this.slowMoActive = false;
        this.ffActive = false;
        this.rewindInvincible = false;
        this.isRewinding = false;
        this.rewindPhase = 0;
        this.usedRewind = false;
        this.usedSlowMo = false;
        this.usedFF = false;
        this.usedPulse = false;
        this.ffCompleted = false;
        this.slowMoScoreAccum = 0;
        this.timeTrail = [];
        this.lastRewindTime = 0;
        this.runStartTime = Date.now();
        this.showHUD();
        this.updateHUD();
        this.updateActionButtons();
        this.startChronoMusic();
        document.querySelector('.canvas-wrapper')?.classList.add('chrono-grid-active');
    },

    end() {
        this.active = false;
        this.stopChronoMusic();
        this.hideHUD();
        document.querySelector('.canvas-wrapper')?.classList.remove('chrono-grid-active');
        const overlay = document.getElementById('temporal-overlay');
        if (overlay) overlay.className = 'temporal-overlay hidden';
    },

    snakeDeepCopy(arr) { return arr.map(s => ({ x: s.x, y: s.y })); },

    pushHistory() {
        const entry = {
            time: Date.now(),
            snake: this.snakeDeepCopy(snake),
            food: { ...food },
            powerUpFood: powerUpFood ? { ...powerUpFood } : null
        };
        this.historyBuffer.push(entry);
        if (this.historyBuffer.length > this.maxHistoryEntries) this.historyBuffer.shift();
    },

    getSpeedMultiplier() { return this.slowMoActive ? 0.4 : (this.ffActive ? 2.0 : 1.0); },
    suppressSpawns() { return this.ffActive; },

    tickUpdate() {
        if (!this.active) return;
        const now = Date.now();
        if (this.slowMoActive && now >= this.slowMoEndTime) this.endSlowMo();
        if (this.ffActive && now >= this.ffEndTime) this.endFastForward();
        if (this.rewindInvincible && now >= this.rewindInvincibleEnd) this.rewindInvincible = false;
        if (this.isRewinding) this.processRewindPhase();
        this.updateTimeTrail();
        if (!this.ffActive && this.timeOrbs.length < this.maxTimeOrbs) {
            if (now - this.lastOrbSpawn >= this.orbSpawnInterval) { this.spawnTimeOrb(); this.lastOrbSpawn = now; }
        }
        if (this.slowMoActive) {
            this.slowMoScoreAccum += 5 / 60;
            if (this.slowMoScoreAccum >= 1) {
                const pts = Math.floor(this.slowMoScoreAccum);
                score += pts; scoreElement.textContent = score;
                this.slowMoScoreAccum -= pts;
            }
        }
        this.updateHUD();
        this.updateActionButtons();
    },

    updateTimeTrail() {
        if (snake.length === 0) return;
        this.timeTrail.unshift({ x: snake[0].x, y: snake[0].y });
        if (this.timeTrail.length > 3) this.timeTrail.pop();
    },

    spawnTimeOrb() {
        let pos, attempts = 0;
        do {
            pos = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
            attempts++;
        } while (
            attempts < 50 && (
                snake.some(s => s.x === pos.x && s.y === pos.y) ||
                (food.x === pos.x && food.y === pos.y) ||
                (powerUpFood && powerUpFood.x === pos.x && powerUpFood.y === pos.y) ||
                this.timeOrbs.some(o => o.x === pos.x && o.y === pos.y)
            )
        );
        this.timeOrbs.push({ ...pos, spawnTime: Date.now() });
    },

    collectTimeOrb(orbIndex) {
        const orb = this.timeOrbs[orbIndex];
        if (!orb) return;
        this.meter = Math.min(this.maxMeter, this.meter + 200);
        score += 25; scoreElement.textContent = score;
        scoreElement.style.transform = 'scale(1.4)';
        setTimeout(() => scoreElement.style.transform = 'scale(1)', 150);
        burstParticles(orb.x, orb.y, '#ffd700', 20);
        this.playOrbChime();
        this.timeOrbs.splice(orbIndex, 1);
        this.updateHUD(); this.updateActionButtons();
    },

    playOrbChime() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.2);
    },

    checkOrbCollisions() {
        if (!this.active || snake.length === 0) return;
        const head = snake[0];
        for (let i = this.timeOrbs.length - 1; i >= 0; i--) {
            const orb = this.timeOrbs[i];
            if (head.x === orb.x && head.y === orb.y) this.collectTimeOrb(i);
        }
    },

    // REWIND
    canRewind() { return this.active && this.meter >= this.costs.rewind && this.historyBuffer.length >= 5 && !this.isRewinding && !this.slowMoActive && !this.ffActive; },
    triggerRewind() {
        if (!this.canRewind()) return false;
        this.meter -= this.costs.rewind;
        this.usedRewind = true;
        this.lastRewindTime = Date.now();
        this.playRewindSound();
        this.isRewinding = true; this.rewindPhase = 1; this.rewindTimer = 0;
        this.showChronoStatus('REVERSING...', '#ffd700');
        return true;
    },
    processRewindPhase() {
        const dt = 16;
        switch (this.rewindPhase) {
            case 1: // Freeze 0.3s
                this.rewindTimer += dt;
                if (this.rewindTimer >= 300) { this.rewindPhase = 2; this.rewindTimer = 0;
                    const overlay = document.getElementById('temporal-overlay');
                    if (overlay) { overlay.className = 'temporal-overlay rewind-flash'; setTimeout(() => { overlay.className = 'temporal-overlay hidden'; }, 600); }
                }
                break;
            case 2: // Flash 0.3s
                this.rewindTimer += dt;
                if (this.rewindTimer >= 300) {
                    if (this.historyBuffer.length > 0) {
                        const state = this.historyBuffer[0];
                        snake = this.snakeDeepCopy(state.snake);
                        food = { ...state.food };
                        powerUpFood = state.powerUpFood ? { ...state.powerUpFood } : null;
                        this.historyBuffer = [];
                    }
                    this.rewindPhase = 3; this.rewindTimer = 0;
                }
                break;
            case 3: // Brief pause 0.2s
                this.rewindTimer += dt;
                if (this.rewindTimer >= 200) { this.rewindPhase = 4; this.rewindTimer = 0;
                    this.rewindInvincible = true; this.rewindInvincibleEnd = Date.now() + 500; }
                break;
            case 4: // Invincible 0.5s
                this.rewindTimer += dt;
                if (this.rewindTimer >= 500) {
                    this.rewindInvincible = false; this.isRewinding = false; this.rewindPhase = 0;
                    this.showChronoStatus('REWIND!', '#ffd700');
                    this.updateHUD(); this.updateActionButtons();
                }
                break;
        }
    },

    // SLOW-MOTION
    canSlowMo() { return this.active && this.meter >= this.costs.slowmo && !this.slowMoActive && !this.ffActive && !this.isRewinding; },
    triggerSlowMo() {
        if (!this.canSlowMo()) return false;
        this.meter -= this.costs.slowmo;
        this.slowMoActive = true;
        this.slowMoEndTime = Date.now() + this.durations.slowmo * 1000;
        this.usedSlowMo = true;
        this.playSlowMoSound();
        this.showChronoStatus('SLOW-MO', '#4488ff');
        const overlay = document.getElementById('temporal-overlay');
        if (overlay) overlay.className = 'temporal-overlay slowmo-tint';
        if (snake.length > 0) burstParticles(snake[0].x, snake[0].y, '#4488ff', 30);
        const btn = document.getElementById('chrono-slowmo');
        if (btn) { btn.classList.remove('chrono-btn-enabled', 'chrono-btn-disabled', 'chrono-btn-rewind-ready'); btn.classList.add('chrono-btn-slowmo-active'); }
        this.updateHUD(); return true;
    },
    endSlowMo() {
        this.slowMoActive = false;
        const overlay = document.getElementById('temporal-overlay');
        if (overlay && !this.ffActive) overlay.className = 'temporal-overlay hidden';
        this.showChronoStatus('SLOW-MO END', '#4488ff');
        this.updateActionButtons();
    },

    // FAST-FORWARD
    canFastForward() { return this.active && this.meter >= this.costs.fastforward && !this.ffActive && !this.slowMoActive && !this.isRewinding; },
    triggerFastForward() {
        if (!this.canFastForward()) return false;
        this.meter -= this.costs.fastforward;
        this.ffActive = true;
        this.ffEndTime = Date.now() + this.durations.fastforward * 1000;
        this.usedFF = true;
        this.playFastForwardSound();
        this.showChronoStatus('FAST-FORWARD', '#6495ed');
        const overlay = document.getElementById('temporal-overlay');
        if (overlay) overlay.className = 'temporal-overlay ff-tint';
        const btn = document.getElementById('chrono-fastforward');
        if (btn) { btn.classList.remove('chrono-btn-enabled', 'chrono-btn-disabled', 'chrono-btn-rewind-ready'); btn.classList.add('chrono-btn-ff-active'); }
        this.updateHUD(); return true;
    },
    endFastForward() {
        this.ffActive = false; this.ffCompleted = true;
        const overlay = document.getElementById('temporal-overlay');
        if (overlay && !this.slowMoActive) overlay.className = 'temporal-overlay hidden';
        score += 200; scoreElement.textContent = score;
        this.showChronoStatus('CAUGHT UP +200', '#6495ed');
        this.updateActionButtons();
    },

    // TEMPORAL PULSE
    canPulse() { return this.active && this.meter >= this.costs.pulse && !this.isRewinding && !this.slowMoActive && !this.ffActive; },
    triggerPulse() {
        if (!this.canPulse()) return false;
        this.meter -= this.costs.pulse;
        this.usedPulse = true;
        if (food) {
            let newPos, attempts = 0;
            do { newPos = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; attempts++; }
            while (attempts < 50 && snake.some(s => s.x === newPos.x && s.y === newPos.y));
            food = newPos;
        }
        this.playPulseSound();
        const overlay = document.getElementById('temporal-overlay');
        if (overlay) { overlay.className = 'temporal-overlay pulse-flash'; setTimeout(() => { overlay.className = 'temporal-overlay hidden'; }, 400); }
        this.showChronoStatus('PULSE!', '#ffffff');
        this.updateHUD(); this.updateActionButtons();
        return true;
    },

    useChronoAction(type) {
        switch (type) {
            case 'rewind': return this.triggerRewind();
            case 'slowmo': return this.triggerSlowMo();
            case 'fastforward': return this.triggerFastForward();
            case 'pulse': return this.triggerPulse();
        }
        return false;
    },

    checkSurvivalBonus() {
        if (this.usedRewind && this.lastRewindTime > 0 && Date.now() - this.lastRewindTime >= 10000) {
            score += 500; scoreElement.textContent = score;
            scoreElement.style.transform = 'scale(1.6)';
            setTimeout(() => scoreElement.style.transform = 'scale(1)', 200);
            const overlay = document.getElementById('temporal-overlay');
            if (overlay) { overlay.className = 'temporal-overlay survival-bonus'; setTimeout(() => { overlay.className = 'temporal-overlay hidden'; }, 1000); }
            this.showChronoStatus('TEMPORAL COMEBACK +500', '#ffd700');
            this.lastRewindTime = 0;
        }
    },

    checkTemporalMasteryBonus() {
        if (this.usedRewind && this.usedSlowMo && this.usedFF && this.usedPulse) {
            score += 300; scoreElement.textContent = score;
            this.showChronoStatus('TEMPORAL MASTERY +300', '#00ffff');
        }
    },

    // HUD Management
    showHUD() {
        const hud = document.getElementById('chrono-hud');
        if (hud) hud.classList.remove('hidden');
        const rc = document.getElementById('rewind-cost'), sc = document.getElementById('slowmo-cost'), fc = document.getElementById('fastforward-cost'), pc = document.getElementById('pulse-cost'), pb = document.getElementById('chrono-pulse');
        if (rc) rc.textContent = this.costs.rewind;
        if (sc) sc.textContent = this.costs.slowmo;
        if (fc) fc.textContent = this.costs.fastforward;
        if (this.costs.pulse >= 9999) { if (pb) pb.disabled = true; if (pc) pc.textContent = 'N/A'; }
        else if (pc) pc.textContent = this.costs.pulse;
    },

    hideHUD() {
        const hud = document.getElementById('chrono-hud');
        if (hud) hud.classList.add('hidden');
        const status = document.getElementById('chrono-status');
        if (status) status.classList.add('hidden');
    },

    updateHUD() {
        if (!this.active) return;
        const pct = (this.meter / this.maxMeter) * 100;
        const fill = document.getElementById('chrono-bar-fill');
        const glow = document.querySelector('.chrono-bar-glow');
        const value = document.getElementById('chrono-value');
        if (fill) fill.style.width = pct + '%';
        if (glow) glow.style.width = pct + '%';
        if (value) value.textContent = Math.floor(this.meter);
        const statusEl = document.getElementById('chrono-status');
        if (statusEl) {
            if (this.slowMoActive) {
                const remaining = Math.max(0, (this.slowMoEndTime - Date.now()) / 1000).toFixed(1);
                statusEl.textContent = `SLOW-MO: ${remaining}s`; statusEl.classList.remove('hidden');
            } else if (this.ffActive) {
                const remaining = Math.max(0, (this.ffEndTime - Date.now()) / 1000).toFixed(1);
                statusEl.textContent = `FAST-FWD: ${remaining}s`; statusEl.classList.remove('hidden');
            } else { statusEl.classList.add('hidden'); }
        }
    },

    updateActionButtons() {
        if (!this.active) return;
        const updateBtn = (id, enabled, specialClass) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.classList.remove('chrono-btn-enabled', 'chrono-btn-disabled', 'chrono-btn-rewind-ready', 'chrono-btn-slowmo-active', 'chrono-btn-ff-active');
            if (specialClass) btn.classList.add(specialClass);
            else if (enabled) btn.classList.add('chrono-btn-enabled');
            else btn.classList.add('chrono-btn-disabled');
            btn.disabled = !enabled;
        };
        const canRewind = this.canRewind();
        updateBtn('chrono-rewind', canRewind, canRewind ? 'chrono-btn-rewind-ready' : null);
        updateBtn('chrono-slowmo', this.canSlowMo(), this.slowMoActive ? 'chrono-btn-slowmo-active' : null);
        updateBtn('chrono-fastforward', this.canFastForward(), this.ffActive ? 'chrono-btn-ff-active' : null);
        updateBtn('chrono-pulse', this.canPulse(), null);
    },

    showChronoStatus(text, color) {
        const statusEl = document.getElementById('chrono-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.style.color = color || '#00ffff';
            statusEl.style.textShadow = `0 0 15px ${color || '#00ffff'}`;
            statusEl.classList.remove('hidden');
            statusEl.style.animation = 'none';
            requestAnimationFrame(() => { statusEl.style.animation = ''; });
            setTimeout(() => { if (statusEl.textContent === text) statusEl.classList.add('hidden'); }, 2000);
        }
    },

    // Sounds
    playRewindSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.5);
        setTimeout(() => { playTone(1200, 'square', 0.05, 0.1); setTimeout(() => playTone(600, 'square', 0.05, 0.08), 50); }, 300);
    },

    playSlowMoSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.4);
    },

    playFastForwardSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.3);
    },

    playPulseSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const bufSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.15;
        source.connect(gain); gain.connect(audioCtx.destination);
        source.start(now);
    },

    // Ambient Music
    chronoMusicGain: null,
    chronoMusicInterval: null,
    chronoStep: 0,

    startChronoMusic() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        this.stopChronoMusic();
        this.chronoMusicGain = audioCtx.createGain();
        this.chronoMusicGain.gain.value = 0.35;
        this.chronoMusicGain.connect(audioCtx.destination);
        this.chronoStep = 0;
        this.chronoMusicInterval = setInterval(() => {
            if (!isPlaying || !this.active) return;
            const time = audioCtx.currentTime;
            const step = this.chronoStep;

            // Bass drone A1
            if (step % 4 === 0) {
                const bassOsc = audioCtx.createOscillator();
                const bassGain = audioCtx.createGain();
                const bassFilter = audioCtx.createBiquadFilter();
                bassOsc.type = 'sawtooth'; bassOsc.frequency.value = 55;
                bassFilter.type = 'lowpass'; bassFilter.frequency.value = 200;
                bassGain.gain.setValueAtTime(0.4, time);
                bassGain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);
                bassOsc.connect(bassFilter); bassFilter.connect(bassGain); bassGain.connect(this.chronoMusicGain);
                bassOsc.start(time); bassOsc.stop(time + 1.2);

                const harmOsc = audioCtx.createOscillator();
                const harmGain = audioCtx.createGain();
                harmOsc.type = 'triangle'; harmOsc.frequency.value = 110;
                harmGain.gain.setValueAtTime(0.15, time);
                harmGain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
                harmOsc.connect(harmGain); harmGain.connect(this.chronoMusicGain);
                harmOsc.start(time); harmOsc.stop(time + 0.8);
            }

            // Eerie arpeggio (A minor)
            const arpNotes = [220, 261.63, 329.63, 392.00];
            const arpIdx = step % 8;
            if (arpIdx < 4) {
                const freq = arpNotes[arpIdx];
                const arpOsc = audioCtx.createOscillator();
                const arpGain = audioCtx.createGain();
                const arpFilter = audioCtx.createBiquadFilter();
                arpOsc.type = 'square'; arpOsc.frequency.value = freq * 2;
                arpFilter.type = 'bandpass'; arpFilter.frequency.value = freq * 2; arpFilter.Q.value = 5;
                arpGain.gain.setValueToTime(0.12, time);
                arpGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                arpOsc.connect(arpFilter); arpFilter.connect(arpGain); arpGain.connect(this.chronoMusicGain);
                arpOsc.start(time); arpOsc.stop(time + 0.2);
            }

            // Reverse cymbal every 8 steps
            if (step % 8 === 4) {
                const bufSize = audioCtx.sampleRate * 0.3;
                const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (i / bufSize) * Math.exp(-(bufSize - i) / (bufSize * 0.3));
                const cymSrc = audioCtx.createBufferSource();
                cymSrc.buffer = buf;
                const cymGain = audioCtx.createGain();
                const cymFilter = audioCtx.createBiquadFilter();
                cymFilter.type = 'highpass'; cymFilter.frequency.value = 6000;
                cymGain.gain.value = 0.08;
                cymSrc.connect(cymFilter); cymFilter.connect(cymGain); cymGain.connect(this.chronoMusicGain);
                cymSrc.start(time);
            }

            // Heartbeat every 16 steps
            if (step % 16 === 0) {
                const hbOsc = audioCtx.createOscillator();
                const hbGain = audioCtx.createGain();
                hbOsc.type = 'sine'; hbOsc.frequency.value = 60;
                hbGain.gain.setValueAtTime(0.5, time);
                hbGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                hbOsc.connect(hbGain); hbGain.connect(this.chronoMusicGain);
                hbOsc.start(time); hbOsc.stop(time + 0.1);
                setTimeout(() => {
                    if (!isPlaying || !this.active) return;
                    const hb2 = audioCtx.createOscillator();
                    const hb2g = audioCtx.createGain();
                    hb2.type = 'sine'; hb2.frequency.value = 50;
                    hb2g.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    hb2g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
                    hb2.connect(hb2g); hb2g.connect(this.chronoMusicGain);
                    hb2.start(audioCtx.currentTime); hb2.stop(audioCtx.currentTime + 0.08);
                }, 150);
            }

            // Clock tick every 2 steps
            if (step % 2 === 0) {
                const tOsc = audioCtx.createOscillator();
                const tGain = audioCtx.createGain();
                tOsc.type = 'sine'; tOsc.frequency.value = 2000;
                tGain.gain.setValueAtTime(0.03, time);
                tGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
                tOsc.connect(tGain); tGain.connect(this.chronoMusicGain);
                tOsc.start(time); tOsc.stop(time + 0.03);
            }

            this.chronoStep = (this.chronoStep + 1) % 64;
        }, 200);
    },

    stopChronoMusic() {
        if (this.chronoMusicInterval) { clearInterval(this.chronoMusicInterval); this.chronoMusicInterval = null; }
        if (this.chronoMusicGain) { this.chronoMusicGain.disconnect(); this.chronoMusicGain = null; }
    },

    // Drawing
    drawTimeOrbs(ctx) {
        const now = Date.now();
        this.timeOrbs.forEach(orb => {
            const pulse = Math.sin(now / 150 + orb.x) * 2;
            const rotOffset = (now / 1000 + orb.x) % (Math.PI * 2);
            ctx.save();
            ctx.shadowBlur = 20; ctx.shadowColor = '#ffd700';
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(orb.x * gridSize + gridSize / 2, orb.y * gridSize + gridSize / 2, gridSize / 2 + 4 + pulse * 0.5, rotOffset, rotOffset + Math.PI * 1.5);
            ctx.stroke();
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(orb.x * gridSize + gridSize / 2, orb.y * gridSize + gridSize / 2, gridSize / 2 - 3 + pulse * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(orb.x * gridSize + gridSize / 2, orb.y * gridSize + gridSize / 2, gridSize / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    },

    drawTimeTrail(ctx) {
        if (!this.active || this.timeTrail.length < 2) return;
        this.timeTrail.forEach((pos, i) => {
            const alpha = 0.2 * (1 - i / this.timeTrail.length);
            ctx.save();
            ctx.globalAlpha = alpha; ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.roundRect(pos.x * gridSize + 2, pos.y * gridSize + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
            ctx.restore();
        });
    },

    drawSlowMoHalo(ctx) {
        if (!this.slowMoActive || snake.length === 0) return;
        const head = snake[0];
        const cx = head.x * gridSize + gridSize / 2;
        const cy = head.y * gridSize + gridSize / 2;
        const pulse = Math.sin(Date.now() / 200) * 3;
        ctx.save();
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2;
        ctx.shadowBlur = 15; ctx.shadowColor = '#4488ff'; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, gridSize + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    drawChronoGrid(ctx) {
        const now = Date.now();
        const pulse = Math.sin(now / 1000) * 0.3 + 0.7;
        ctx.save();
        ctx.strokeStyle = `rgba(0, 200, 220, ${0.15 * pulse})`; ctx.lineWidth = 1;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
        }
        ctx.restore();
    },

    getRunBonus() {
        let bonus = 1000;
        if (this.usedRewind && this.usedSlowMo && this.usedFF && this.usedPulse) bonus += 300;
        return bonus;
    },

    recordGameEndChrono() {
        if (!this.active) return;
        const bonus = this.getRunBonus();
        if (bonus > 0) score += bonus;
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.addToBank(score);
            saveManager.recordGameEnd({
                score, foodEaten, snakeLength: snake.length,
                tickSpeed: currentSpeed,
                characterId: snakeProfiles[selectedProfileIndex]?.id || 'neon',
                mode: 'chronoshift'
            });
        }
    }
};

// ── ChronoShift game flow ──────────────────────────────────────────────────────
window.startChronoShiftGame = function() {
    if (ChronoShift.active) ChronoShift.end();
    isPlaying = true; isEnteringInitials = false;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    hideAllMenus();
    document.querySelector('.arcade-machine')?.classList.remove('shake');
    initGrid();
    lastRenderTime = performance.now();
    ChronoShift.init(currentDifficultyLabel);
    // Start speedrun tracking for ChronoShift unlocks
    startSpeedrunTracking(currentDifficultyLabel, 'chronoshift');
};

window.triggerChronoShiftGameOver = function() {
    isPlaying = false; isPaused = false;
    ChronoShift.recordGameEndChrono();
    ChronoShift.checkSurvivalBonus();
    ChronoShift.checkTemporalMasteryBonus();
    ChronoShift.end();
    stopMusic();
    playDeathSound();

    setTimeout(() => { if (!isPlaying) startMenuMusic(); }, 3000);

    if (settings.screenShake && !settings.reducedMotion) {
        document.querySelector('.arcade-machine')?.classList.add('shake');
    }

    const particleCount = settings.particles === 'OFF' ? 0 : (settings.particles === 'LOW' ? 20 : (settings.particles === 'MEDIUM' ? 40 : 60));
    if (particleCount > 0 && snake.length > 0) {
        for (let i = 0; i < particleCount; i++) {
            const p = new Particle(snake[0].x, snake[0].y, colors.snakeHead);
            p.vx = -Math.cos(Math.random() * Math.PI * 2) * (Math.random() * 4 + 1);
            p.vy = -Math.sin(Math.random() * Math.PI * 2) * (Math.random() * 4 + 1);
            p.color = i % 2 === 0 ? '#00ffff' : colors.snakeHead;
            particles.push(p);
        }
    }

    if (score > highScore) {
        highScore = score; localStorage.setItem('serpentineHighScore', highScore);
        highScoreElement.textContent = highScore; scoreElement.style.color = colors.accent;
        for (let i = 0; i < 3; i++) setTimeout(() => burstParticles(Math.random() * tileCount, Math.random() * tileCount, colors.accent, 30), i * 300);
    } else { scoreElement.style.color = colors.snakeBody; }

    finalScoreElement.textContent = score;
    mercyAvailable = score > 0;
    continueBtn.style.display = mercyAvailable ? 'block' : 'none';
    bank += score; localStorage.setItem('serpentineBank', bank);

    // ════ CHRONOSHIFT SPECIFIC UNLOCKS ════
    // Quantum Leap: Complete ChronoShift without rewind
    // Warp Python: Complete ChronoShift Insane under 120s
    const runDuration = (Date.now() - speedrunStartTime) / 1000;
    checkChronoShiftUnlocks(ChronoShift.usedRewind, runDuration, ChronoShift.difficulty);

    // Challenge progress tracking
    if (typeof ChallengeManager !== 'undefined') {
        ChallengeManager.onGameEnded('chronoshift', score, foodEaten, snake.length, currentDifficultyLabel);
        ChallengeManager.onFoodCollected(foodEaten);
        ChallengeManager.onScoreReached(score, 'chronoshift');
        ChallengeManager.onSurvivedTime(Math.floor(runDuration));
        ChallengeManager.onChronoRewindUsed(ChronoShift.usedRewind);
    }

    const savedChronoMeter = ChronoShift.meter;

    window.useMercy = function() {
        if (!mercyAvailable) return;
        score = Math.floor(score / 2); scoreElement.textContent = score;
        mercyAvailable = false; continueBtn.style.display = 'none';
        deactivatePowerUp();
        const headX = snake[0].x, headY = snake[0].y;
        snake = [{ x: headX, y: headY }];
        for (let i = 0; i < 2; i++) snake.push({ x: headX - dx * (i + 1), y: headY - dy * (i + 1) });
        currentSpeed = currentDifficultySpeed;
        ChronoShift.active = true; ChronoShift.meter = savedChronoMeter;
        ChronoShift.historyBuffer = []; ChronoShift.slowMoActive = false;
        ChronoShift.ffActive = false; ChronoShift.rewindInvincible = false;
        ChronoShift.showHUD(); ChronoShift.updateHUD(); ChronoShift.updateActionButtons();
        ChronoShift.startChronoMusic();
        document.querySelector('.canvas-wrapper')?.classList.add('chrono-grid-active');
        hideAllMenus(); isPlaying = true; isPaused = false;
        lastRenderTime = performance.now();
    };

    const chronoDiff = 'chronoshift_' + currentDifficultyLabel;
    const profile = snakeProfiles[selectedProfileIndex];
    setTimeout(() => {
        if (isHighScore(chronoDiff, score)) {
            if (profile?.isCheater) { addHighScore(chronoDiff, 'CTR', score, true); gameOverScreen.classList.remove('hidden'); }
            else {
                isEnteringInitials = true; initialsChars = [0, 0, 0]; initialsSlot = 0;
                pendingHighScoreDiff = chronoDiff; pendingHighScoreValue = score;
                updateInitialsDisplay();
                document.getElementById('initials-score').textContent = score;
                initialsScreen.classList.remove('hidden');
            }
        } else { gameOverScreen.classList.remove('hidden'); }
    }, 1500);
};

// ── Hook updateLogic ──────────────────────────────────────────────────────────
const _origUpdateLogic = updateLogic;
window.updateLogic = function() {
    if (ChronoShift.active && !ChronoShift.isRewinding) ChronoShift.pushHistory();
    if (ChronoShift.active && ChronoShift.isRewinding) { ChronoShift.tickUpdate(); return; }
    if (ChronoShift.active) ChronoShift.checkOrbCollisions();
    _origUpdateLogic();
    if (ChronoShift.active) ChronoShift.tickUpdate();
};

// ── Hook triggerGameOver ──────────────────────────────────────────────────────
const _origTriggerGameOver = triggerGameOver;
window.triggerGameOver = function() {
    if (ChronoShift.active) { triggerChronoShiftGameOver(); return; }
    _origTriggerGameOver();
};

// ── Hook draw ────────────────────────────────────────────────────────────────
const _origDraw = draw;
window.draw = function() {
    _origDraw();
    if (ChronoShift.active && isPlaying) {
        ChronoShift.drawTimeTrail(ctx);
        ChronoShift.drawTimeOrbs(ctx);
        ChronoShift.drawSlowMoHalo(ctx);
        ChronoShift.drawChronoGrid(ctx);
    }
};

// ── ChronoShift keyboard bindings ────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (!ChronoShift.active || !isPlaying || isPaused || isEnteringInitials) return;
    switch (e.key) {
        case 'q': case 'Q': ChronoShift.useChronoAction('rewind'); break;
        case 'w': case 'W': ChronoShift.useChronoAction('slowmo'); break;
        case 'e': case 'E': ChronoShift.useChronoAction('fastforward'); break;
        case 'r': case 'R': ChronoShift.useChronoAction('pulse'); break;
    }
});

// ── ChronoShift button bindings ──────────────────────────────────────────────
document.getElementById('chrono-rewind')?.addEventListener('click', () => { if (ChronoShift.active) ChronoShift.useChronoAction('rewind'); });
document.getElementById('chrono-slowmo')?.addEventListener('click', () => { if (ChronoShift.active) ChronoShift.useChronoAction('slowmo'); });
document.getElementById('chrono-fastforward')?.addEventListener('click', () => { if (ChronoShift.active) ChronoShift.useChronoAction('fastforward'); });
document.getElementById("chrono-pulse")?.addEventListener("click", () => { if (ChronoShift.active) ChronoShift.useChronoAction("pulse"); });

// Start global animation loop
hideAllMenus();
document.getElementById("init-screen").classList.remove("hidden");
document.getElementById("btn-initialize").focus();
updateProfileStyle();
initGrid();
window.requestAnimationFrame(main);

// ── Replay Code Paste Input ─────────────────────────────────────────────────
document.getElementById('replay-code-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const code = document.getElementById('replay-code-input')?.value?.trim();
        if (code && typeof ReplaySystem !== 'undefined') {
            if (ReplaySystem.startCinematicReplay(code, () => {
                // On replay complete, show main menu
                hideAllMenus();
                mainMenu.classList.remove('hidden');
            })) {
                // Replay started, hide main menu
                document.getElementById('replay-paste-section').style.display = 'none';
                playMenuSelectSound();
            } else {
                showNotification('INVALID REPLAY CODE', '#ff0055');
            }
        }
    }
});

document.getElementById('btn-load-replay')?.addEventListener('click', () => {
    const input = document.getElementById('replay-code-input');
    if (input) {
        const code = input.value?.trim();
        if (code && typeof ReplaySystem !== 'undefined') {
            if (ReplaySystem.startCinematicReplay(code, () => {
                hideAllMenus();
                mainMenu.classList.remove('hidden');
            })) {
                document.getElementById('replay-paste-section').style.display = 'none';
                playMenuSelectSound();
            } else {
                showNotification('INVALID REPLAY CODE', '#ff0055');
            }
        }
    }
});

// Show replay input when main menu is shown (if there's a code in clipboard)
const replayInputSection = document.getElementById('replay-paste-section');
if (replayInputSection) {
    const mainMenuObserver = new MutationObserver((mutations) => {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu && !mainMenu.classList.contains('hidden')) {
            // Main menu is visible, show replay input
            replayInputSection.style.display = 'block';
        }
    });
    mainMenuObserver.observe(document.getElementById('main-menu'), { attributes: true, attributeFilter: ['class'] });
}
