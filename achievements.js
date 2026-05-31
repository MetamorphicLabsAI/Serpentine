// ═══════════════════════════════════════════════════════════════════════════
// SERPENTINE ACHIEVEMENT SYSTEM
// Achievement Registry, Tracking, and Notifications
// ═══════════════════════════════════════════════════════════════════════════

// ── Achievement Registry ────────────────────────────────────────────────────

const ACHIEVEMENTS = {
    // ════ MASTERY — Standard Mode Mastery ════
    mastery: {
        id: 'mastery',
        name: 'MASTERY',
        icon: '🐍',
        color: '#00ffcc',
        achievements: [
            {
                id: 'apprentice',
                name: 'APPRENTICE',
                description: 'Complete your first Standard run',
                icon: '🌱',
                condition: { type: 'standard_complete', count: 1 },
                reward: { type: 'badge', id: 'badge_apprentice' }
            },
            {
                id: 'competent',
                name: 'COMPETENT',
                description: 'Reach 100 points in Medium difficulty',
                icon: '⚡',
                condition: { type: 'score_reached', score: 100, difficulty: 'medium', mode: 'standard' },
                reward: { type: 'badge', id: 'badge_competent' }
            },
            {
                id: 'expert',
                name: 'EXPERT',
                description: 'Reach 500 points in Hard difficulty',
                icon: '🔥',
                condition: { type: 'score_reached', score: 500, difficulty: 'hard', mode: 'standard' },
                reward: { type: 'badge', id: 'badge_expert' }
            },
            {
                id: 'master',
                name: 'MASTER',
                description: 'Reach 1000 points in Insane difficulty',
                icon: '👑',
                condition: { type: 'score_reached', score: 1000, difficulty: 'insane', mode: 'standard' },
                reward: { type: 'badge', id: 'badge_master' }
            },
            {
                id: 'legend',
                name: 'LEGEND',
                description: 'Reach 2000 points in Insane difficulty',
                icon: '💎',
                condition: { type: 'score_reached', score: 2000, difficulty: 'insane', mode: 'standard' },
                reward: { type: 'points', amount: 10000 },
                secret: false
            }
        ]
    },

    // ════ CHRONOSHIFT — Time Manipulation Mastery ════
    chronoshift: {
        id: 'chronoshift',
        name: 'CHRONOSHIFT',
        icon: '⏱️',
        color: '#00ffff',
        achievements: [
            {
                id: 'temporal',
                name: 'TEMPORAL',
                description: 'Complete a ChronoShift run',
                icon: '⏰',
                condition: { type: 'mode_complete', mode: 'chronoshift' },
                reward: { type: 'badge', id: 'badge_temporal' }
            },
            {
                id: 'rewinder',
                name: 'REWINDER',
                description: 'Use rewind 5 times in one ChronoShift run',
                icon: '🔄',
                condition: { type: 'rewinds_per_run', count: 5 },
                reward: { type: 'badge', id: 'badge_rewinder' }
            },
            {
                id: 'timelord',
                name: 'TIMELORD',
                description: 'Survive 5 minutes in ChronoShift',
                icon: '🌌',
                condition: { type: 'survive_time', seconds: 300, mode: 'chronoshift' },
                reward: { type: 'points', amount: 10000 },
                secret: false
            }
        ]
    },

    // ════ COMBAT — Sentinel Breach Mastery ════
    combat: {
        id: 'combat',
        name: 'COMBAT',
        icon: '⚔️',
        color: '#ff8800',
        achievements: [
            {
                id: 'guardian',
                name: 'GUARDIAN',
                description: 'Clear Wave 10 in Sentinel Breach',
                icon: '🛡️',
                condition: { type: 'wave_cleared', wave: 10, mode: 'sentinel' },
                reward: { type: 'badge', id: 'badge_guardian' }
            },
            {
                id: 'defender',
                name: 'DEFENDER',
                description: 'Clear Wave 25 in Sentinel Breach',
                icon: '🏰',
                condition: { type: 'wave_cleared', wave: 25, mode: 'sentinel' },
                reward: { type: 'badge', id: 'badge_defender' }
            },
            {
                id: 'legendary',
                name: 'LEGENDARY',
                description: 'Clear Wave 50 in Sentinel Breach',
                icon: '⭐',
                condition: { type: 'wave_cleared', wave: 50, mode: 'sentinel' },
                reward: { type: 'points', amount: 50000 },
                secret: false
            }
        ]
    },

    // ════ COMPETITIVE — Grid Warfare Mastery ════
    competitive: {
        id: 'competitive',
        name: 'COMPETITIVE',
        icon: '🏁',
        color: '#ffd700',
        achievements: [
            {
                id: 'duelist',
                name: 'DUELIST',
                description: 'Win a Grid Warfare match',
                icon: '⚔️',
                condition: { type: 'grid_wins', count: 1 },
                reward: { type: 'badge', id: 'badge_duelist' }
            },
            {
                id: 'champion',
                name: 'CHAMPION',
                description: 'Win 10 Grid Warfare matches',
                icon: '🏆',
                condition: { type: 'grid_wins', count: 10 },
                reward: { type: 'badge', id: 'badge_champion' }
            },
            {
                id: 'undisputed',
                name: 'UNDISPUTED',
                description: 'Win 50 Grid Warfare matches',
                icon: '👑',
                condition: { type: 'grid_wins', count: 50 },
                reward: { type: 'points', amount: 50000 },
                secret: false
            }
        ]
    },

    // ════ COLLECTOR — Unlock All Characters ════
    collector: {
        id: 'collector',
        name: 'COLLECTOR',
        icon: '🐍',
        color: '#b026ff',
        achievements: [
            {
                id: 'completist',
                name: 'COMPLETIST',
                description: 'Unlock 10 characters',
                icon: '🎭',
                condition: { type: 'characters_unlocked', count: 10 },
                reward: { type: 'badge', id: 'badge_completist' }
            },
            {
                id: 'hardcore',
                name: 'HARDCORE',
                description: 'Unlock 25 characters',
                icon: '🔥',
                condition: { type: 'characters_unlocked', count: 25 },
                reward: { type: 'badge', id: 'badge_hardcore' }
            },
            {
                id: 'everything',
                name: 'EVERYTHING',
                description: 'Unlock all 40 characters',
                icon: '💫',
                condition: { type: 'characters_unlocked', count: 40 },
                reward: { type: 'points', amount: 100000 },
                secret: false
            }
        ]
    },

    // ════ CHALLENGES — Special Feats ════
    challenges: {
        id: 'challenges',
        name: 'CHALLENGES',
        icon: '🎯',
        color: '#ff0055',
        achievements: [
            {
                id: 'perfectionist',
                name: 'PERFECTIONIST',
                description: 'Complete a Standard run with 0 deaths',
                icon: '💎',
                condition: { type: 'perfect_run', mode: 'standard' },
                reward: { type: 'badge', id: 'badge_perfectionist' }
            },
            {
                id: 'speedrunner',
                name: 'SPEEDRUNNER',
                description: 'Complete Standard under 30 seconds',
                icon: '⚡',
                condition: { type: 'speedrun', seconds: 30, mode: 'standard' },
                reward: { type: 'badge', id: 'badge_speedrunner' }
            },
            {
                id: 'undyying',
                name: 'UNDYING',
                description: 'Use mercy 10 times in one day',
                icon: '❤️',
                condition: { type: 'mercy_used', count: 10 },
                reward: { type: 'points', amount: 10000 },
                secret: false
            }
        ]
    }
};

