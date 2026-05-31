// ═══════════════════════════════════════════════════════════════════════════
// REPLAY SYSTEM - Session 24
// Ghost Replay Data + Shareable Replay Codes
// ═══════════════════════════════════════════════════════════════════════════

const ReplaySystem = {
    // Ghost data storage (last 3 runs)
    ghostRuns: [], // Array of { mode, difficulty, character, frames, score, date }
    maxGhostRuns: 3,
    ghostEnabled: true,

    // Active ghost being rendered
    activeGhost: null,
    ghostFrameIndex: 0,

    // Shareable replay state
    isReplaying: false,
    replayData: null,
    replayFrameIndex: 0,
    replayLoop: null,

    // Replay format version
    REPLAY_VERSION: 1,

    // Direction encoding for compression
    DIRECTION_CODES: { '0,-1': 0, '0,1': 1, '-1,0': 2, '1,0': 3 },
    CODE_DIRECTIONS: ['0,-1', '0,1', '-1,0', '1,0'],

    // Initialize ghost system
    init() {
        // Load ghost runs from localStorage
        try {
            const saved = localStorage.getItem('serpentineGhostRuns');
            if (saved) {
                this.ghostRuns = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load ghost data:', e);
            this.ghostRuns = [];
        }

        // Load ghost setting
        this.ghostEnabled = localStorage.getItem('serpentineGhostEnabled') !== 'false';

        // Add ghost toggle to settings
        this.addGhostSetting();
    },

    // Add ghost toggle to settings screen
    addGhostSetting() {
        const settingsContainer = document.getElementById('settings-container');
        if (!settingsContainer) return;

        // Find the VIDEO section
        const sections = settingsContainer.querySelectorAll('.settings-section');
        let videoSection = null;
        sections.forEach(sec => {
            if (sec.querySelector('.settings-section-title')?.textContent === 'VIDEO') {
                videoSection = sec;
            }
        });

        if (!videoSection) return;

        // Check if ghost row already exists
        if (document.getElementById('ghost-toggle-row')) return;

        const ghostRow = document.createElement('div');
        ghostRow.className = 'settings-row';
        ghostRow.id = 'ghost-toggle-row';
        ghostRow.innerHTML = `
            <span class="settings-label" id="setting-ghost-label">GHOST MODE</span>
            <button id="setting-ghost" class="settings-toggle" data-setting="ghostMode" data-value="${this.ghostEnabled}">${this.ghostEnabled ? 'ON' : 'OFF'}</button>
        `;

        videoSection.appendChild(ghostRow);

        // Add event listener
        document.getElementById('setting-ghost')?.addEventListener('click', (e) => {
            const btn = e.target;
            const currentValue = btn.dataset.value === 'true';
            const newValue = !currentValue;
            btn.dataset.value = newValue;
            btn.textContent = newValue ? 'ON' : 'OFF';
            ReplaySystem.ghostEnabled = newValue;
            localStorage.setItem('serpentineGhostEnabled', newValue);
        });
    },

    // Record a frame during gameplay (called from game loop)
    recordFrame(snake, food, score, dx, dy) {
        if (this.isReplaying) return;

        // Get or create current run data
        let currentRun = this.currentRun;
        if (!currentRun) {
            currentRun = {
                mode: this.currentMode || 'standard',
                difficulty: currentDifficultyLabel || 'medium',
                character: getCurrentCharacterId(),
                frames: [],
                foodPositions: [],
                scores: [],
                score: 0,
                date: new Date().toISOString()
            };
            this.currentRun = currentRun;
        }

        // Encode frame as direction code (minimal storage)
        const dirCode = this.DIRECTION_CODES[`${dx},${dy}`] ?? 0;

        // Store head position + direction (compressed)
        currentRun.frames.push({
            x: snake[0]?.x || 0,
            y: snake[0]?.y || 0,
            d: dirCode,
            t: Date.now() // Timestamp for timing
        });

        currentRun.foodPositions.push({ ...food });
        currentRun.scores.push(score);
    },

    // Save run when game ends
    saveRun(score) {
        if (!this.currentRun || this.currentRun.frames.length < 10) {
            this.currentRun = null;
            return null;
        }

        this.currentRun.score = score;

        // Add to ghost runs (most recent first)
        this.ghostRuns.unshift({ ...this.currentRun });

        // Keep only last 3 runs
        if (this.ghostRuns.length > this.maxGhostRuns) {
            this.ghostRuns = this.ghostRuns.slice(0, this.maxGhostRuns);
        }

        // Persist to localStorage
        try {
            // Compress frames for storage (keep every 3rd frame to save space)
            const compressedRuns = this.ghostRuns.map(run => ({
                ...run,
                frames: run.frames.filter((_, i) => i % 3 === 0) // Keep every 3rd frame (~500 bytes per run)
            }));
            localStorage.setItem('serpentineGhostRuns', JSON.stringify(compressedRuns));
        } catch (e) {
            console.warn('Could not save ghost data:', e);
        }

        // Generate shareable code for this run
        const shareableCode = this.generateShareableCode(this.currentRun);

        this.currentRun = null;

        return shareableCode;
    },

    // Start ghost replay
    startGhostReplay(ghostRun, startFrame = 0) {
        this.activeGhost = { ...ghostRun };
        this.ghostFrameIndex = startFrame;
    },

    // Stop ghost replay
    stopGhostReplay() {
        this.activeGhost = null;
        this.ghostFrameIndex = 0;
    },

    // Get ghost position for current frame
    getGhostPosition(frameOffset = 0) {
        if (!this.activeGhost || !this.activeGhost.frames) return null;

        const targetIndex = this.ghostFrameIndex + frameOffset;
        if (targetIndex < 0 || targetIndex >= this.activeGhost.frames.length) return null;

        const frame = this.activeGhost.frames[targetIndex];
        if (!frame) return null;

        return {
            x: frame.x,
            y: frame.y,
            food: this.activeGhost.foodPositions ? this.activeGhost.foodPositions[targetIndex * 3] : null
        };
    },

    // Advance ghost frame
    advanceGhostFrame() {
        if (!this.activeGhost) return;
        this.ghostFrameIndex++;
        if (this.ghostFrameIndex >= this.activeGhost.frames.length) {
            this.ghostFrameIndex = 0; // Loop ghost
        }
    },

    // Generate shareable replay code (base64 encoded JSON)
    generateShareableCode(runData) {
        const replayObj = {
            v: this.REPLAY_VERSION,
            m: runData.mode,
            d: runData.difficulty,
            c: runData.character,
            s: runData.score,
            t: runData.date,
            f: runData.frames,
            fp: runData.foodPositions
        };

        // Convert to JSON and compress
        const jsonStr = JSON.stringify(replayObj);

        // Use base64 encoding
        const base64 = btoa(unescape(encodeURIComponent(jsonStr)));

        return base64;
    },

    // Parse shareable replay code
    parseShareableCode(code) {
        try {
            // Decode base64
            const jsonStr = decodeURIComponent(escape(atob(code)));
            const replayObj = JSON.parse(jsonStr);

            // Validate structure
            if (!replayObj.v || !replayObj.f || !replayObj.m) {
                throw new Error('Invalid replay format');
            }

            // Version check (future compatibility)
            if (replayObj.v > this.REPLAY_VERSION) {
                console.warn('Replay version mismatch, may not play correctly');
            }

            return replayObj;
        } catch (e) {
            console.error('Failed to parse replay code:', e);
            return null;
        }
    },

    // Start cinematic replay playback
    startCinematicReplay(code, onComplete) {
        const replayData = this.parseShareableCode(code);
        if (!replayData) {
            showNotification('Invalid replay code', '#ff0055');
            return false;
        }

        this.isReplaying = true;
        this.replayData = replayData;
        this.replayFrameIndex = 0;
        this.replayCallback = onComplete || (() => {});

        // Show replay overlay
        this.showReplayOverlay(replayData);

        // Start playback
        this.playbackInterval = setInterval(() => {
            this.replayFrameIndex++;

            if (this.replayFrameIndex >= replayData.f.length) {
                this.stopCinematicReplay();
                return;
            }

            this.updateReplayFrame();
        }, 120); // ~8 frames per second for cinematic feel

        return true;
    },

    // Show replay overlay
    showReplayOverlay(replayData) {
        const wrapper = document.querySelector('.canvas-wrapper');

        // Remove existing overlay
        const existing = document.getElementById('replay-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'replay-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 30;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="color: var(--snake-color); font-size: 1.2rem; letter-spacing: 3px; margin-bottom: 10px;">
                    REPLAY MODE
                </div>
                <div style="color: #888; font-size: 0.8rem; letter-spacing: 2px;">
                    ${replayData.m?.toUpperCase() || 'STANDARD'} • ${replayData.d?.toUpperCase() || 'MEDIUM'}
                </div>
                <div style="color: #ffd700; font-size: 1.5rem; font-weight: 900; margin-top: 10px;">
                    ${(replayData.s || 0).toLocaleString()} PTS
                </div>
            </div>
            <div style="display: flex; gap: 15px;">
                <button id="btn-replay-pause" class="btn-menu btn-secondary" style="width: auto; padding: 8px 20px; font-size: 0.9rem;">PAUSE</button>
                <button id="btn-replay-skip" class="btn-menu btn-secondary" style="width: auto; padding: 8px 20px; font-size: 0.9rem;">SKIP</button>
            </div>
            <div id="replay-progress" style="margin-top: 20px; width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                <div id="replay-progress-bar" style="height: 100%; width: 0%; background: var(--snake-color); transition: width 0.1s;"></div>
            </div>
        `;

        wrapper.appendChild(overlay);

        // Event listeners
        document.getElementById('btn-replay-pause')?.addEventListener('click', () => {
            if (this.playbackInterval) {
                clearInterval(this.playbackInterval);
                this.playbackInterval = null;
                document.getElementById('btn-replay-pause').textContent = 'PLAY';
            } else {
                this.playbackInterval = setInterval(() => {
                    this.replayFrameIndex++;
                    if (this.replayFrameIndex >= this.replayData.f.length) {
                        this.stopCinematicReplay();
                        return;
                    }
                    this.updateReplayFrame();
                }, 120);
                document.getElementById('btn-replay-pause').textContent = 'PAUSE';
            }
        });

        document.getElementById('btn-replay-skip')?.addEventListener('click', () => {
            this.stopCinematicReplay();
        });
    },

    // Update replay frame display
    updateReplayFrame() {
        if (!this.replayData || !this.replayData.f) return;

        const frame = this.replayData.f[this.replayFrameIndex];
        if (!frame) return;

        // Update progress bar
        const progress = (this.replayFrameIndex / this.replayData.f.length) * 100;
        const progressBar = document.getElementById('replay-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    },

    // Stop cinematic replay
    stopCinematicReplay() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        const overlay = document.getElementById('replay-overlay');
        if (overlay) overlay.remove();

        this.isReplaying = false;
        this.replayData = null;
        this.replayFrameIndex = 0;

        if (this.replayCallback) {
            this.replayCallback();
            this.replayCallback = null;
        }
    },

    // Draw ghost overlay on canvas
    drawGhost(ctx) {
        if (!this.activeGhost || !this.ghostEnabled) return;

        const ghostPos = this.getGhostPosition(0);
        if (!ghostPos) return;

        const gx = ghostPos.x * gridSize + gridSize / 2;
        const gy = ghostPos.y * gridSize + gridSize / 2;

        // Draw translucent ghost snake
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';

        // Draw ghost as small circle
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // Draw replay on canvas
    drawReplay(ctx) {
        if (!this.isReplaying || !this.replayData) return;

        const frame = this.replayData.f[this.replayFrameIndex];
        if (!frame) return;

        const gx = frame.x * gridSize + gridSize / 2;
        const gy = frame.y * gridSize + gridSize / 2;

        // Draw replay snake
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(gx, gy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail effect
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(gx, gy, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // Get current character ID
    currentMode: 'standard',

    // Clear current recording
    clearRecording() {
        this.currentRun = null;
    }
};

// Get current character ID helper
function getCurrentCharacterId() {
    if (typeof snakeProfiles !== 'undefined' && snakeProfiles[selectedProfileIndex]) {
        return snakeProfiles[selectedProfileIndex].name || 'neon';
    }
    return 'neon';
}

// Show copy replay code notification
function showCopyReplayNotification(code) {
    // Add "Copy Replay Code" button to game over screen
    const gameOver = document.getElementById('game-over');
    if (!gameOver) return;

    // Check if button already exists
    if (document.getElementById('btn-copy-replay')) return;

    const copyBtn = document.createElement('button');
    copyBtn.id = 'btn-copy-replay';
    copyBtn.className = 'btn-menu btn-secondary';
    copyBtn.style.cssText = 'border-color: #ffd700; color: #ffd700; margin-top: 10px;';
    copyBtn.textContent = 'COPY REPLAY CODE';

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Replay code copied!', '#ffd700');
        }).catch(() => {
            // Fallback: show in prompt
            prompt('Copy this replay code:', code);
        });
    });

    // Insert before the menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        gameOver.insertBefore(copyBtn, menuBtn);
    }
}

// Simple notification helper
function showNotification(message, color = '#00ffcc') {
    const existing = document.getElementById('replay-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.id = 'replay-notification';
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 10, 15, 0.98);
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 10px 20px;
        color: ${color};
        font-family: 'Orbitron', sans-serif;
        font-size: 0.9rem;
        letter-spacing: 2px;
        z-index: 10000;
        box-shadow: 0 0 20px ${color}40;
        animation: notifSlideIn 0.3s ease-out;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    // Add animation styles if not exists
    if (!document.getElementById('replay-anim-styles')) {
        const styles = document.createElement('style');
        styles.id = 'replay-anim-styles';
        styles.textContent = `
            @keyframes notifSlideIn {
                from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            @keyframes notifSlideOut {
                from { transform: translateX(-50%) translateY(0); opacity: 1; }
                to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notif.parentNode) {
            notif.style.animation = 'notifSlideOut 0.3s ease-in forwards';
            setTimeout(() => notif.remove(), 300);
        }
    }, 3000);
}

// Initialize replay system
document.addEventListener('DOMContentLoaded', () => {
    ReplaySystem.init();
});

// Hook into game over to save run and show copy button
const originalShowGameOver = typeof showGameOver !== 'undefined' ? showGameOver : null;

// Export for external use
window.ReplaySystem = ReplaySystem;
window.showCopyReplayNotification = showCopyReplayNotification;
window.showNotification = showNotification;