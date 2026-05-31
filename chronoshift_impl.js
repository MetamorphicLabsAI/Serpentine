// ═══════════════════════════════════════════════════════════════════════════
// CHRONOSHIFT MODE IMPLEMENTATION
// Time-Manipulation Survival Game Mode
// ═══════════════════════════════════════════════════════════════════════════

// ── ChronoShift State ──────────────────────────────────────────────────────

const ChronoShift = {
    active: false,
    paused: false,

    // Chrono-Meter
    chronoMeter: 0,
    chronoMax: 1000,

    // History Buffer (last 25 states = ~3 seconds at 120ms tick)
    historyBuffer: [],
    historyMaxLength: 25,

    // Temporal Action State
    slowMoActive: false,
    slowMoTimer: 0,
    slowMoDuration: 5000, // 5 seconds
    slowMoMultiplier: 0.4,

    fastForwardActive: false,
    fastForwardTimer: 0,
    fastForwardDuration: 5000, // 5 seconds
    fastForwardMultiplier: 2.0,

    temporalPulseCooldown: 0,

    // Rewind State
    rewindInProgress: false,
    rewindPhase: null, // 'freeze', 'desaturate', 'restore', 'invincible'
    rewindTimer: 0,
    invincibilityTimer: 0,
    survivalBonusTimer: 0,
    survivalBonusRequired: 10000, // 10 seconds in ms
    survivalBonusAwarded: false,
    rewindCount: 0,

    // Time Orbs
    timeOrbs: [],
    maxTimeOrbs: 2,
    timeOrbSpawnTimer: 0,

    // Visual State
    timeTrail: [], // Last 3 positions for afterimage
    gridPulseTimer: 0,

    // Scoring
    chronoScore: 0, // Separate chrono score tracking
    slowMoScoreAccum: 0,
    temporalMasteryUsed: { rewind: false, slowmo: false, fastforward: false, pulse: false },

    // Difficulty Settings
    difficulty: 'medium',
    difficultySettings: {
        easy: {
            orbSpawnInterval: 3000,
            maxOrbs: 3,
            rewindCost: 400,
            slowMoCost: 200,
            fastForwardCost: 300,
            pulseCost: 150,
            pulseEnabled: true,
            startChrono: 200,
            slowMoDuration: 5000,
            fastForwardDuration: 5000
        },
        medium: {
            orbSpawnInterval: 4000,
            maxOrbs: 2,
            rewindCost: 500,
            slowMoCost: 200,
            fastForwardCost: 300,
            pulseCost: 150,
            pulseEnabled: true,
            startChrono: 0,
            slowMoDuration: 5000,
            fastForwardDuration: 5000
        },
        hard: {
            orbSpawnInterval: 5000,
            maxOrbs: 1,
            rewindCost: 600,
            slowMoCost: 200,
            fastForwardCost: 300,
            pulseCost: 150,
            pulseEnabled: true,
            startChrono: 0,
            slowMoDuration: 4000,
            fastForwardDuration: 4000
        },
        insane: {
            orbSpawnInterval: 6000,
            maxOrbs: 1,
            rewindCost: 700,
            slowMoCost: 200,
            fastForwardCost: 300,
            pulseCost: 999, // Disabled
            pulseEnabled: false,
            startChrono: 0,
            slowMoDuration: 4000,
            fastForwardDuration: 4000,
            speedBoost: 1.25 // 25% faster (0.8 multiplier = 1/0.8 = 1.25x speed)
        }
    }
};

// ── ChronoShift Initialization ─────────────────────────────────────────────

function initChronoShift(difficulty) {
    const settings = ChronoShift.difficultySettings[difficulty] || ChronoShift.difficultySettings.medium;

    ChronoShift.active = true;
    ChronoShift.paused = false;
    ChronoShift.difficulty = difficulty;
    ChronoShift.chronoStartTime = Date.now(); // Track start time for survival achievements

    // Reset chrono meter
    ChronoShift.chronoMeter = settings.startChrono;

    // Clear history buffer
    ChronoShift.historyBuffer = [];

    // Reset temporal states
    ChronoShift.slowMoActive = false;
    ChronoShift.slowMoTimer = 0;
    ChronoShift.slowMoDuration = settings.slowMoDuration;

    ChronoShift.fastForwardActive = false;
    ChronoShift.fastForwardTimer = 0;
    ChronoShift.fastForwardDuration = settings.fastForwardDuration;

    ChronoShift.temporalPulseCooldown = 0;

    // Reset rewind state
    ChronoShift.rewindInProgress = false;
    ChronoShift.rewindPhase = null;
    ChronoShift.invincibilityTimer = 0;
    ChronoShift.survivalBonusTimer = 0;
    ChronoShift.survivalBonusAwarded = false;
    ChronoShift.rewindCount = 0;

    // Reset time orbs
    ChronoShift.timeOrbs = [];
    ChronoShift.timeOrbSpawnTimer = 0;

    // Reset time trail
    ChronoShift.timeTrail = [];

    // Reset scoring
    ChronoShift.chronoScore = 0;
    ChronoShift.slowMoScoreAccum = 0;
    ChronoShift.temporalMasteryUsed = { rewind: false, slowmo: false, fastforward: false, pulse: false };

    // Start achievement tracking for this run
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.startRun('chronoshift');
    }

    // Show chrono HUD
    document.getElementById('chrono-hud').classList.remove('hidden');
    document.querySelector('.canvas-wrapper').classList.add('chrono-grid-active');

    // Update HUD
    updateChronoHUD();

    // Start chrono ambient audio
    startChronoAudio();
}

