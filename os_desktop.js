// ═══════════════════════════════════════════════════════════════════════════
// SERPENTINE OS v3.0 DESKTOP
// Window-style program icons and taskbar
// ═══════════════════════════════════════════════════════════════════════════

const OSDesktop = {
    active: false,
    currentWindow: null,
    clockInterval: null,

    // Program definitions
    programs: [
        { id: 'standard', name: 'STANDARD.exe', icon: '🐍', type: 'game', class: 'standard' },
        { id: 'chronoshift', name: 'CHRONOSHIFT.exe', icon: '⏱️', type: 'game', class: 'chronoshift' },
        { id: 'sentinel', name: 'SENTINEL.exe', icon: '⚔️', type: 'game', class: 'sentinel' },
        { id: 'gridwarfare', name: 'WARFARE.exe', icon: '🏁', type: 'game', class: 'gridwarfare' },
        { id: 'breach', name: 'BREACH.exe', icon: '🔥', type: 'game', class: 'breach' },
        { id: 'neural', name: 'NEURAL_FIT.exe', icon: '🧠', type: 'game', class: 'neural' },
        { id: 'characters', name: 'CHARACTERS/', icon: '👤', type: 'folder', class: 'characters' },
        { id: 'achievements', name: 'ACHIEVEMENTS/', icon: '🏆', type: 'folder', class: 'achievements' },
        { id: 'settings', name: 'SETTINGS/', icon: '⚙️', type: 'folder', class: 'settings' }
    ],

    // Initialize the OS desktop
    init() {
        // Create desktop container
        this.createDesktop();

        // Start clock
        this.startClock();

        // Update stats
        this.updateStats();
    },

    // Create desktop elements
    createDesktop() {
        // Create main container
        let container = document.getElementById('os-desktop-container');
        if (container) container.remove();

        container = document.createElement('div');
        container.id = 'os-desktop-container';
        container.className = 'os-desktop';
        container.style.display = 'none'; // Hidden by default

        container.innerHTML = `
            <!-- Title Bar -->
            <div class="os-titlebar">
                <div class="os-titlebar-title">SERPENTINE OS v3.0</div>
                <div class="os-titlebar-controls">
                    <button class="os-titlebar-btn minimize" title="Minimize">─</button>
                    <button class="os-titlebar-btn maximize" title="Maximize">□</button>
                    <button class="os-titlebar-btn close" title="Exit">✕</button>
                </div>
            </div>

            <!-- Desktop Icons -->
            <div class="os-desktop-icons" id="os-icons">
                ${this.programs.map(prog => `
                    <div class="os-icon" data-program="${prog.id}" data-type="${prog.type}">
                        <div class="os-icon-icon ${prog.class}">${prog.icon}</div>
                        <div class="os-icon-label ${prog.class}">${prog.name}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Taskbar -->
            <div class="os-taskbar">
                <div class="os-taskbar-left">
                    <div class="os-taskbar-logo">🐍 SERPENTINE</div>
                </div>
                <div class="os-taskbar-center" id="os-taskbar-apps"></div>
                <div class="os-taskbar-right">
                    <div class="os-taskbar-stat">
                        <span class="os-taskbar-stat-icon">🎯</span>
                        <span class="os-taskbar-stat-label">BEST</span>
                        <span class="os-taskbar-stat-value score" id="os-taskbar-score">0</span>
                    </div>
                    <div class="os-taskbar-stat">
                        <span class="os-taskbar-stat-icon">💰</span>
                        <span class="os-taskbar-stat-label">BANK</span>
                        <span class="os-taskbar-stat-value bank" id="os-taskbar-bank">0</span>
                    </div>
                    <div class="os-taskbar-clock" id="os-clock">00:00</div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Add event listeners
        this.addEventListeners();
    },

    // Add desktop event listeners
    addEventListeners() {
        const container = document.getElementById('os-desktop-container');
        if (!container) return;

        // Icon clicks
        container.querySelectorAll('.os-icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const programId = icon.dataset.program;
                this.openProgram(programId);
            });

            icon.addEventListener('click', (e) => {
                container.querySelectorAll('.os-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });
        });

        // Title bar controls
        container.querySelector('.os-titlebar-btn.minimize')?.addEventListener('click', () => {
            this.toggleDesktop();
        });

        container.querySelector('.os-titlebar-btn.maximize')?.addEventListener('click', () => {
            // Toggle fullscreen
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        });

        container.querySelector('.os-titlebar-btn.close')?.addEventListener('click', () => {
            this.hideDesktop();
        });

        // Context menu on desktop
        container.querySelector('.os-desktop-icons')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Could show context menu here
        });
    },

    // Open a program
    openProgram(programId) {
        switch (programId) {
            case 'standard':
            case 'chronoshift':
            case 'sentinel':
            case 'gridwarfare':
            case 'breach':
            case 'neural':
                this.openGameProgram(programId);
                break;
            case 'characters':
                this.openCharacterSelect();
                break;
            case 'achievements':
                this.openAchievements();
                break;
            case 'settings':
                this.openSettings();
                break;
        }
    },

    // Open game program
    openGameProgram(mode) {
        // Hide desktop, show game
        this.hideDesktop();

        // Show appropriate mode selection
        hideAllMenus();

        switch (mode) {
            case 'standard':
                document.getElementById('difficulty-select')?.classList.remove('hidden');
                break;
            case 'chronoshift':
                // Check for tutorial
                if (ModeTutorials && !ModeTutorials.hasCompleted('chronoshift')) {
                    ModeTutorials.startTutorial('chronoshift');
                } else {
                    document.getElementById('difficulty-select')?.classList.remove('hidden');
                    document.getElementById('difficulty-select').dataset.targetMode = 'chronoshift';
                }
                break;
            case 'sentinel':
                // Check for tutorial
                if (ModeTutorials && !ModeTutorials.hasCompleted('sentinel')) {
                    ModeTutorials.startTutorial('sentinel');
                } else {
                    document.getElementById('difficulty-select')?.classList.remove('hidden');
                    document.getElementById('difficulty-select').dataset.targetMode = 'sentinel';
                }
                break;
            case 'gridwarfare':
                // Check for tutorial
                if (ModeTutorials && !ModeTutorials.hasCompleted('gridwarfare')) {
                    ModeTutorials.startTutorial('gridwarfare');
                } else {
                    document.getElementById('grid-mode-select')?.classList.remove('hidden');
                }
                break;
            case 'breach':
                document.getElementById('mode-select')?.classList.remove('hidden');
                document.getElementById('btn-breach')?.click();
                break;
            case 'neural':
                document.getElementById('neural-select')?.classList.remove('hidden');
                break;
        }

        // Add to taskbar
        this.addToTaskbar(mode, this.programs.find(p => p.id === mode)?.name || mode);
    },

    // Open character select
    openCharacterSelect() {
        hideAllMenus();
        document.getElementById('start-screen')?.classList.remove('hidden');
        this.addToTaskbar('characters', 'CHARACTERS/');
    },

    // Open achievements
    openAchievements() {
        hideAllMenus();
        document.getElementById('achievements-screen')?.classList.remove('hidden');
        this.addToTaskbar('achievements', 'ACHIEVEMENTS/');
    },

    // Open settings
    openSettings() {
        hideAllMenus();
        document.getElementById('settings-screen')?.classList.remove('hidden');
        this.addToTaskbar('settings', 'SETTINGS/');
    },

    // Add program to taskbar
    addToTaskbar(id, name) {
        const taskbar = document.getElementById('os-taskbar-apps');
        if (!taskbar) return;

        // Check if already in taskbar
        if (taskbar.querySelector(`[data-task-id="${id}"]`)) return;

        const item = document.createElement('div');
        item.className = 'os-taskbar-item active';
        item.dataset.taskId = id;
        item.textContent = name;

        item.addEventListener('click', () => {
            // Focus window / return to program
            this.openProgram(id);
        });

        taskbar.appendChild(item);

        // Update active states
        taskbar.querySelectorAll('.os-taskbar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    },

    // Remove from taskbar
    removeFromTaskbar(id) {
        const taskbar = document.getElementById('os-taskbar-apps');
        const item = taskbar?.querySelector(`[data-task-id="${id}"]`);
        if (item) item.remove();
    },

    // Show desktop
    showDesktop() {
        const container = document.getElementById('os-desktop-container');
        if (!container) this.init();

        // Hide game UI
        document.querySelector('.arcade-machine')?.classList.add('os-desktop-active');

        const desktop = document.getElementById('os-desktop-container');
        desktop.style.display = 'flex';

        this.active = true;
        this.updateStats();

        // Stop game music, play menu music
        if (typeof stopMusic === 'function') stopMusic();
        if (typeof startMenuMusic === 'function') startMenuMusic();
    },

    // Hide desktop
    hideDesktop() {
        const container = document.getElementById('os-desktop-container');
        if (!container) return;

        container.style.display = 'none';
        document.querySelector('.arcade-machine')?.classList.remove('os-desktop-active');

        this.active = false;
    },

    // Toggle desktop
    toggleDesktop() {
        if (this.active) {
            this.hideDesktop();
        } else {
            this.showDesktop();
        }
    },

    // Start clock
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const clockEl = document.getElementById('os-clock');
            if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
        };

        updateClock();
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.clockInterval = setInterval(updateClock, 1000);
    },

    // Update taskbar stats
    updateStats() {
        const scoreEl = document.getElementById('os-taskbar-score');
        const bankEl = document.getElementById('os-taskbar-bank');

        if (scoreEl) {
            scoreEl.textContent = typeof highScore !== 'undefined' ? highScore.toLocaleString() : '0';
        }

        if (bankEl) {
            bankEl.textContent = typeof bank !== 'undefined' ? bank.toLocaleString() : '0';
        }
    },

    // Check if desktop is active
    isActive() {
        return this.active;
    }
};

