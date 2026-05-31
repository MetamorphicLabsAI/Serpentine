// ═══════════════════════════════════════════════════════════════════════════
// TUTORIAL SYSTEM
// First-time onboarding flow with boot sequence, welcome, and 4 steps
// ═══════════════════════════════════════════════════════════════════════════

const TutorialSystem = {
    active: false,
    currentStep: 0, // 0=boot, 1=welcome, 2=step1, 3=step2, 4=step3, 5=step4, 6=complete
    step1Moves: 0,
    step2Collected: 0,
    tutorialSnake: [],
    tutorialFood: null,
    tutorialDirection: { dx: 0, dy: -1 },
    tutorialPendingDirection: null,
    tutorialDeathReplay: false,
    deathReplayFrames: [],
    tutorialDrawLoop: null,
    bootInterval: null,
    bootProgress: 0,
    tutorialInitialized: false, // guard so showStep1/showStep2 don't reinit

    // Check if tutorial should run (first time or re-accessible)
    shouldRunTutorial() {
        const tutorialComplete = localStorage.getItem('serpentineTutorialComplete') === 'true';
        return !tutorialComplete;
    },

    // Check if tutorial is complete
    isComplete() {
        return localStorage.getItem('serpentineTutorialComplete') === 'true';
    },

    // Start the tutorial from init screen
    startTutorial() {
        this.active = true;
        this.currentStep = 0;
        this.step1Moves = 0;
        this.step2Collected = 0;
        this.tutorialDeathReplay = false;
        this.tutorialSnake = [];
        this.tutorialFood = null;
        this.tutorialInitialized = false;
        this.tutorialPendingDirection = null;

        hideAllMenus();
        document.getElementById('tutorial-boot').classList.remove('hidden');
        this.runBootSequence();
    },

    // Boot sequence with fake progress
    runBootSequence() {
        const progressBar = document.getElementById('tutorial-boot-progress');
        const statusEl = document.getElementById('tutorial-boot-status');
        const bootMessages = [
            'LOADING KERNEL',
            'INITIALIZING MEMORY',
            'CONFIGURING GRID',
            'CALIBRATING PROTOCOLS',
            'LOADING VISUAL MATRIX',
            'SYNCHRONIZING INPUT',
            'SYSTEM READY'
        ];

        this.bootProgress = 0;
        const totalSteps = 100;
        const messagesPerStep = 100 / bootMessages.length;

        this.bootInterval = setInterval(() => {
            this.bootProgress += Math.random() * 8 + 2;
            if (this.bootProgress > totalSteps) this.bootProgress = totalSteps;

            progressBar.style.width = this.bootProgress + '%';

            const msgIndex = Math.min(
                Math.floor(this.bootProgress / messagesPerStep),
                bootMessages.length - 1
            );
            statusEl.textContent = bootMessages[msgIndex];

            if (this.bootProgress >= totalSteps) {
                clearInterval(this.bootInterval);
                setTimeout(() => this.showWelcome(), 500);
            }
        }, 80);
    },

    // Show welcome screen
    showWelcome() {
        this.currentStep = 1;
        hideAllMenus();
        document.getElementById('tutorial-welcome').classList.remove('hidden');

        // Debounce: ignore keydown for 400ms (prevents click/keyboard shortcut from auto-advancing)
        let welcomeReady = false;
        setTimeout(() => { welcomeReady = true; }, 400);

        const continueHandler = (e) => {
            if (!welcomeReady) return;
            // Any key except Escape advances
            if (e.key !== 'Escape') {
                document.removeEventListener('keydown', continueHandler);
                this.showStep1();
            }
        };
        document.addEventListener('keydown', continueHandler);
    },

    // ── STEP 1: Movement Controls ─────────────────────────────────────────────
    showStep1() {
        this.currentStep = 2;

        // Only initialize once — guard against re-entry on repeated calls
        if (!this.tutorialInitialized) {
            this.tutorialInitialized = true;
            this.step1Moves = 0;
            this.step2Collected = 0;
            this.tutorialDeathReplay = false;
            this.tutorialSnake = [];
            this.tutorialFood = null;
            this.tutorialDirection = { dx: 0, dy: -1 };
            this.tutorialPendingDirection = null;
        }

        hideAllMenus();
        document.getElementById('tutorial-step1').classList.remove('hidden');

        // Initialize snake (once per tutorial run)
        if (this.tutorialSnake.length === 0) {
            const cx = Math.floor(tileCount / 2);
            const cy = Math.floor(tileCount / 2);
            this.tutorialSnake = [
                { x: cx, y: cy - 1 },
                { x: cx, y: cy },
                { x: cx, y: cy + 1 }
            ];
        }

        this.startTutorialDrawLoop();
        this.updateStep1Progress();
    },

    // Step 1: user presses button to confirm they understand movement
    confirmStep1() {
        if (this.currentStep !== 2) return;
        this.cancelTutorialDrawLoop();
        this.showStep2();
    },

    // Update step 1 progress display
    updateStep1Progress() {
        const progressEl = document.getElementById('tutorial-step1-progress');
        if (progressEl) {
            progressEl.textContent = `Moves: ${this.step1Moves} / 5`;
        }
    },

    // ── STEP 2: Food Collection ───────────────────────────────────────────────
    showStep2() {
        this.currentStep = 3;

        // Only initialize once
        if (this.tutorialSnake.length === 0) {
            const cx = Math.floor(tileCount / 2);
            const cy = Math.floor(tileCount / 2);
            this.tutorialSnake = [
                { x: cx, y: cy - 1 },
                { x: cx, y: cy },
                { x: cx, y: cy + 1 }
            ];
            this.tutorialDirection = { dx: 0, dy: -1 };
            this.tutorialPendingDirection = null;
        }

        hideAllMenus();
        document.getElementById('tutorial-step2').classList.remove('hidden');

        // Spawn food (once)
        if (!this.tutorialFood) {
            this.spawnTutorialFood();
        }

        this.startTutorialDrawLoop();
        this.updateStep2Progress();
    },

    // Step 2: user presses button to confirm food collection
    confirmStep2() {
        if (this.currentStep !== 3) return;
        this.cancelTutorialDrawLoop();
        this.tutorialFood = null; // clear food so no collision if we return
        this.showStep3();
    },

    // Spawn food at random location
    spawnTutorialFood() {
        let pos;
        let valid = false;
        while (!valid) {
            pos = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            valid = !this.tutorialSnake.some(seg => seg.x === pos.x && seg.y === pos.y);
        }
        this.tutorialFood = pos;
    },

    // Update step 2 progress display
    updateStep2Progress() {
        const progressEl = document.getElementById('tutorial-step2-progress');
        if (progressEl) {
            progressEl.textContent = `Collected: ${this.step2Collected} / 1`;
        }
    },

    // ── STEP 3: Avoid Death ───────────────────────────────────────────────────
    showStep3() {
        this.currentStep = 4;
        hideAllMenus();
        document.getElementById('tutorial-step3').classList.remove('hidden');

        // Run death replay after a moment
        setTimeout(() => this.runDeathReplay(), 2000);
    },

    // Run simulated death replay
    runDeathReplay() {
        this.tutorialDeathReplay = true;

        // Create a death scenario: snake moving toward wall
        this.deathReplayFrames = [];
        let x = Math.floor(tileCount / 2);
        let y = Math.floor(tileCount / 2);
        let dx = 1;
        let dy = 0;

        // Build frames moving right toward wall
        for (let i = 0; i < 20; i++) {
            this.deathReplayFrames.push([{ x, y }, { x: x - 1, y }, { x: x - 2, y }]);
            x += dx;
            if (x >= tileCount - 1) {
                // Hit wall — add collision frames
                for (let j = 0; j < 10; j++) {
                    this.deathReplayFrames.push([{ x: tileCount - 1, y }, { x: tileCount - 2, y }, { x: tileCount - 3, y }]);
                }
                break;
            }
        }

        this.playSlowMoDeath();
    },

    // Slow-motion death replay
    playSlowMoDeath() {
        let frameIndex = 0;
        const slowMoInterval = setInterval(() => {
            if (!this.tutorialDeathReplay || frameIndex >= this.deathReplayFrames.length) {
                clearInterval(slowMoInterval);
                this.tutorialDeathReplay = false;
                setTimeout(() => this.showStep4(), 1000);
                return;
            }

            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawGrid();

            const frame = this.deathReplayFrames[frameIndex];
            for (let i = frame.length - 1; i >= 0; i--) {
                const seg = frame[i];
                ctx.save();
                if (i === 0) {
                    ctx.fillStyle = frameIndex >= 18 ? '#ff0055' : '#00ffcc';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = frameIndex >= 18 ? '#ff0055' : '#ffffff';
                } else {
                    ctx.globalAlpha = Math.max(0.4, 1 - (i / frame.length) * 0.6);
                    ctx.fillStyle = '#00cc99';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#00ffcc';
                }
                ctx.beginPath();
                ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 5);
                ctx.fill();
                ctx.restore();
            }

            // Flash effect on wall collision
            if (frameIndex >= 18) {
                ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            frameIndex++;
        }, 150);
    },

    // ── STEP 4: Power-Ups ───────────────────────────────────────────────────
    showStep4() {
        this.currentStep = 5;
        hideAllMenus();

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        document.getElementById('tutorial-step4').classList.remove('hidden');
    },

    // Show complete screen
    showComplete() {
        this.currentStep = 6;
        hideAllMenus();

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        document.getElementById('tutorial-complete').classList.remove('hidden');
    },

    // Complete tutorial - save state
    completeTutorial() {
        localStorage.setItem('serpentineTutorialComplete', 'true');

        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.profile.progress.tutorialComplete = true;
            saveManager.save(true);
        }

        this.active = false;
        this.cancelTutorialDrawLoop();

        hideAllMenus();
        mainMenu.classList.remove('hidden');
        startMenuMusic();
        document.getElementById('btn-play-menu').focus();
    },

    // Skip tutorial (for returning players)
    skipTutorial() {
        this.cancelTutorialDrawLoop();
        this.active = false;

        if (this.currentStep >= 2) {
            localStorage.setItem('serpentineTutorialComplete', 'true');
        }

        hideAllMenus();
        mainMenu.classList.remove('hidden');
        startMenuMusic();
        document.getElementById('btn-play-menu').focus();
    },

    // ── Draw Loop ────────────────────────────────────────────────────────────
    startTutorialDrawLoop() {
        this.cancelTutorialDrawLoop();

        const drawLoop = () => {
            if (!this.active) return;
            this.tutorialDrawLoop = requestAnimationFrame(drawLoop);
            this.drawTutorialGame();
        };

        this.tutorialDrawLoop = requestAnimationFrame(drawLoop);
    },

    cancelTutorialDrawLoop() {
        if (this.tutorialDrawLoop) {
            cancelAnimationFrame(this.tutorialDrawLoop);
            this.tutorialDrawLoop = null;
        }
    },

    // Draw tutorial game on canvas
    drawTutorialGame() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();

        // Draw food
        if (this.tutorialFood) {
            const fPulse = Math.sin(performance.now() / 150) * 2;
            ctx.save();
            ctx.fillStyle = '#ff0055';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0055';
            ctx.beginPath();
            ctx.arc(
                this.tutorialFood.x * gridSize + gridSize / 2,
                this.tutorialFood.y * gridSize + gridSize / 2,
                8 + fPulse,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        // Draw snake
        for (let i = this.tutorialSnake.length - 1; i >= 0; i--) {
            const seg = this.tutorialSnake[i];
            ctx.save();
            if (i === 0) {
                ctx.fillStyle = '#00ffcc';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffffff';
            } else {
                ctx.globalAlpha = Math.max(0.4, 1 - (i / this.tutorialSnake.length) * 0.6);
                ctx.fillStyle = '#00cc99';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffcc';
            }
            ctx.beginPath();
            ctx.roundRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2, 5);
            ctx.fill();
            ctx.restore();
        }
    },

    // Handle keyboard input during tutorial (Space/Enter to advance)
    handleTutorialKey(e) {
        if (!this.active) return;

        // Space or Enter advances through info steps
        if (e.key === ' ' || e.key === 'Enter') {
            if (this.currentStep === 2) {
                e.preventDefault();
                this.confirmStep1();
            } else if (this.currentStep === 3) {
                e.preventDefault();
                this.confirmStep2();
            }
            return;
        }

        // Escape skips tutorial from welcome
        if (e.key === 'Escape' && this.currentStep === 1) {
            e.preventDefault();
            this.skipTutorial();
        }
    },

    // Re-access tutorial from settings
    reaccessTutorial() {
        localStorage.removeItem('serpentineTutorialComplete');
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.profile.progress.tutorialComplete = false;
            saveManager.save(true);
        }

        hideAllMenus();
        this.startTutorial();
    }
};