function stopChronoShift() {
    ChronoShift.active = false;
    ChronoShift.paused = false;

    // Hide chrono HUD
    document.getElementById('chrono-hud').classList.add('hidden');
    document.querySelector('.canvas-wrapper').classList.remove('chrono-grid-active');

    // Remove any active visual effects
    const overlay = document.getElementById('temporal-overlay');
    overlay.className = 'temporal-overlay hidden';
    overlay.style.background = '';

    // Stop chrono audio
    stopChronoAudio();
}

// ── ChronoShift Update Loop ────────────────────────────────────────────────

function updateChronoShift(deltaTime, currentTime) {
    if (!ChronoShift.active || ChronoShift.paused) return;

    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    // Handle rewind animation
    if (ChronoShift.rewindInProgress) {
        updateRewindAnimation(deltaTime);
        return; // Freeze gameplay during rewind
    }

    // Handle invincibility after rewind
    if (ChronoShift.invincibilityTimer > 0) {
        ChronoShift.invincibilityTimer -= deltaTime;
        if (ChronoShift.invincibilityTimer <= 0) {
            ChronoShift.invincibilityTimer = 0;
        }
    }

    // Handle survival bonus timer
    if (ChronoShift.survivalBonusTimer > 0) {
        ChronoShift.survivalBonusTimer -= deltaTime;
        if (ChronoShift.survivalBonusTimer <= 0 && !ChronoShift.survivalBonusAwarded) {
            // Award survival bonus
            ChronoShift.survivalBonusAwarded = true;
            ChronoShift.chronoScore += 500;
            score += 500;
            scoreElement.textContent = score;
            showChronoStatus('TEMPORAL COMEBACK +500');
            playSurvivalBonusSound();

            // Flash effect
            const overlay = document.getElementById('temporal-overlay');
            overlay.className = 'temporal-overlay survival-bonus';
            setTimeout(() => {
                overlay.className = 'temporal-overlay hidden';
            }, 1000);
        }
    }

    // Handle slow-mo
    if (ChronoShift.slowMoActive) {
        ChronoShift.slowMoTimer -= deltaTime;

        // Accumulate slow-mo score: +5 per second
        ChronoShift.slowMoScoreAccum += deltaTime;
        if (ChronoShift.slowMoScoreAccum >= 1000) {
            ChronoShift.chronoScore += 5;
            score += 5;
            scoreElement.textContent = score;
            ChronoShift.slowMoScoreAccum -= 1000;
        }

        // Update HUD timer
        const remaining = Math.ceil(ChronoShift.slowMoTimer / 1000);
        showChronoStatus(`SLOW-MO: ${remaining}s`);

        if (ChronoShift.slowMoTimer <= 0) {
            ChronoShift.slowMoActive = false;
            ChronoShift.slowMoTimer = 0;
            ChronoShift.temporalMasteryUsed.slowmo = true;

            // Remove slow-mo tint
            const overlay = document.getElementById('temporal-overlay');
            overlay.className = 'temporal-overlay hidden';

            // Remove slow-mo button active state
            const btn = document.getElementById('chrono-slowmo');
            btn.classList.remove('chrono-btn-slowmo-active');

            updateChronoHUD();
        }
    }

    // Handle fast-forward
    if (ChronoShift.fastForwardActive) {
        ChronoShift.fastForwardTimer -= deltaTime;

        // Update HUD timer
        const remaining = Math.ceil(ChronoShift.fastForwardTimer / 1000);
        showChronoStatus(`FAST-FWD: ${remaining}s`);

        if (ChronoShift.fastForwardTimer <= 0) {
            ChronoShift.fastForwardActive = false;
            ChronoShift.fastForwardTimer = 0;
            ChronoShift.temporalMasteryUsed.fastforward = true;

            // Award FF completion bonus
            ChronoShift.chronoScore += 200;
            score += 200;
            scoreElement.textContent = score;
            showChronoStatus('CAUGHT UP +200');
            playCaughtUpSound();

            // Remove FF tint
            const overlay = document.getElementById('temporal-overlay');
            overlay.className = 'temporal-overlay hidden';

            // Remove FF button active state
            const btn = document.getElementById('chrono-fastforward');
            btn.classList.remove('chrono-btn-ff-active');

            updateChronoHUD();
        }
    }

    // Temporal pulse cooldown
    if (ChronoShift.temporalPulseCooldown > 0) {
        ChronoShift.temporalPulseCooldown -= deltaTime;
    }

    // Spawn time orbs
    ChronoShift.timeOrbSpawnTimer += deltaTime;
    if (ChronoShift.timeOrbSpawnTimer >= settings.orbSpawnInterval &&
        ChronoShift.timeOrbs.length < settings.maxOrbs) {
        spawnTimeOrb();
        ChronoShift.timeOrbSpawnTimer = 0;
    }

    // Update grid pulse
    ChronoShift.gridPulseTimer += deltaTime;

    // Update time trail (keep last 3 positions)
    if (snake && snake.length > 0) {
        ChronoShift.timeTrail.unshift({ x: snake[0].x, y: snake[0].y });
        if (ChronoShift.timeTrail.length > 3) {
            ChronoShift.timeTrail.pop();
        }
    }

    updateChronoHUD();
}