// Create "Desktop Mode" button for main menu
function createDesktopModeButton() {
    const mainMenu = document.getElementById('main-menu');
    if (!mainMenu) return;

    // Check if button already exists
    if (document.getElementById('btn-desktop-mode')) return;

    const desktopBtn = document.createElement('button');
    desktopBtn.id = 'btn-desktop-mode';
    desktopBtn.className = 'btn-menu';
    desktopBtn.style.cssText = 'border-color: #b026ff; color: #b026ff; margin-bottom: 10px;';
    desktopBtn.innerHTML = '🐍 SERPENTINE OS';

    // Insert at the top of menu buttons
    const menuButtons = mainMenu.querySelector('.menu-buttons');
    if (menuButtons) {
        menuButtons.insertBefore(desktopBtn, menuButtons.firstChild);
    }

    desktopBtn.addEventListener('click', () => {
        playMenuSelectSound();
        hideAllMenus();
        OSDesktop.showDesktop();
    });
}

// Hook into initialization
document.addEventListener('DOMContentLoaded', () => {
    // Create desktop button on main menu
    createDesktopModeButton();

    // Initialize OS Desktop
    OSDesktop.init();

    // Listen for ESC key to toggle desktop (when in menu)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && e.shiftKey) {
            // Shift+ESC to toggle desktop
            if (!isPlaying) {
                OSDesktop.toggleDesktop();
            }
        }
    });
});

// Update stats periodically
setInterval(() => {
    if (OSDesktop.isActive()) {
        OSDesktop.updateStats();
    }
}, 5000);

// Export
window.OSDesktop = OSDesktop;