// ═══════════════════════════════════════════════════════════════════════════
// MODE TUTORIALS - Session 25
// Per-Mode Tutorial Flows for ChronoShift, Sentinel Breach, and Grid Warfare
// ═══════════════════════════════════════════════════════════════════════════

const ModeTutorials = {
    // Tutorial states
    active: false,
    currentMode: null,
    currentStep: 0,
    tutorialGameLoop: null,
    tutorialState: null,

    // Step definitions per mode
    steps: {
        chronoshift: [
            {
                id: 'chrono-intro',
                title: 'CHRONO-METER',
                icon: '⏱️',
                text: 'The Chrono-Meter charges as you collect TIME ORBS',
                subtext: 'Golden orbs appear periodically — collect them to power your temporal abilities'
            },
            {
                id: 'chrono-rewind',
                title: 'REWIND (Q)',
                icon: '⏪',
                text: 'REWIND (Q) rolls back 3 seconds — use it when in trouble',
                subtext: 'Costs 500 chrono units. Your position is restored, but you keep your score!'
            },
            {
                id: 'chrono-slowmo',
                title: 'SLOW-MO (W)',
                icon: '🐌',
                text: 'SLOW-MO (W) gives you more reaction time',
                subtext: 'Costs 200 chrono units. Everything slows down for 5 seconds'
            },
            {
                id: 'chrono-fastforward',
                title: 'FAST-FORWARD (E)',
                icon: '⏩',
                text: 'FAST-FORWARD (E) skips bad situations',
                subtext: 'Costs 300 chrono units. Rush through danger, earn bonus points!'
            },
            {
                id: 'chrono-pulse',
                title: 'TEMPORAL PULSE (R)',
                icon: '💫',
                text: 'TEMPORAL PULSE (R) scrambles food positions',
                subtext: 'Costs 150 chrono units. All food teleports to new locations'
            }
        ],
        sentinel: [
            {
                id: 'sentinel-nexus',
                title: 'DEFEND THE NEXUS',
                icon: '🔶',
                text: 'Defend the Nexus at the center',
                subtext: 'The golden Nexus is your base. If enemies reach it, the system fails'
            },
            {
                id: 'sentinel-enemies',
                title: 'HOSTILE SENTINELS',
                icon: '👾',
                text: 'Sentinels spawn from edges and hunt you',
                subtext: 'Blue Probes, Magenta Swarmers, Red Hunters, and Orange Titans attack!'
            },
            {
                id: 'sentinel-combat',
                title: 'DESTROY ENEMIES',
                icon: '⚔️',
                text: 'Eat sentinel heads to destroy them',
                subtext: 'Move into an enemy\'s head to eliminate it. Body segments are safe.'
            },
            {
                id: 'sentinel-grow',
                title: 'GROW STRONGER',
                icon: '📈',
                text: 'Eat food to grow your defensive barrier',
                subtext: 'Your snake grows longer. Wrap around the Nexus to create walls!'
            },
            {
                id: 'sentinel-safe',
                title: 'OWN COILS SAFE',
                icon: '🛡️',
                text: 'Your own coils are safe — coil around the Nexus',
                subtext: 'Unlike Standard mode, you can\'t hit yourself. Use this to your advantage!'
            }
        ],
        gridwarfare: [
            {
                id: 'gw-intro',
                title: 'TWO SNAKES',
                icon: '🐍',
                text: 'Two snakes — one grid',
                subtext: 'Battle against another snake on the same screen'
            },
            {
                id: 'gw-controls',
                title: 'CONTROLS',
                icon: '🎮',
                text: 'Player 1: WASD, Player 2: Arrow Keys',
                subtext: 'Player 1 uses WASD + SPACE. Player 2 uses Arrows + ENTER.'
            },
            {
                id: 'gw-scoring',
                title: 'FIRST TO 5',
                icon: '🏆',
                text: 'First to 5 rounds wins',
                subtext: 'Win individual rounds by surviving while your opponent crashes'
            },
            {
                id: 'gw-draw',
                title: 'HEAD TO HEAD',
                icon: '💥',
                text: 'Head-to-head = DRAW',
                subtext: 'If both snakes collide head-on, it\'s a draw. No points awarded.'
            },
            {
                id: 'gw-trap',
                title: 'TRAP STRATEGY',
                icon: '🪤',
                text: 'Trap your opponent in their own body',
                subtext: 'Corner them, cut them off, and make them run into themselves!'
            }
        ]
    },

    // Start tutorial for a specific mode
    startTutorial(mode) {
        this.active = true;
        this.currentMode = mode;
        this.currentStep = 0;

        // Show first tutorial step
        this.showStep(0);
    },

    // Show a specific tutorial step
    showStep(stepIndex) {
        this.currentStep = stepIndex;
        const steps = this.steps[this.currentMode];
        if (!steps || stepIndex >= steps.length) {
            this.completeTutorial();
            return;
        }

        const step = steps[stepIndex];

        // Hide all menus
        hideAllMenus();

        // Create or update tutorial overlay
        let overlay = document.getElementById('mode-tutorial-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mode-tutorial-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 50;
                padding: 20px;
            `;
            document.querySelector('.canvas-wrapper').appendChild(overlay);
        }

        // Mode-specific color
        const colors = {
            chronoshift: '#00ffff',
            sentinel: '#ff8800',
            gridwarfare: '#00ffcc'
        };
        const color = colors[this.currentMode] || '#00ffcc';

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">${step.icon}</div>
                <div style="
                    color: ${color};
                    font-size: 0.7rem;
                    letter-spacing: 3px;
                    margin-bottom: 10px;
                    text-shadow: 0 0 10px ${color};
                ">STEP ${stepIndex + 1} / ${steps.length}</div>
                <h2 style="
                    color: #fff;
                    font-size: 1.3rem;
                    letter-spacing: 3px;
                    margin-bottom: 20px;
                    text-shadow: 0 0 15px ${color};
                ">${step.title}</h2>
                <p style="
                    color: ${color};
                    font-size: 1rem;
                    letter-spacing: 1px;
                    line-height: 1.6;
                    margin-bottom: 15px;
                    text-shadow: 0 0 10px ${color}80;
                ">${step.text}</p>
                <p style="
                    color: #888;
                    font-size: 0.8rem;
                    letter-spacing: 1px;
                    line-height: 1.5;
                    margin-bottom: 30px;
                ">${step.subtext}</p>

                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    ${stepIndex > 0 ? `
                        <button id="btn-tutorial-prev" class="btn-menu btn-secondary" style="width: auto; padding: 8px 20px; font-size: 0.85rem;">PREV</button>
                    ` : ''}
                    <button id="btn-tutorial-next" class="btn-menu" style="width: auto; padding: 10px 30px; font-size: 1rem; border-color: ${color}; color: ${color};">${stepIndex === steps.length - 1 ? 'START' : 'NEXT'}</button>
                    <button id="btn-tutorial-skip" class="btn-menu btn-secondary" style="width: auto; padding: 8px 20px; font-size: 0.85rem;">SKIP</button>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 20px;">
                ${steps.map((_, i) => `
                    <div style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: ${i === stepIndex ? color : 'rgba(255,255,255,0.2)'};
                        box-shadow: ${i === stepIndex ? `0 0 10px ${color}` : 'none'};
                        transition: all 0.3s ease;
                    "></div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        document.getElementById('btn-tutorial-prev')?.addEventListener('click', () => {
            this.showStep(stepIndex - 1);
        });

        document.getElementById('btn-tutorial-next')?.addEventListener('click', () => {
            if (stepIndex === steps.length - 1) {
                this.completeTutorial();
            } else {
                this.showStep(stepIndex + 1);
            }
        });

        document.getElementById('btn-tutorial-skip')?.addEventListener('click', () => {
            this.completeTutorial();
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                document.removeEventListener('keydown', keyHandler);
                if (stepIndex === steps.length - 1) {
                    this.completeTutorial();
                } else {
                    this.showStep(stepIndex + 1);
                }
            } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
                document.removeEventListener('keydown', keyHandler);
                this.showStep(stepIndex - 1);
            } else if (e.key === 'Escape') {
                document.removeEventListener('keydown', keyHandler);
                this.completeTutorial();
            }
        };
        document.addEventListener('keydown', keyHandler);
    },

    // Complete the tutorial
    completeTutorial() {
        this.active = false;

        // Remove tutorial overlay
        const overlay = document.getElementById('mode-tutorial-overlay');
        if (overlay) overlay.remove();

        // Save tutorial completion for this mode
        localStorage.setItem(`serpentineTutorial_${this.currentMode}`, 'true');

        // Start the actual game mode
        switch (this.currentMode) {
            case 'chronoshift':
                hideAllMenus();
                document.getElementById('chrono-hud').classList.remove('hidden');
                if (typeof initChronoShift === 'function') {
                    initChronoShift(currentDifficultyLabel);
                }
                break;
            case 'sentinel':
                hideAllMenus();
                document.getElementById('sentinel-hud').classList.remove('hidden');
                if (typeof initSentinelBreach === 'function') {
                    initSentinelBreach(currentDifficultyLabel);
                }
                break;
            case 'gridwarfare':
                hideAllMenus();
                if (typeof GridWarfare !== 'undefined') {
                    GridWarfare.startMatch();
                }
                break;
        }

        this.currentMode = null;
    },

    // Check if tutorial has been seen for a mode
    hasCompleted(mode) {
        return localStorage.getItem(`serpentineTutorial_${mode}`) === 'true';
    },

    // Reset tutorial for a mode (allows re-showing)
    resetTutorial(mode) {
        localStorage.removeItem(`serpentineTutorial_${mode}`);
    },

    // Show tutorial check dialog when entering a mode
    checkAndShowTutorial(mode) {
        // Skip if already completed or in demo mode
        if (this.hasCompleted(mode) || demoState) {
            return false; // Don't show tutorial
        }

        // Show tutorial
        this.startTutorial(mode);
        return true; // Tutorial is being shown
    }
};