// ── History Buffer Management ──────────────────────────────────────────────

function pushToHistoryBuffer() {
    if (!ChronoShift.active) return;

    const state = {
        timestamp: Date.now(),
        snake: snake.map(s => ({ x: s.x, y: s.y })),
        food: food ? { x: food.x, y: food.y } : null,
        powerUpFood: powerUpFood ? { x: powerUpFood.x, y: powerUpFood.y, type: powerUpFood.type } : null,
        score: score,
        snakeLength: snake.length
    };

    ChronoShift.historyBuffer.push(state);

    // Keep only last N states (memory safe)
    if (ChronoShift.historyBuffer.length > ChronoShift.historyMaxLength) {
        ChronoShift.historyBuffer.shift();
    }
}

function getHistoryStateAtIndex(index) {
    if (index < 0 || index >= ChronoShift.historyBuffer.length) {
        return null;
    }
    return ChronoShift.historyBuffer[index];
}

// ── Temporal Actions ────────────────────────────────────────────────────────

function useChronoAction(actionType) {
    if (!ChronoShift.active || ChronoShift.rewindInProgress) return;

    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    switch (actionType) {
        case 'rewind':
            if (ChronoShift.chronoMeter >= settings.rewindCost &&
                ChronoShift.historyBuffer.length >= 15) { // Need at least ~2 seconds
                triggerRewind();
            }
            break;
        case 'slowmo':
            if (ChronoShift.chronoMeter >= settings.slowMoCost && !ChronoShift.slowMoActive && !ChronoShift.fastForwardActive) {
                triggerSlowMo();
            }
            break;
        case 'fastforward':
            if (ChronoShift.chronoMeter >= settings.fastForwardCost && !ChronoShift.slowMoActive && !ChronoShift.fastForwardActive) {
                triggerFastForward();
            }
            break;
        case 'pulse':
            if (settings.pulseEnabled && ChronoShift.chronoMeter >= settings.pulseCost && ChronoShift.temporalPulseCooldown <= 0) {
                triggerTemporalPulse();
            }
            break;
    }
}

function triggerRewind() {
    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    ChronoShift.chronoMeter -= settings.rewindCost;
    ChronoShift.rewindInProgress = true;
    ChronoShift.rewindPhase = 'freeze';
    ChronoShift.rewindTimer = 0;
    ChronoShift.temporalMasteryUsed.rewind = true;
    ChronoShift.rewindCount++;

    // Achievement tracking: track rewind usage
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.onRewindUsed();
    }

    playRewindSound();

    // Apply rewind visual effects
    const overlay = document.getElementById('temporal-overlay');
    overlay.className = 'temporal-overlay rewind-flash';
}

