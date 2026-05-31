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
    deathReplayPosition: 0,
    deathReplayFrames: [],
    tutorialGameLoop: null,
    bootInterval: null,
    bootProgress: 0,

    // Check if tutorial should run (first time or re-accessible)
    shouldRunTutorial() {
        const tutorialComplete = localStorage.getItem('serpentineTutorialComplete') === 'true';
        // If re-accessible from settings, always allow
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
        hideAllMenus();
        document.getElementById('tutorial-welcome').classList.remove('hidden');

        // Debounce: ignore keydown for 300ms (prevents click/keyboard shortcut from auto-advancing)
        let welcomeReady = false;
        setTimeout(() => { welcomeReady = true; }, 300);

        // Listen for any key to continue
        const continueHandler = (e) => {
            if (!welcomeReady) return;
            if (e.key !== 'Escape') {
                document.removeEventListener('keydown', continueHandler);
                this.currentStep = 2;
                this.showStep1();
            }
        };
        document.addEventListener('keydown', continueHandler);
    },

    // Step 1: Movement controls (user-driven, one move per key press)
    showStep1() {
        // Guard: if already in step 1, don't reinitialize
        if (this.currentStep === 2 && this.tutorialSnake.length > 0) return;

        hideAllMenus();
        document.getElementById('tutorial-step1').classList.remove('hidden');

        // Initialize tutorial snake for demo
        const cx = Math.floor(tileCount / 2);
        const cy = Math.floor(tileCount / 2);
        this.tutorialSnake = [
            { x: cx, y: cy - 1 },
            { x: cx, y: cy },
            { x: cx, y: cy + 1 }
        ];
        this.tutorialDirection = { dx: 0, dy: -1 };
        this.tutorialPendingDirection = null;
        this.step1Moves = 0;

        // Start draw-only loop (no auto-ticking)
        this.startTutorialDrawLoop();

        this.updateStep1Progress();
    },

    // Update step 1 progress display
    updateStep1Progress() {
        const progressEl = document.getElementById('tutorial-step1-progress');
        if (progressEl) {
            progressEl.textContent = `Moves: ${this.step1Moves} / 5`;
        }
    },

    // Draw-only loop for tutorial (no auto-tick — movement is user-driven)
    startTutorialDrawLoop() {
        if (this.tutorialGameLoop) cancelAnimationFrame(this.tutorialGameLoop);

        const drawLoop = (currentTime) => {
            if (!this.active) return;
            this.tutorialGameLoop = requestAnimationFrame(drawLoop);
            this.drawTutorialGame();
        };

        this.tutorialGameLoop = requestAnimationFrame(drawLoop);
    },

    // Move the tutorial snake one step (called on user input)
    tutorialMoveSnake() {
        // Apply pending direction
        if (this.tutorialPendingDirection) {
            this.tutorialDirection = this.tutorialPendingDirection;
            this.tutorialPendingDirection = null;
        }

        const head = this.tutorialSnake[0];
        const newHead = {
            x: head.x + this.tutorialDirection.dx,
            y: head.y + this.tutorialDirection.dy
        };

        // Wrap around for tutorial
        if (newHead.x < 0) newHead.x = tileCount - 1;
        if (newHead.x >= tileCount) newHead.x = 0;
        if (newHead.y < 0) newHead.y = tileCount - 1;
        if (newHead.y >= tileCount) newHead.y = 0;

        // Add new head, remove tail
        this.tutorialSnake.unshift(newHead);
        this.tutorialSnake.pop();

        // Step 1: count moves
        if (this.currentStep === 2) {
            this.step1Moves++;
            this.updateStep1Progress();
            if (this.step1Moves >= 5) {
                this.cancelTutorialGameLoop();
                this.showStep2();
            }
        }

        // Step 2: check food collection
        if (this.currentStep === 3 && this.tutorialFood) {
            if (newHead.x === this.tutorialFood.x && newHead.y === this.tutorialFood.y) {
                this.step2Collected++;
                this.updateStep2Progress();
                this.tutorialFood = null;
                this.cancelTutorialGameLoop();
                setTimeout(() => this.showStep3(), 500);
            }
        }
    },

    // Draw tutorial game on canvas
    drawTutorialGame() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
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
                const opacity = Math.max(0.4, 1 - (i / this.tutorialSnake.length) * 0.6);
                ctx.globalAlpha = opacity;
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

    // Cancel tutorial game loop
    cancelTutorialGameLoop() {
        if (this.tutorialGameLoop) {
            cancelAnimationFrame(this.tutorialGameLoop);
            this.tutorialGameLoop = null;
        }
    },

    // Step 2: Food collection demo (user-driven movement)
    showStep2() {
        // Guard: if already in step 2, don't reinitialize
        if (this.currentStep === 3 && this.tutorialSnake.length > 0) return;

        this.currentStep = 3;
        hideAllMenus();
        document.getElementById('tutorial-step2').classList.remove('hidden');

        // Initialize snake
        const cx = Math.floor(tileCount / 2);
        const cy = Math.floor(tileCount / 2);
        this.tutorialSnake = [
            { x: cx, y: cy - 1 },
            { x: cx, y: cy },
            { x: cx, y: cy + 1 }
        ];
        this.tutorialDirection = { dx: 0, dy: -1 };
        this.tutorialPendingDirection = null;

        // Spawn food
        this.spawnTutorialFood();

        // Start draw-only loop (no auto-tick)
        this.startTutorialDrawLoop();

        this.updateStep2Progress();
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

    // Step 3: Avoid death (slow-mo death demo)
    showStep3() {
        this.currentStep = 4;
        hideAllMenus();
        document.getElementById('tutorial-step3').classList.remove('hidden');

        // Run death replay after showing message
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

        // Generate frames moving right toward wall
        for (let i = 0; i < 20; i++) {
            this.deathReplayFrames.push([...this.tutorialSnake]);
            // Move right
            x += dx;
            if (x >= tileCount - 1) {
                // Hit wall - start collision frames
                for (let j = 0; j < 10; j++) {
                    this.deathReplayFrames.push([...this.tutorialSnake]);
                }
                break;
            }
            this.tutorialSnake = [{ x, y }, ...this.tutorialSnake.slice(0, 2)];
        }

        // Play slow-mo death animation
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

            // Draw death frame
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

            // Flash effect when hitting wall
            if (frameIndex >= 18) {
                ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            frameIndex++;
        }, 150); // Slow-mo at 150ms per frame
    },

    // Step 4: Power-ups overview
    showStep4() {
        this.cancelTutorialGameLoop();
        this.currentStep = 5;
        hideAllMenus();

        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        document.getElementById('tutorial-step4').classList.remove('hidden');
    },

    // Show complete screen
    showComplete() {
        this.currentStep = 6;
        hideAllMenus();

        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        document.getElementById('tutorial-complete').classList.remove('hidden');
    },

    // Complete tutorial - save state
    completeTutorial() {
        localStorage.setItem('serpentineTutorialComplete', 'true');

        // Also update SaveManager profile if available
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.profile.progress.tutorialComplete = true;
            saveManager.save(true);
        }

        this.active = false;
        this.cancelTutorialGameLoop();

        hideAllMenus();
        mainMenu.classList.remove('hidden');
        startMenuMusic();
        document.getElementById('btn-play-menu').focus();
    },

    // Skip tutorial (for returning players)
    skipTutorial() {
        this.cancelTutorialGameLoop();
        this.active = false;

        // Mark as complete if skipping from step 1+
        if (this.currentStep >= 2) {
            localStorage.setItem('serpentineTutorialComplete', 'true');
        }

        hideAllMenus();
        mainMenu.classList.remove('hidden');
        startMenuMusic();
        document.getElementById('btn-play-menu').focus();
    },

    // Handle keyboard input during tutorial
    handleTutorialInput(key) {
        if (!this.active) return;

        const activeDx = this.tutorialDirection.dx;
        const activeDy = this.tutorialDirection.dy;

        let newDir = null;
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (activeDy !== 1) newDir = { dx: 0, dy: -1 };
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (activeDy !== -1) newDir = { dx: 0, dy: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (activeDx !== 1) newDir = { dx: -1, dy: 0 };
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (activeDx !== -1) newDir = { dx: 1, dy: 0 };
                break;
        }

        if (newDir) {
            this.tutorialPendingDirection = newDir;
        }
    },

    // Re-access tutorial from settings
    reaccessTutorial() {
        // Reset tutorial state
        localStorage.removeItem('serpentineTutorialComplete');
        if (typeof saveManager !== 'undefined' && saveManager.profile) {
            saveManager.profile.progress.tutorialComplete = false;
            saveManager.save(true);
        }

        // Start tutorial
        hideAllMenus();
        this.startTutorial();
    }
};