// Hook into mode selection to show tutorials
document.addEventListener('DOMContentLoaded', () => {
    // ChronoShift button
    document.getElementById('btn-chronoshift')?.addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('difficulty-select').classList.remove('hidden');
        document.getElementById('difficulty-select').dataset.targetMode = 'chronoshift';
    });

    // Sentinel Breach button
    document.getElementById('btn-sentinel')?.addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('difficulty-select').classList.remove('hidden');
        document.getElementById('difficulty-select').dataset.targetMode = 'sentinel';
    });

    // Grid Warfare button
    document.getElementById('btn-grid-warfare')?.addEventListener('click', () => {
        if (ModeTutorials.checkAndShowTutorial('gridwarfare')) return;
        hideAllMenus();
        document.getElementById('grid-mode-select').classList.remove('hidden');
    });

    // Difficulty select for ChronoShift
    document.querySelectorAll('#difficulty-select .diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.dataset.speed) || 120;
            currentDifficultySpeed = speed;
            currentDifficultyLabel = btn.dataset.diff || 'medium';

            const targetMode = document.getElementById('difficulty-select').dataset.targetMode;

            if (targetMode === 'chronoshift') {
                hideAllMenus();
                if (ModeTutorials.checkAndShowTutorial('chronoshift')) return;
                document.getElementById('chrono-hud').classList.remove('hidden');
                if (typeof initChronoShift === 'function') {
                    initChronoShift(currentDifficultyLabel);
                }
            } else if (targetMode === 'sentinel') {
                hideAllMenus();
                if (ModeTutorials.checkAndShowTutorial('sentinel')) return;
                document.getElementById('sentinel-hud').classList.remove('hidden');
                if (typeof initSentinelBreach === 'function') {
                    initSentinelBreach(currentDifficultyLabel);
                }
            } else {
                // Normal Standard mode
                hideAllMenus();
                startGame();
            }
        });
    });

    // Add tutorial reset option in settings
    const settingsContainer = document.getElementById('settings-container');
    if (settingsContainer) {
        const dataSection = settingsContainer.querySelector('.settings-section:last-child');
        if (dataSection) {
            const tutorialResetRow = document.createElement('div');
            tutorialResetRow.className = 'settings-row';
            tutorialResetRow.innerHTML = `
                <span class="settings-label">MODE TUTORIALS</span>
                <button id="btn-reset-mode-tutorials" class="btn-menu btn-secondary" style="width: auto; padding: 5px 12px; font-size: 0.75rem;">RESET</button>
            `;
            dataSection.insertBefore(tutorialResetRow, dataSection.querySelector('.danger-zone'));

            document.getElementById('btn-reset-mode-tutorials')?.addEventListener('click', () => {
                ModeTutorials.resetTutorial('chronoshift');
                ModeTutorials.resetTutorial('sentinel');
                ModeTutorials.resetTutorial('gridwarfare');
                showNotification('Mode tutorials reset', '#00ffcc');
            });
        }
    }
});

// Export
window.ModeTutorials = ModeTutorials;