function updateRewindAnimation(deltaTime) {
    ChronoShift.rewindTimer += deltaTime;

    switch (ChronoShift.rewindPhase) {
        case 'freeze':
            if (ChronoShift.rewindTimer >= 300) {
                ChronoShift.rewindPhase = 'desaturate';
                ChronoShift.rewindTimer = 0;
                showChronoStatus('REVERSING...');
            }
            break;
        case 'desaturate':
            if (ChronoShift.rewindTimer >= 200) {
                ChronoShift.rewindPhase = 'restore';
                ChronoShift.rewindTimer = 0;
                restoreFromHistory();
            }
            break;
        case 'restore':
            if (ChronoShift.rewindTimer >= 100) {
                ChronoShift.rewindPhase = 'invincible';
                ChronoShift.rewindTimer = 0;
                ChronoShift.invincibilityTimer = 500;
                ChronoShift.survivalBonusTimer = ChronoShift.survivalBonusRequired;
                ChronoShift.survivalBonusAwarded = false;

                // Clear overlay
                const overlay = document.getElementById('temporal-overlay');
                overlay.className = 'temporal-overlay hidden';

                updateChronoHUD();
            }
            break;
        case 'invincible':
            if (ChronoShift.rewindTimer >= 500) {
                ChronoShift.rewindInProgress = false;
                ChronoShift.rewindPhase = null;

                // Clear history buffer after rewind (prevents double-rewind)
                ChronoShift.historyBuffer = [];
            }
            break;
    }
}

function restoreFromHistory() {
    // Restore state from 3 seconds ago (approximately 25 states back, but use what's available)
    const restoreIndex = Math.max(0, ChronoShift.historyBuffer.length - 25);
    const restoreState = ChronoShift.historyBuffer[restoreIndex];

    if (!restoreState) {
        ChronoShift.rewindInProgress = false;
        ChronoShift.rewindPhase = null;
        return;
    }

    // Restore snake position
    snake = restoreState.snake.map(s => ({ x: s.x, y: s.y }));

    // Restore food position
    if (restoreState.food) {
        food = { x: restoreState.food.x, y: restoreState.food.y };
    }

    // Restore power-up if it existed
    if (restoreState.powerUpFood) {
        powerUpFood = {
            x: restoreState.powerUpFood.x,
            y: restoreState.powerUpFood.y,
            type: restoreState.powerUpFood.type
        };
    }

    // Score is preserved
    // Don't restore score - per spec it's preserved

    // Update UI
    scoreElement.textContent = score;

    // Play restoration sound
    playRewindRestoreSound();
}

function triggerSlowMo() {
    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    ChronoShift.chronoMeter -= settings.slowMoCost;
    ChronoShift.slowMoActive = true;
    ChronoShift.slowMoTimer = settings.slowMoDuration;
    ChronoShift.slowMoScoreAccum = 0;

    // Apply slow-mo visual
    const overlay = document.getElementById('temporal-overlay');
    overlay.className = 'temporal-overlay slowmo-tint';

    // Update button state
    const btn = document.getElementById('chrono-slowmo');
    btn.classList.add('chrono-btn-slowmo-active');

    playSlowMoSound();
    updateChronoHUD();
}

function triggerFastForward() {
    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    ChronoShift.chronoMeter -= settings.fastForwardCost;
    ChronoShift.fastForwardActive = true;
    ChronoShift.fastForwardTimer = settings.fastForwardDuration;

    // Apply FF visual
    const overlay = document.getElementById('temporal-overlay');
    overlay.className = 'temporal-overlay ff-tint';

    // Update button state
    const btn = document.getElementById('chrono-fastforward');
    btn.classList.add('chrono-btn-ff-active');

    playFastForwardSound();
    updateChronoHUD();
}

function triggerTemporalPulse() {
    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    ChronoShift.chronoMeter -= settings.pulseCost;
    ChronoShift.temporalPulseCooldown = 2000; // 2 second cooldown
    ChronoShift.temporalMasteryUsed.pulse = true;

    // Teleport all food to new positions
    scrambleAllFood();

    // Visual flash
    const overlay = document.getElementById('temporal-overlay');
    overlay.className = 'temporal-overlay pulse-flash';
    setTimeout(() => {
        if (!ChronoShift.slowMoActive && !ChronoShift.fastForwardActive) {
            overlay.className = 'temporal-overlay hidden';
        }
    }, 400);

    showChronoStatus('PULSE!');
    playTemporalPulseSound();
    updateChronoHUD();
}