// Tutorial button handlers
document.getElementById('btn-tutorial-skip')?.addEventListener('click', () => {
    TutorialSystem.skipTutorial();
});

document.getElementById('btn-tutorial-continue')?.addEventListener('click', () => {
    TutorialSystem.showComplete();
});

document.getElementById('btn-tutorial-start')?.addEventListener('click', () => {
    TutorialSystem.completeTutorial();
});

// Tutorial keyboard input handler
document.addEventListener('keydown', (e) => {
    // Route to tutorial system if active and it's a movement key
    if (TutorialSystem.active &&
        (TutorialSystem.currentStep === 2 || TutorialSystem.currentStep === 3) &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        TutorialSystem.handleTutorialInput(e.key);
        // Advance one step per keypress (user-driven, not auto)
        TutorialSystem.tutorialMoveSnake();
        e.preventDefault();
    }
});

// Tutorial input handlers for D-pad
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

        let key = null;
        switch (dir) {
            case 'up': key = 'ArrowUp'; break;
            case 'down': key = 'ArrowDown'; break;
            case 'left': key = 'ArrowLeft'; break;
            case 'right': key = 'ArrowRight'; break;
        }

        if (key) {
            TutorialSystem.handleTutorialInput(key);
            TutorialSystem.tutorialMoveSnake();
            btn.classList.add('pressed');
        }
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
    }, { passive: false });
});

// Update tutorial button in settings
function updateTutorialButton() {
    const settingsContainer = document.getElementById('settings-container');
    if (!settingsContainer) return;

    // Check if tutorial button already exists
    let tutorialRow = document.getElementById('tutorial-reaccess-row');

    if (TutorialSystem.isComplete()) {
        if (!tutorialRow) {
            // Create tutorial re-access row in DATA section
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

                // Add event listener
                document.getElementById('btn-reaccess-tutorial')?.addEventListener('click', () => {
                    TutorialSystem.reaccessTutorial();
                });
            }
        }
    } else if (tutorialRow) {
        tutorialRow.remove();
    }
}