// ── Button Handlers ──────────────────────────────────────────────────────────
document.getElementById('btn-tutorial-skip')?.addEventListener('click', () => {
    TutorialSystem.skipTutorial();
});

document.getElementById('btn-tutorial-next-step1')?.addEventListener('click', () => {
    TutorialSystem.confirmStep1();
});

document.getElementById('btn-tutorial-next-step2')?.addEventListener('click', () => {
    TutorialSystem.confirmStep2();
});

document.getElementById('btn-tutorial-continue')?.addEventListener('click', () => {
    TutorialSystem.showComplete();
});

document.getElementById('btn-tutorial-start')?.addEventListener('click', () => {
    TutorialSystem.completeTutorial();
});

// ── Keyboard Handler ─────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (TutorialSystem.active) {
        TutorialSystem.handleTutorialKey(e);
    }
});

// ── D-pad Handlers ───────────────────────────────────────────────────────────
const tutorialDPad = {
    up: document.getElementById('dpad-up'),
    down: document.getElementById('dpad-down'),
    left: document.getElementById('dpad-left'),
    right: document.getElementById('dpad-right')
};

Object.entries(tutorialDPad).forEach(([dir, btn]) => {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        if (!TutorialSystem.active) return;
        e.preventDefault();
        // D-pad doesn't move snake in tutorial, just advance on tap
        btn.classList.add('pressed');
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
    }, { passive: false });
});

// ── Settings Tutorial Re-access ──────────────────────────────────────────────
function updateTutorialButton() {
    const settingsContainer = document.getElementById('settings-container');
    if (!settingsContainer) return;

    let tutorialRow = document.getElementById('tutorial-reaccess-row');

    if (TutorialSystem.isComplete()) {
        if (!tutorialRow) {
            const dataSection = document.querySelector('.settings-section:last-child');
            if (dataSection) {
                tutorialRow = document.createElement('div');
                tutorialRow.id = 'tutorial-reaccess-row';
                tutorialRow.className = 'settings-row';
                tutorialRow.innerHTML = `
                    <span class="settings-label" id="setting-tutorial-label">TUTORIAL</span>
                    <button id="btn-reaccess-tutorial" class="btn-menu btn-secondary" style="width: auto; padding: 5px 12px; font-size: 0.75rem;">REPLAY</button>
                `;
                dataSection.insertBefore(tutorialRow, dataSection.querySelector('.danger-zone'));

                document.getElementById('btn-reaccess-tutorial')?.addEventListener('click', () => {
                    TutorialSystem.reaccessTutorial();
                });
            }
        }
    } else if (tutorialRow) {
        tutorialRow.remove();
    }
}