function scrambleAllFood() {
    // Teleport regular food
    if (food) {
        let newPos;
        let attempts = 0;
        do {
            newPos = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            attempts++;
        } while (attempts < 50 && (
            snake.some(s => s.x === newPos.x && s.y === newPos.y) ||
            (ChronoShift.timeOrbs.some(o => o.x === newPos.x && o.y === newPos.y))
        ));
        food = newPos;
    }

    // Teleport power-up food
    if (powerUpFood) {
        let newPos;
        let attempts = 0;
        do {
            newPos = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            attempts++;
        } while (attempts < 50 && (
            snake.some(s => s.x === newPos.x && s.y === newPos.y) ||
            (food && food.x === newPos.x && food.y === newPos.y) ||
            ChronoShift.timeOrbs.some(o => o.x === newPos.x && o.y === newPos.y)
        ));
        powerUpFood.x = newPos.x;
        powerUpFood.y = newPos.y;
    }
}

// ── Time Orb System ─────────────────────────────────────────────────────────

function spawnTimeOrb() {
    let pos;
    let attempts = 0;

    do {
        pos = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        attempts++;
    } while (attempts < 50 && (
        snake.some(s => s.x === pos.x && s.y === pos.y) ||
        (food && food.x === pos.x && food.y === pos.y) ||
        powerUpFood?.x === pos.x && powerUpFood?.y === pos.y ||
        ChronoShift.timeOrbs.some(o => o.x === pos.x && o.y === pos.y)
    ));

    if (attempts < 50) {
        ChronoShift.timeOrbs.push({
            x: pos.x,
            y: pos.y,
            spawnTime: Date.now()
        });
        playTimeOrbSpawnSound();
    }
}

function checkTimeOrbCollision(headX, headY) {
    if (!ChronoShift.active) return false;

    for (let i = ChronoShift.timeOrbs.length - 1; i >= 0; i--) {
        const orb = ChronoShift.timeOrbs[i];
        if (headX === orb.x && headY === orb.y) {
            // Collect orb
            ChronoShift.timeOrbs.splice(i, 1);
            ChronoShift.chronoMeter = Math.min(ChronoShift.chronoMax, ChronoShift.chronoMeter + 200);
            ChronoShift.chronoScore += 25;
            score += 25;
            scoreElement.textContent = score;

            // Effects
            playTimeOrbCollectSound();
            burstParticles(orb.x, orb.y, '#ffd700', 20);
            showChronoStatus('+200 CHRONO');

            updateChronoHUD();
            return true;
        }
    }
    return false;
}

// ── ChronoShift Collision Override ──────────────────────────────────────────

function checkChronoShiftCollision(headX, headY) {
    if (!ChronoShift.active) return false;

    // Invincibility after rewind
    if (ChronoShift.invincibilityTimer > 0) {
        return false;
    }

    // Wall collision
    if (headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount) {
        return true; // Collision
    }

    // Self collision (skip head)
    for (let i = 1; i < snake.length; i++) {
        if (headX === snake[i].x && headY === snake[i].y) {
            return true; // Collision
        }
    }

    return false; // No collision
}

// ── ChronoShift Drawing ─────────────────────────────────────────────────────

function drawChronoShift(ctx, time) {
    if (!ChronoShift.active) return;

    // Draw time trail (afterimages)
    drawTimeTrail(ctx);

    // Draw time orbs
    drawTimeOrbs(ctx, time);

    // Draw slow-mo halo around snake head
    if (ChronoShift.slowMoActive) {
        drawSlowMoHalo(ctx, time);
    }

    // Draw chrono grid effect (subtle pulse)
    drawChronoGridEffect(ctx, time);
}

function drawTimeTrail(ctx) {
    if (ChronoShift.timeTrail.length < 2) return;

    ChronoShift.timeTrail.forEach((pos, i) => {
        const alpha = 0.2 - (i * 0.06);
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffff';

        const seg = snake[0];
        const profile = snakeProfiles[selectedProfileIndex];
        const size = gridSize - 4;

        // Draw ghost segment
        ctx.beginPath();
        ctx.roundRect(pos.x * gridSize + 2, pos.y * gridSize + 2, size, size, 4);
        ctx.fill();

        ctx.restore();
    });
}