// ── Achievement Manager ──────────────────────────────────────────────────────

const AchievementManager = {
    // State
    unlockedAchievements: new Set(),
    runStats: {
        rewindsUsed: 0,
        foodEaten: 0,
        deaths: 0,
        mercyUsed: 0,
        startTime: 0
    },
    dailyMercyCount: 0,
    dailyMercyDate: null,

    // Notification queue
    notificationQueue: [],
    isShowingNotification: false,

    // ── Initialization ──────────────────────────────────────────────────────

    init() {
        this.loadState();
        this.setupEventListeners();
        this.updateAchievementsButton();
        console.log('[AchievementManager] Initialized with', this.unlockedAchievements.size, 'achievements');
    },

    loadState() {
        const saved = localStorage.getItem('serpentineAchievements');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlockedAchievements = new Set(data.unlocked || []);

                // Reset daily mercy count if new day
                const today = new Date().toISOString().split('T')[0];
                if (data.dailyMercyDate !== today) {
                    this.dailyMercyCount = 0;
                } else {
                    this.dailyMercyCount = data.dailyMercyCount || 0;
                }
                this.dailyMercyDate = today;
            } catch (e) {
                console.warn('[AchievementManager] Failed to load state');
            }
        }
    },

    saveState() {
        const data = {
            unlocked: Array.from(this.unlockedAchievements),
            dailyMercyCount: this.dailyMercyCount,
            dailyMercyDate: this.dailyMercyDate
        };
        localStorage.setItem('serpentineAchievements', JSON.stringify(data));
    },

    setupEventListeners() {
        // Listen for game events from the main game loop
        document.addEventListener('achievement_check', (e) => this.checkAchievements(e.detail));
 },

    // ── Run Tracking ────────────────────────────────────────────────────────

    startRun(mode) {
        this.runStats = {
            rewindsUsed: 0,
            foodEaten: 0,
            deaths: 0,
            mercyUsed: 0,
            startTime: Date.now(),
            mode: mode
        };
    },

    onFoodCollected() {
        this.runStats.foodEaten++;
        this.checkCondition('food_collected', this.runStats.foodEaten);
    },

    onDeath() {
        this.runStats.deaths++;
    },

    onMercyUsed() {
        this.runStats.mercyUsed++;

        // Track daily mercy usage
        const today = new Date().toISOString().split('T')[0];
        if (this.dailyMercyDate !== today) {
            this.dailyMercyCount = 0;
            this.dailyMercyDate = today;
        }
        this.dailyMercyCount++;

        this.checkCondition('mercy_used', this.dailyMercyCount);
    },

    onRewindUsed() {
        this.runStats.rewindsUsed++;
        this.checkCondition('rewinds_per_run', this.runStats.rewindsUsed);
    },

    onWaveCleared(wave, mode) {
        this.checkCondition('wave_cleared', wave, { mode });
    },

    onGameEnded(mode, score, difficulty) {
        const runDuration = this.runStats.startTime ? Math.floor((Date.now() - this.runStats.startTime) / 1000) : 0;

        // Check mode completion
        this.checkCondition('mode_complete', 1, { mode });

        // Check score achievements
        this.checkCondition('score_reached', score, { mode, difficulty });

        // Check perfect run (no deaths)
        if (this.runStats.deaths === 0 && mode === 'standard') {
            this.checkCondition('perfect_run', 1, { mode });
        }

        // Check speedrun
        if (runDuration > 0) {
            this.checkCondition('speedrun', runDuration, { mode });
        }

        // Check survive time
        this.checkCondition('survive_time', runDuration, { mode });
    },

    onGridWarfareWin(wins) {
        this.checkCondition('grid_wins', wins);
    },

    onCharacterUnlocked(count) {
        this.checkCondition('characters_unlocked', count);
    },

    // ── Condition Checking ──────────────────────────────────────────────────

    checkCondition(type, value, extra = {}) {
        for (const categoryKey in ACHIEVEMENTS) {
            const category = ACHIEVEMENTS[categoryKey];
            for (const ach of category.achievements) {
                if (this.unlockedAchievements.has(ach.id)) continue;

                const cond = ach.condition;
                if (cond.type !== type) continue;

                let matched = false;

                switch (type) {
                    case 'food_collected':
                        matched = true; // Any food collected counts
                        break;

                    case 'mercy_used':
                        matched = value >= cond.count;
                        break;

                    case 'rewinds_per_run':
                        matched = value >= cond.count;
                        break;

                    case 'wave_cleared':
                        matched = value >= cond.wave && (!cond.mode || extra.mode === cond.mode);
                        break;

                    case 'mode_complete':
                        matched = (!cond.mode || extra.mode === cond.mode);
                        break;

                    case 'score_reached':
                        matched = value >= cond.score &&
                                  (!cond.mode || extra.mode === cond.mode) &&
                                  (!cond.difficulty || extra.difficulty === cond.difficulty);
                        break;

                    case 'perfect_run':
                        matched = (!cond.mode || extra.mode === cond.mode);
                        break;

                    case 'speedrun':
                        matched = value < cond.seconds && (!cond.mode || extra.mode === cond.mode);
                        break;

                    case 'survive_time':
                        matched = value >= cond.seconds && (!cond.mode || extra.mode === cond.mode);
                        break;

                    case 'grid_wins':
                        matched = value >= cond.count;
                        break;

                    case 'characters_unlocked':
                        matched = value >= cond.count;
                        break;

                    case 'standard_complete':
                        matched = true;
                        break;
                }

                if (matched) {
                    this.unlockAchievement(ach);
                }
            }
        }
    },

    checkAchievements(detail) {
        // Generic event handler for achievement checks
        const { type, value, ...extra } = detail;
        this.checkCondition(type, value, extra);
    },

    // ── Unlock Logic ────────────────────────────────────────────────────────

    unlockAchievement(achievement) {
        if (this.unlockedAchievements.has(achievement.id)) return;

        this.unlockedAchievements.add(achievement.id);
        this.saveState();

        // Award reward
        if (achievement.reward) {
            this.awardReward(achievement.reward);
        }

        // Queue notification
        this.queueNotification(achievement);

        // Update UI
        this.updateAchievementsButton();

        // Update profile badges if applicable
        this.updateProfileBadges();

        // Check milestone bonuses
        this.checkMilestoneBonus();

        console.log('[AchievementManager] Unlocked:', achievement.name);
    },

    awardReward(reward) {
        if (!saveManager?.profile) return;

        switch (reward.type) {
            case 'points':
                saveManager.addToBank(reward.amount);
                break;
            case 'badge':
                if (!saveManager.profile.badges.earned.includes(reward.id)) {
                    saveManager.profile.badges.earned.push(reward.id);
                }
                break;
            case 'character':
                saveManager.unlockCharacter(reward.id);
                break;
        }
        saveManager.save(true);
    },

    updateProfileBadges() {
        if (!saveManager?.profile) return;

        // Map achievement categories to profile badge categories
        const categoryMap = {
            mastery: 'mastery',
            chronoshift: 'temporal',
            combat: 'combat',
            competitive: 'competitive',
            collector: 'collector',
            challenges: 'challenges'
        };

        for (const [catKey, catVal] of Object.entries(ACHIEVEMENTS)) {
            const profileCat = categoryMap[catKey];
            if (!profileCat) continue;

            const earnedInCategory = catVal.achievements
                .filter(a => this.unlockedAchievements.has(a.id))
                .map(a => 'ACH_' + a.id.toUpperCase());

            if (earnedInCategory.length > 0) {
                if (!saveManager.profile.badges.categories[profileCat]) {
                    saveManager.profile.badges.categories[profileCat] = [];
                }
                for (const badge of earnedInCategory) {
                    if (!saveManager.profile.badges.categories[profileCat].includes(badge)) {
                        saveManager.profile.badges.categories[profileCat].push(badge);
                    }
                }
            }
        }
    },

    checkMilestoneBonus() {
        const count = this.unlockedAchievements.size;

        // Every 5 achievements: +10,000 bonus
        if (count % 5 === 0) {
            if (saveManager?.profile) {
                saveManager.addToBank(10000);
                saveManager.save(true);
            }
            this.showMilestoneNotification(count);
        }

        // Milestone achievements (10/20/30/40): +50,000 bonus
        if ([10, 20, 30, 40].includes(count)) {
            if (saveManager?.profile) {
                saveManager.addToBank(50000);
                saveManager.save(true);
            }
        }
    },

    // ── Notification System ──────────────────────────────────────────────────

    queueNotification(achievement) {
        this.notificationQueue.push(achievement);
        this.processNotificationQueue();
    },

    processNotificationQueue() {
        if (this.isShowingNotification || this.notificationQueue.length === 0) return;

        this.isShowingNotification = true;
        const achievement = this.notificationQueue.shift();
        this.showNotification(achievement);
    },

    showNotification(achievement) {
        // Find category for styling
        let category = null;
        for (const key in ACHIEVEMENTS) {
            if (ACHIEVEMENTS[key].achievements.some(a => a.id === achievement.id)) {
                category = ACHIEVEMENTS[key];
                break;
            }
        }

        const color = category?.color || '#00ffcc';

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-inner" style="border-color: ${color}; box-shadow: 0 0 30px ${color}40;">
                <div class="achievement-notification-header" style="color: ${color};">
                    <span class="achievement-notification-icon">🏆</span>
                    <span>ACHIEVEMENT UNLOCKED</span>
                </div>
                <div class="achievement-notification-content">
                    <div class="achievement-notification-icon-large">${achievement.icon}</div>
                    <div class="achievement-notification-text">
                        <div class="achievement-notification-name" style="color: ${color};">${achievement.name}</div>
                        <div class="achievement-notification-desc">${achievement.description}</div>
                    </div>
                </div>
                ${achievement.reward?.type === 'points' ? `
                    <div class="achievement-notification-reward">
                        +${achievement.reward.amount.toLocaleString()} PTS
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(notification);

        // Play achievement sound
        this.playAchievementSound();

        // Emit particles
        this.emitCelebrationParticles();

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                this.isShowingNotification = false;
                this.processNotificationQueue();
            }, 500);
        }, 4000);
    },

    showMilestoneNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification milestone';
        notification.innerHTML = `
            <div class="achievement-notification-inner" style="border-color: #ffd700; box-shadow: 0 0 40px #ffd70060;">
                <div class="achievement-notification-header" style="color: #ffd700;">
                    <span class="achievement-notification-icon">⭐</span>
                    <span>MILESTONE!</span>
                </div>
                <div class="achievement-notification-content">
                    <div class="achievement-notification-icon-large">🎯</div>
                    <div class="achievement-notification-text">
                        <div class="achievement-notification-name" style="color: #ffd700;">${count} ACHIEVEMENTS</div>
                        <div class="achievement-notification-desc">Every 5 achievements = +10,000 PTS bonus!</div>
                    </div>
                </div>
                <div class="achievement-notification-reward" style="color: #ffd700;">
                    +10,000 PTS
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    },

    playAchievementSound() {
        if (typeof audioCtx === 'undefined') return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;

        // Triumphant arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.4);
        });
    },

    emitCelebrationParticles() {
        // Create celebration particle effect
        const container = document.getElementById('celebration-particles');
        if (!container) return;

        const colors = ['#00ffcc', '#ffd700', '#ff0055', '#b026ff', '#00ffff'];

        // Create 30 particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.style.left = (Math.random() * 60 + 20) + '%';
            particle.style.top = (Math.random() * 40 + 10) + '%';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDelay = (Math.random() * 0.5) + 's';
            particle.style.width = (Math.random() * 8 + 5) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);

            // Remove after animation
            setTimeout(() => particle.remove(), 2500);
        }
    },

    // ── UI Updates ──────────────────────────────────────────────────────────

    updateAchievementsButton() {
        const btn = document.getElementById('btn-achievements-menu');
        if (btn) {
            const count = this.unlockedAchievements.size;
            const total = this.getTotalAchievementCount();
            if (count > 0) {
                btn.innerHTML = `ACHIEVEMENTS <span class="achievement-count-badge">${count}/${total}</span>`;
            }
        }
    },

    getTotalAchievementCount() {
        let count = 0;
        for (const key in ACHIEVEMENTS) {
            count += ACHIEVEMENTS[key].achievements.length;
        }
        return count;
    },

    // ── Achievements Screen ─────────────────────────────────────────────────

    showAchievementsScreen() {
        const screen = document.getElementById('achievements-screen');
        if (!screen) return;

        // Populate achievements
        this.populateAchievementsList();

        // Show screen
        screen.classList.remove('hidden');

        // Play sound
        if (typeof playMenuSelectSound === 'function') playMenuSelectSound();
    },

    hideAchievementsScreen() {
        const screen = document.getElementById('achievements-screen');
        if (screen) screen.classList.add('hidden');
    },

    populateAchievementsList() {
        const container = document.getElementById('achievements-list');
        if (!container) return;

        container.innerHTML = '';

        // Progress summary
        const total = this.getTotalAchievementCount();
        const unlocked = this.unlockedAchievements.size;
        const progress = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        document.getElementById('achievements-progress-fill').style.width = progress + '%';
        document.getElementById('achievements-progress-text').textContent = `${unlocked} / ${total} (${progress}%)`;

        // Category tabs
        const tabsContainer = document.getElementById('achievements-category-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';

            // All tab
            const allTab = document.createElement('button');
            allTab.className = 'btn-ach-tab active';
            allTab.dataset.category = 'all';
            allTab.textContent = 'ALL';
            allTab.addEventListener('click', () => this.filterAchievements('all'));
            tabsContainer.appendChild(allTab);

            // Category tabs
            for (const key in ACHIEVEMENTS) {
                const cat = ACHIEVEMENTS[key];
                const tab = document.createElement('button');
                tab.className = 'btn-ach-tab';
                tab.dataset.category = key;
                tab.textContent = cat.icon + ' ' + cat.name;
                tab.style.setProperty('--tab-color', cat.color);
                tab.addEventListener('click', () => this.filterAchievements(key));
                tabsContainer.appendChild(tab);
            }
        }

        // Achievement cards
        for (const key in ACHIEVEMENTS) {
            const category = ACHIEVEMENTS[key];
            for (const ach of category.achievements) {
                const isUnlocked = this.unlockedAchievements.has(ach.id);
                const card = this.createAchievementCard(ach, category, isUnlocked);
                card.dataset.category = key;
                container.appendChild(card);
            }
        }
    },

    createAchievementCard(achievement, category, isUnlocked) {
        const card = document.createElement('div');
        card.className = 'achievement-card' + (isUnlocked ? ' unlocked' : ' locked');
        card.style.setProperty('--ach-color', category.color);

        if (isUnlocked) {
            card.innerHTML = `
                <div class="achievement-card-icon">${achievement.icon}</div>
                <div class="achievement-card-info">
                    <div class="achievement-card-name">${achievement.name}</div>
                    <div class="achievement-card-desc">${achievement.description}</div>
                    ${achievement.reward?.type === 'points' ? `
                        <div class="achievement-card-reward">+${achievement.reward.amount.toLocaleString()} PTS</div>
                    ` : ''}
                </div>
                <div class="achievement-card-check">✓</div>
            `;
        } else {
            const hint = achievement.secret ? '???' : achievement.description;
            card.innerHTML = `
                <div class="achievement-card-icon locked-icon">?</div>
                <div class="achievement-card-info">
                    <div class="achievement-card-name locked-name">???</div>
                    <div class="achievement-card-desc">${hint}</div>
                </div>
                <div class="achievement-card-lock">🔒</div>
            `;
        }

        return card;
    },

    filterAchievements(category) {
        // Update tab states
        document.querySelectorAll('.btn-ach-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Filter cards
        document.querySelectorAll('.achievement-card').forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    },

    // ── Badge Display ───────────────────────────────────────────────────────

    getEarnedBadges() {
        const badges = [];
        for (const key in ACHIEVEMENTS) {
            const category = ACHIEVEMENTS[key];
            for (const ach of category.achievements) {
                if (this.unlockedAchievements.has(ach.id)) {
                    badges.push({
                        id: ach.id,
                        name: ach.name,
                        icon: ach.icon,
                        category: key,
                        color: ACHIEVEMENTS[key].color
                    });
                }
            }
        }
        return badges;
    },

    // ── Utility ────────────────────────────────────────────────────────────

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    },

    getProgress() {
        return {
            unlocked: this.unlockedAchievements.size,
            total: this.getTotalAchievementCount(),
            percentage: this.getTotalAchievementCount() > 0
                ? Math.round((this.unlockedAchievements.size / this.getTotalAchievementCount()) * 100)
                : 0
        };
    }
};

// ── Initialize on Load ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Initialize after save manager is ready
    if (typeof saveManager !== 'undefined') {
        saveManager.load().then(() => {
            AchievementManager.init();
        });
    } else {
        // Fallback: initialize after short delay
        setTimeout(() => {
            AchievementManager.init();
        }, 500);
    }
});

// Export for external use
window.AchievementManager = AchievementManager;
window.ACHIEVEMENTS = ACHIEVEMENTS;