function drawTimeOrbs(ctx, time) {
    const pulse = Math.sin(time / 150) * 0.3 + 0.7;

    ChronoShift.timeOrbs.forEach(orb => {
        ctx.save();

        // Outer rotating ring
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = '#ffd700';
        ctx.globalAlpha = 0.5 + pulse * 0.3;

        const cx = orb.x * gridSize + gridSize / 2;
        const cy = orb.y * gridSize + gridSize / 2;
        const radius = gridSize / 2 + 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius + Math.sin(time / 200) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Inner orb
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 20 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, gridSize / 3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Center highlight
        ctx.fillStyle = '#fffef0';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

function drawSlowMoHalo(ctx, time) {
    if (!snake || snake.length === 0) return;

    const head = snake[0];
    const pulse = Math.sin(time / 200) * 3 + 8;

    ctx.save();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = '#4488ff';
    ctx.globalAlpha = 0.6 + Math.sin(time / 300) * 0.2;

    const cx = head.x * gridSize + gridSize / 2;
    const cy = head.y * gridSize + gridSize / 2;
    const radius = gridSize * 1.5;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawChronoGridEffect(ctx, time) {
    // Subtle cyan pulse on grid lines
    const pulse = Math.sin(ChronoShift.gridPulseTimer / 1000) * 0.3 + 0.3;

    if (ChronoShift.slowMoActive || ChronoShift.fastForwardActive) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 255, 255, ${pulse * 0.3})`;
        ctx.lineWidth = 1;

        // Draw subtle radial pulse from center
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const waveRadius = (time % 2000) / 2000 * canvas.width;

        ctx.globalAlpha = (1 - waveRadius / canvas.width) * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// ── HUD Management ─────────────────────────────────────────────────────────

function updateChronoHUD() {
    if (!ChronoShift.active) return;

    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];
    const meter = document.getElementById('chrono-bar-fill');
    const glow = document.querySelector('.chrono-bar-glow');
    const value = document.getElementById('chrono-value');

    // Update meter fill
    const pct = (ChronoShift.chronoMeter / ChronoShift.chronoMax) * 100;
    meter.style.width = pct + '%';
    glow.style.width = pct + '%';
    value.textContent = Math.floor(ChronoShift.chronoMeter);

    // Update button states
    updateChronoButton('chrono-rewind', 'rewind', settings.rewindCost);
    updateChronoButton('chrono-slowmo', 'slowmo', settings.slowMoCost);
    updateChronoButton('chrono-fastforward', 'fastforward', settings.fastForwardCost);
    updateChronoButton('chrono-pulse', 'pulse', settings.pulseEnabled ? settings.pulseCost : 999);
}

function updateChronoButton(btnId, action, cost) {
    const btn = document.getElementById(btnId);
    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    // Remove all state classes
    btn.classList.remove('chrono-btn-enabled', 'chrono-btn-disabled', 'chrono-btn-rewind-ready');

    // Check if action is available
    let canUse = ChronoShift.chronoMeter >= cost;

    // Special cases
    if (action === 'rewind') {
        canUse = canUse && ChronoShift.historyBuffer.length >= 15 && !ChronoShift.rewindInProgress;
        if (canUse) {
            btn.classList.add('chrono-btn-rewind-ready');
        }
    } else if (action === 'slowmo') {
        canUse = canUse && !ChronoShift.slowMoActive && !ChronoShift.fastForwardActive;
    } else if (action === 'fastforward') {
        canUse = canUse && !ChronoShift.slowMoActive && !ChronoShift.fastForwardActive;
    } else if (action === 'pulse') {
        canUse = canUse && settings.pulseEnabled && ChronoShift.temporalPulseCooldown <= 0;
    }

    if (canUse) {
        btn.classList.add('chrono-btn-enabled');
        btn.disabled = false;
    } else {
        btn.classList.add('chrono-btn-disabled');
        btn.disabled = true;
    }
}

function showChronoStatus(text) {
    const status = document.getElementById('chrono-status');
    status.textContent = text;
    status.classList.remove('hidden');

    // Auto-hide after 2 seconds
    clearTimeout(status.hideTimeout);
    status.hideTimeout = setTimeout(() => {
        status.classList.add('hidden');
    }, 2000);
}

// ── Speed Modifier ──────────────────────────────────────────────────────────

function getChronoShiftSpeedModifier() {
    if (!ChronoShift.active) return 1.0;

    const settings = ChronoShift.difficultySettings[ChronoShift.difficulty];

    // Insane mode has base speed boost
    let modifier = settings.speedBoost || 1.0;

    if (ChronoShift.slowMoActive) {
        modifier *= ChronoShift.slowMoMultiplier;
    }

    if (ChronoShift.fastForwardActive) {
        modifier *= ChronoShift.fastForwardMultiplier;
    }

    return modifier;
}

function shouldSuppressFoodSpawn() {
    // No food or time orb spawns during fast-forward
    return ChronoShift.fastForwardActive;
}

// ── ChronoShift Game Over ──────────────────────────────────────────────────

function endChronoShiftRun() {
    if (!ChronoShift.active) return;

    // Award bonuses
    let finalBonus = 0;

    // Temporal Mastery bonus: use all 4 action types
    const usedAll = ChronoShift.temporalMasteryUsed.rewind &&
                    ChronoShift.temporalMasteryUsed.slowmo &&
                    ChronoShift.temporalMasteryUsed.fastforward &&
                    ChronoShift.temporalMasteryUsed.pulse;
    if (usedAll) {
        finalBonus += 300;
        score += 300;
    }

    // Award any remaining survival bonus
    if (ChronoShift.survivalBonusTimer > 0 && !ChronoShift.survivalBonusAwarded) {
        // Award partial bonus based on time survived
        const timeRatio = 1 - (ChronoShift.survivalBonusTimer / ChronoShift.survivalBonusRequired);
        finalBonus += Math.floor(500 * timeRatio);
        score += Math.floor(500 * timeRatio);
    }

    if (finalBonus > 0) {
        scoreElement.textContent = score;
        showChronoStatus(`TEMPORAL MASTERY +${finalBonus}`);
    }

    // Stop chrono mode
    stopChronoShift();

    // Achievement tracking for ChronoShift completion
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.onGameEnded('chronoshift', score, ChronoShift.difficulty);
        // Track survive time
        const startTime = ChronoShift.chronoStartTime || Date.now() - 300000; // Fallback: assume 5 min
        const surviveSeconds = Math.floor((Date.now() - startTime) / 1000);
        AchievementManager.checkCondition('survive_time', surviveSeconds, { mode: 'chronoshift' });
    }
}

// ── Audio System ───────────────────────────────────────────────────────────

let chronoAmbientOsc = null;
let chronoAmbientGain = null;
let chronoHeartbeatInterval = null;

function startChronoAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Ambient drone (low frequency)
    chronoAmbientOsc = audioCtx.createOscillator();
    const ambientGain = audioCtx.createGain();

    chronoAmbientOsc.type = 'sine';
    chronoAmbientOsc.frequency.value = 55; // Low A1 drone
    ambientGain.gain.value = 0.03;

    chronoAmbientOsc.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    chronoAmbientOsc.start();

    chronoAmbientGain = ambientGain;

    // Heartbeat every 4 bars (at ~120ms step = 9.6s loop, 4 bars = 4.8s)
    chronoHeartbeatInterval = setInterval(() => {
        if (ChronoShift.active) {
            playChronoHeartbeat();
        }
    }, 4800);
}

function stopChronoAudio() {
    if (chronoAmbientOsc) {
        chronoAmbientOsc.stop();
        chronoAmbientOsc = null;
    }
    if (chronoHeartbeatInterval) {
        clearInterval(chronoHeartbeatInterval);
        chronoHeartbeatInterval = null;
    }
}

function playChronoHeartbeat() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Dual-pulse heartbeat
    [0, 0.15].forEach(delay => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 60;
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
    });
}

function playTimeOrbSpawnSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
}

function playTimeOrbCollectSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Ascending chime: 440Hz → 880Hz sweep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
}

function playRewindSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Rewind whoosh (descending pitch noise)
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    filter.Q.value = 5;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
}

function playRewindRestoreSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Ascending restore tone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
}

function playSlowMoSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Deep tone with slow modulation
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
}

function playFastForwardSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Rising pitch sweep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
}

function playTemporalPulseSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Bright flash sound
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 1000;
    osc2.type = 'sine';
    osc2.frequency.value = 1500;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
}

function playSurvivalBonusSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Triumphant chord
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1);
    });
}

function playCaughtUpSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Quick confirmation beep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

// ── Demo Mode ───────────────────────────────────────────────────────────────

const DEMO_GRID = 24;
const DEMO_TILE = 25;

let demoState = null;
let demoAnimFrame = null;

function runChronoShiftDemo(ctx, t, elapsed) {
    const state = demoState;
    if (!state.chrono) {
        state.chrono = 0;
        state.tickAccum = 0;
        state.slowMoActive = false;
        state.rewindFlash = 0;
    }

    // Auto-charge chrono meter
    state.chrono = Math.min(1000, state.chrono + 8);

    // Simulate snake movement
    state.tickAccum += 16;
    if (state.tickAccum >= (state.slowMoActive ? 300 : 150)) {
        state.tickAccum = 0;

        const h = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
        if (h.x < 0 || h.x >= DEMO_TILE || h.y < 0 || h.y >= DEMO_TILE) {
            state.dx = state.dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            state.dy = state.dx !== 0 ? 0 : (state.dy === 0 ? -1 : state.dy);
        }
        h.x = state.snake[0].x + state.dx;
        h.y = state.snake[0].y + state.dy;
        state.snake.unshift(h);
        state.snake.pop();
    }

    // Draw chrono HUD background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Draw chrono meter bar
    const barY = canvas.height - 40;
    const barWidth = 400;
    const barX = (canvas.width - barWidth) / 2;

    // Bar background
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, 10, 3);
    ctx.fill();
    ctx.stroke();

    // Bar fill
    const fillWidth = (state.chrono / 1000) * barWidth;
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, 10, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Chrono label
    ctx.fillStyle = '#00ffff';
    ctx.font = '10px Orbitron';
    ctx.fillText('CHRONO', barX, barY - 5);
    ctx.fillText(Math.floor(state.chrono), barX + barWidth + 10, barY + 8);

    // Action buttons (Q W E R)
    const btnY = canvas.height - 20;
    const labels = ['REWIND', 'SLOW-MO', 'FAST-FWD', 'PULSE'];
    const keys = ['Q', 'W', 'E', 'R'];

    labels.forEach((label, i) => {
        const bx = barX + 10 + i * 100;
        const enabled = state.chrono >= (i === 0 ? 500 : 200);

        ctx.fillStyle = enabled ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = enabled ? '#00ffff' : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(bx, btnY - 12, 80, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = enabled ? '#00ffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px Orbitron';
        ctx.fillText(`${keys[i]} ${label}`, bx + 5, btnY + 1);
    });

    // Draw demo snake with time trail
    state.snake.forEach((seg, i) => {
        const isHead = i === 0;
        const alpha = isHead ? 1 : Math.max(0.3, 1 - (i / state.snake.length) * 0.7);

        ctx.fillStyle = isHead ? '#00ffcc' : '#00cc99';
        ctx.shadowBlur = isHead ? 15 : 8;
        ctx.shadowColor = '#00ffcc';
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.roundRect(seg.x * DEMO_GRID + 1, seg.y * DEMO_GRID + 1, DEMO_GRID - 2, DEMO_GRID - 2, 3);
        ctx.fill();
    });

    // Time trail (afterimages)
    if (state.snake.length >= 2) {
        const trailPositions = [
            state.snake[1],
            state.snake[Math.min(3, state.snake.length - 1)],
            state.snake[Math.min(5, state.snake.length - 1)]
        ];

        trailPositions.forEach((pos, i) => {
            ctx.fillStyle = '#00ffff';
            ctx.globalAlpha = 0.2 - i * 0.06;
            ctx.beginPath();
            ctx.roundRect(pos.x * DEMO_GRID + 2, pos.y * DEMO_GRID + 2, DEMO_GRID - 4, DEMO_GRID - 4, 3);
            ctx.fill();
        });
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Food with orbit trail
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(state.food.x * DEMO_GRID + 4, state.food.y * DEMO_GRID + 4, DEMO_GRID - 8, DEMO_GRID - 8, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw demo time orb (gold)
    const orbPulse = Math.sin(t * 5) * 0.3 + 0.7;
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 15 * orbPulse;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(14 * DEMO_GRID + DEMO_GRID/2, 5 * DEMO_GRID + DEMO_GRID/2, DEMO_GRID/3, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting ring
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(14 * DEMO_GRID + DEMO_GRID/2, 5 * DEMO_GRID + DEMO_GRID/2, DEMO_GRID/2 + 2, t * 0.01, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Slow-mo halo effect (simulate)
    if (state.slowMoActive) {
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4488ff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(state.snake[0].x * DEMO_GRID + DEMO_GRID/2, state.snake[0].y * DEMO_GRID + DEMO_GRID/2, DEMO_GRID * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    // HUD text
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Orbitron';
    ctx.fillText('CHRONOSHIFT', 10, 25);
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`CHRONO: ${Math.floor(state.chrono)}`, 10, 45);

    if (state.chrono >= 500) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('REWIND READY!', 10, 65);
    }
}

// ── Key Bindings ────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    if (!ChronoShift.active || ChronoShift.rewindInProgress) return;

    switch (e.code) {
        case 'KeyQ':
            useChronoAction('rewind');
            break;
        case 'KeyW':
            useChronoAction('slowmo');
            break;
        case 'KeyE':
            useChronoAction('fastforward');
            break;
        case 'KeyR':
            useChronoAction('pulse');
            break;
    }
});

// Button click handlers
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chrono-rewind')?.addEventListener('click', () => useChronoAction('rewind'));
    document.getElementById('chrono-slowmo')?.addEventListener('click', () => useChronoAction('slowmo'));
    document.getElementById('chrono-fastforward')?.addEventListener('click', () => useChronoAction('fastforward'));
    document.getElementById('chrono-pulse')?.addEventListener('click', () => useChronoAction('pulse'));
});