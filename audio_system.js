/**
 * SERPENTINE AUDIO SYSTEM v3.0
 * Session 21: Audio Expansion
 *
 * Procedural audio synthesis engine using Web Audio API.
 * All audio is generated in real-time - no external audio files required.
 *
 * Tracks:
 * - Main Menu (existing, extended)
 * - Game Track (existing)
 * - Chrono Ambient (NEW)
 * - Sentinel Combat (NEW)
 * - Firewall Alarm (NEW)
 * - Neural Calm (NEW)
 * - Victory Fanfare (NEW)
 * - Game Over Requiem (NEW)
 *
 * SFX Expansion:
 * - powerup_spawn, mercy_activate, achievement_unlock
 * - wave_complete, mode_transition, button_hover
 * - character_unlock_cascade, easter_egg_discovered
 * - rewind, slowmo_activate, fastforward_activate
 * - pulse_activate, nexus_hum, sentinel_spawn
 * - sentinel_death, chrono_collect, food_spawn
 */

(function() {
    'use strict';

    // Check if already initialized
    if (window.serpentineAudio) return;

    /**
     * SerpentineAudio - Main audio controller class
     */
    class SerpentineAudio {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.musicGain = null;
            this.sfxGain = null;
            this.currentTrack = null;
            this.musicInterval = null;
            this.isInitialized = false;

            // Volume settings (0-100 scale, converted to 0-1 for Web Audio)
            this._masterVolume = 0.8;
            this._musicVolume = 0.4;
            this._sfxVolume = 0.5;

            // Track state
            this.currentStep = 0;
            this.menuStep = 0;
            this.chronoStep = 0;
            this.sentinelStep = 0;
            this.alarmStep = 0;
            this.neuralStep = 0;

            // Sequencer step durations (ms)
            this.SEQ_STEP = 150;
            this.MENU_STEP = 175;
            this.CHRONO_STEP = 150;
            this.SENTINEL_STEP = 125;
            this.ALARM_STEP = 100;
            this.NEURAL_STEP = 200;
        }

        /**
         * Initialize audio context on user interaction (handles autoplay restrictions)
         */
        init() {
            if (this.isInitialized) return;

            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();

                // Create gain nodes
                this.masterGain = this.ctx.createGain();
                this.musicGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();

                // Connect: sources -> sfx/music -> master -> destination
                this.musicGain.connect(this.masterGain);
                this.sfxGain.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);

                // Apply saved volume settings
                this.masterGain.gain.value = this._masterVolume;
                this.musicGain.gain.value = this._musicVolume;
                this.sfxGain.gain.value = this._sfxVolume;

                this.isInitialized = true;
                console.log('[Audio] SerpentineAudio initialized');

            } catch (e) {
                console.error('[Audio] Failed to initialize:', e);
            }
        }

        /**
         * Resume audio context if suspended
         */
        _ensureContext() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        // ─────────────────────────────────────────
        // VOLUME CONTROLS
        // ─────────────────────────────────────────

        setMasterVolume(v) {
            this._masterVolume = v / 100;
            if (this.masterGain) {
                this.masterGain.gain.setTargetAtTime(this._masterVolume, this.ctx.currentTime, 0.1);
            }
        }

        setMusicVolume(v) {
            this._musicVolume = v / 100;
            if (this.musicGain) {
                this.musicGain.gain.setTargetAtTime(this._musicVolume, this.ctx.currentTime, 0.1);
            }
        }

        setSFXVolume(v) {
            this._sfxVolume = v / 100;
            if (this.sfxGain) {
                this.sfxGain.gain.setTargetAtTime(this._sfxVolume, this.ctx.currentTime, 0.1);
            }
        }

        // ─────────────────────────────────────────
        // TRACK PLAYBACK
        // ─────────────────────────────────────────

        /**
         * Play a music track by name
         * @param {string} trackName - Track identifier
         */
        playTrack(trackName) {
            this._ensureContext();

            // Stop current track first
            this.stopTrack();

            switch(trackName) {
                case 'menu':
                    this._playMenuTrack();
                    break;
                case 'game':
                    this._playGameTrack();
                    break;
                case 'chrono_ambient':
                    this._playChronoAmbient();
                    break;
                case 'sentinel_combat':
                    this._playSentinelCombat();
                    break;
                case 'firewall_alarm':
                    this._playFirewallAlarm();
                    break;
                case 'neural_calm':
                    this._playNeuralCalm();
                    break;
                case 'victory_fanfare':
                    this._playVictoryFanfare();
                    break;
                case 'game_over_requiem':
                    this._playGameOverRequiem();
                    break;
                default:
                    console.warn('[Audio] Unknown track:', trackName);
            }

            this.currentTrack = trackName;
        }

        /**
         * Stop all music playback
         */
        stopTrack() {
            if (this.musicInterval) {
                clearInterval(this.musicInterval);
                this.musicInterval = null;
            }
            this.currentTrack = null;

            // Disconnect music gain
            if (this.musicGain) {
                try {
                    this.musicGain.disconnect();
                } catch(e) {}
            }
        }

        // ─────────────────────────────────────────
        // SFX PLAYBACK
        // ─────────────────────────────────────────

        /**
         * Play a one-shot sound effect
         * @param {string} name - SFX identifier
         * @param {object} options - Optional parameters (pan, volume multiplier)
         */
        playSFX(name, options = {}) {
            this._ensureContext();

            const volMultiplier = options.volume || 1;

            switch(name) {
                // Session 21 new SFX
                case 'powerup_spawn':
                    this._sfxPowerupSpawn(volMultiplier);
                    break;
                case 'mercy_activate':
                    this._sfxMercyActivate(volMultiplier);
                    break;
                case 'achievement_unlock':
                    this._sfxAchievementUnlock(volMultiplier);
                    break;
                case 'wave_complete':
                    this._sfxWaveComplete(volMultiplier);
                    break;
                case 'mode_transition':
                    this._sfxModeTransition(volMultiplier);
                    break;
                case 'button_hover':
                    this._sfxButtonHover(volMultiplier);
                    break;
                case 'character_unlock_cascade':
                    this._sfxCharacterUnlockCascade(volMultiplier);
                    break;
                case 'easter_egg_discovered':
                    this._sfxEasterEggDiscovered(volMultiplier);
                    break;
                case 'rewind':
                    this._sfxRewind(volMultiplier);
                    break;
                case 'slowmo_activate':
                    this._sfxSlowmoActivate(volMultiplier);
                    break;
                case 'fastforward_activate':
                    this._sfxFastforwardActivate(volMultiplier);
                    break;
                case 'pulse_activate':
                    this._sfxPulseActivate(volMultiplier);
                    break;
                case 'nexus_hum':
                    this._sfxNexusHum(volMultiplier);
                    break;
                case 'sentinel_spawn':
                    this._sfxSentinelSpawn(volMultiplier);
                    break;
                case 'sentinel_death':
                    this._sfxSentinelDeath(volMultiplier);
                    break;
                case 'chrono_collect':
                    this._sfxChronoCollect(volMultiplier);
                    break;
                case 'food_spawn':
                    this._sfxFoodSpawn(volMultiplier);
                    break;

                // Legacy SFX (kept for compatibility)
                case 'eat':
                    this._sfxEat(volMultiplier);
                    break;
                case 'death':
                    this._sfxDeath(volMultiplier);
                    break;
                case 'unlock':
                    this._sfxUnlock(volMultiplier);
                    break;
                case 'powerup':
                    this._sfxPowerup(volMultiplier);
                    break;

                default:
                    console.warn('[Audio] Unknown SFX:', name);
            }
        }

        /**
         * Stop a continuous SFX (like nexus_hum)
         */
        stopSFX(name) {
            // Implementation for continuous SFX stop
        }

        // ═════════════════════════════════════════
        // TRACK IMPLEMENTATIONS
        // ═════════════════════════════════════════

        /**
         * Main Menu Track - 64-step loop, 175ms per step
         * Phase 1 (0-31): Deep drone, atmospheric
         * Phase 2 (32-63): "The Drop" with rhythm
         */
        _playMenuTrack() {
            // Recreate music gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(this.masterGain);

            this.menuStep = 0;
            const stepTime = this.MENU_STEP;

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;
                const isDroning = this.menuStep < 32;
                const progression = [110, 87.31, 130.81, 98];
                const root = progression[Math.floor(this.menuStep / 8) % 4] / 2;

                // Bass: Low pulse
                if (this.menuStep % 2 === 0) {
                    const vol = isDroning ? 0.35 : 0.55;
                    const length = isDroning ? 0.6 : 0.15;
                    this._playBass(root, length, vol, isDroning ? 300 : 600, time);
                }

                // Lead: Arpeggio during drop phase
                if (!isDroning) {
                    const arp = [0, 7, 12, 19];
                    const note = root * 2 * Math.pow(2, arp[this.menuStep % 4] / 12);
                    this._playLead(note, 0.1, 0.15, 1200, time);
                }

                // Kick: Soft kick every 4 steps during drop
                if (!isDroning && this.menuStep % 4 === 0) {
                    this._playKick(time);
                }

                this.menuStep = (this.menuStep + 1) % 64;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer(); // Start immediately
        }

        /**
         * Game Track - 256-step loop, 150ms per step
         * A minor progression: Am - F - C - G
         */
        _playGameTrack() {
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.4;
            this.musicGain.connect(this.masterGain);

            this.currentStep = 0;
            const stepTime = this.SEQ_STEP;

            const bassProgression = [220, 174.61, 130.81, 196];
            const melPattern = [
                null, 440, null, 523.25, null, 659.25, null, 523.25,
                null, 440, null, 392, null, 349.23, null, 392,
                null, 523.25, null, 587.33, null, 659.25, null, 587.33,
                null, 523.25, null, 440, null, 392, null, 440
            ];

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;
                const progIndex = Math.floor(this.currentStep / 64) % 4;
                const bassFreq = bassProgression[progIndex];

                // Bass line
                this._playBass(bassFreq, 0.15, 0.6, 800, time);

                // Melody (second half of sequence)
                if (this.currentStep >= 128) {
                    const melFreq = melPattern[this.currentStep % 32];
                    if (melFreq) {
                        this._playLead(melFreq, 0.15, 0.25, 1200, time);
                    }
                }

                // Kick on beats 1 and 3
                if (this.currentStep % 4 === 0) this._playKick(time);

                // Snare on beats 2 and 4
                if (this.currentStep % 4 === 2) this._playSnare(time);

                this.currentStep = (this.currentStep + 1) % 256;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer();
        }

        /**
         * Chrono Ambient - 60s loop, tense/time-dilated mood
         * A minor with reverse cymbals, heartbeat, clock ticks
         */
        _playChronoAmbient() {
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(this.masterGain);

            this.chronoStep = 0;
            const stepTime = this.CHRONO_STEP;

            // A minor progression with tension
            const bassProgression = [110, 110, 87.31, 87.31, 98, 98, 130.81, 130.81];
            const melodyPattern = [
                440, null, 523.25, null, 659.25, null, 523.25, null,
                392, null, 466.16, null, 587.33, null, 466.16, null,
                349.23, null, 440, null, 523.25, null, 440, null,
                293.66, null, 369.99, null, 493.88, null, 369.99, null
            ];

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;
                const progIndex = Math.floor(this.chronoStep / 100) % 8;
                const bassFreq = bassProgression[progIndex];

                // Deep bass drone
                this._playBass(bassFreq, 0.2, 0.4, 400, time);

                // High arpeggios (time-dilated feel)
                const melFreq = melodyPattern[this.chronoStep % 32];
                if (melFreq) {
                    this._playLead(melFreq, 0.12, 0.2, 2000, time);
                }

                // Reverse cymbal effect every 8 steps
                if (this.chronoStep % 8 === 0) {
                    this._playReverseCymbal(time);
                }

                // Heartbeat pulse every 16 bars (simulated by step count)
                if (this.chronoStep % 16 === 0) {
                    this._playHeartbeat(time);
                }

                this.chronoStep = (this.chronoStep + 1) % 400;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer();
        }

        /**
         * Sentinel Combat - 40s loop, aggressive/driving
         * Distorted bass, heavy snare, alarm synth stabs
         */
        _playSentinelCombat() {
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.45;
            this.musicGain.connect(this.masterGain);

            this.sentinelStep = 0;
            const stepTime = this.SENTINEL_STEP;

            // Aggressive E minor
            const bassProgression = [82.41, 82.41, 98, 98, 110, 110, 98, 82.41];
            const alarmPattern = [0, 0, 330, 0, 0, 0, 330, 0];

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;
                const progIndex = Math.floor(this.sentinelStep / 32) % 8;
                const bassFreq = bassProgression[progIndex];

                // Distorted bass
                this._playDistortedBass(bassFreq, 0.1, 0.7, 600, time);

                // Alarm synth stabs
                if (alarmPattern[this.sentinelStep % 8]) {
                    this._playAlarmSynth(330, 0.08, 0.3, time);
                }

                // Heavy kick every beat
                this._playHeavyKick(time);

                // Snare on 2 and 4
                if (this.sentinelStep % 2 === 1) {
                    this._playHeavySnare(time);
                }

                this.sentinelStep = (this.sentinelStep + 1) % 320;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer();
        }

        /**
         * Firewall Alarm - 20s loop, claustrophobic/urgent
         * Pulsing red alarm, compressed bass, static
         */
        _playFirewallAlarm() {
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.4;
            this.musicGain.connect(this.masterGain);

            this.alarmStep = 0;
            const stepTime = this.ALARM_STEP;

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;

                // Pulsing alarm tone
                if (this.alarmStep % 2 === 0) {
                    this._playAlarmSynth(220, 0.08, 0.4, time);
                    this._playAlarmSynth(277, 0.08, 0.2, time);
                }

                // Compressed bass pulse
                this._playCompressedBass(55, 0.08, 0.5, time);

                // Static crackle
                if (this.alarmStep % 4 === 0) {
                    this._playStatic(time);
                }

                this.alarmStep = (this.alarmStep + 1) % 200;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer();
        }

        /**
         * Neural Calm - 80s loop, meditative/flowing
         * Soft pad, gentle piano-like notes, nature sounds
         */
        _playNeuralCalm() {
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.25;
            this.musicGain.connect(this.masterGain);

            this.neuralStep = 0;
            const stepTime = this.NEURAL_STEP;

            // D minor, very calm
            const padFreqs = [146.83, 220, 293.66]; // D3, A3, D4
            const melodyNotes = [
                293.66, null, 329.63, null, 369.99, null, 329.63, null,
                261.63, null, 293.66, null, 329.63, null, 293.66, null,
                220, null, 261.63, null, 293.66, null, 261.63, null,
                196, null, 220, null, 261.63, null, 220, null
            ];

            const sequencer = () => {
                if (!this.isInitialized) return;

                const time = this.ctx.currentTime;

                // Soft pad (static drone)
                if (this.neuralStep % 4 === 0) {
                    padFreqs.forEach(freq => {
                        this._playPad(freq, 0.5, 0.08, 800, time);
                    });
                }

                // Gentle piano-like notes
                const melFreq = melodyNotes[this.neuralStep % 32];
                if (melFreq) {
                    this._playPiano(melFreq, 0.3, 0.15, 2000, time);
                }

                // Occasional nature/water drop
                if (this.neuralStep % 32 === 16) {
                    this._playWaterDrop(time);
                }

                this.neuralStep = (this.neuralStep + 1) % 400;
            };

            this.musicInterval = setInterval(sequencer, stepTime);
            sequencer();
        }

        /**
         * Victory Fanfare - 3s, triumphant
         * Full chord sweep, brass approximation
         */
        _playVictoryFanfare() {
            this._ensureContext();

            const time = this.ctx.currentTime;

            // Major chord sweep: C-E-G-C
            const chordFreqs = [261.63, 329.63, 392, 523.25];

            chordFreqs.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(500, time + i * 0.15);
                filter.frequency.exponentialRampToValueAtTime(2000, time + i * 0.15 + 0.3);

                gain.gain.setValueAtTime(0, time + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.2, time + i * 0.15 + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 3);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);

                osc.start(time + i * 0.15);
                osc.stop(time + 3);
            });

            // Brass-like stab on top
            const brassOsc = this.ctx.createOscillator();
            const brassGain = this.ctx.createGain();

            brassOsc.type = 'square';
            brassOsc.frequency.setValueAtTime(523.25, time + 0.5);
            brassOsc.frequency.setValueAtTime(659.25, time + 0.7);
            brassOsc.frequency.setValueAtTime(783.99, time + 0.9);

            brassGain.gain.setValueAtTime(0, time + 0.5);
            brassGain.gain.linearRampToValueAtTime(0.15, time + 0.6);
            brassGain.gain.exponentialRampToValueAtTime(0.01, time + 2.5);

            brassOsc.connect(brassGain);
            brassGain.connect(this.musicGain);

            brassOsc.start(time + 0.5);
            brassOsc.stop(time + 3);
        }

        /**
         * Game Over Requiem - 4s, melancholic
         * Descending minor chord with delay
         */
        _playGameOverRequiem() {
            this._ensureContext();

            const time = this.ctx.currentTime;

            // A minor descending: A - G# - G - F#
            const notes = [
                [220, 261.63, 329.63],  // Am
                [207.65, 246.94, 293.66], // G# dim
                [196, 246.94, 293.66],   // G major
                [185, 220, 261.63]        // F# dim
            ];

            notes.forEach((chord, chordIndex) => {
                chord.forEach((freq) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const delay = this.ctx.createDelay();

                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    // Add delay effect
                    delay.delayTime.value = 0.3 + (chordIndex * 0.1);

                    const startTime = time + chordIndex * 0.8;
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.2);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);

                    osc.connect(gain);
                    gain.connect(delay);
                    delay.connect(this.musicGain);

                    osc.start(startTime);
                    osc.stop(time + 4);
                });
            });

            // Final descending tone
            const finalOsc = this.ctx.createOscillator();
            const finalGain = this.ctx.createGain();

            finalOsc.type = 'triangle';
            finalOsc.frequency.setValueAtTime(220, time + 3);
            finalOsc.frequency.exponentialRampToValueAtTime(55, time + 4);

            finalGain.gain.setValueAtTime(0.1, time + 3);
            finalGain.gain.exponentialRampToValueAtTime(0.01, time + 4);

            finalOsc.connect(finalGain);
            finalGain.connect(this.musicGain);

            finalOsc.start(time + 3);
            finalOsc.stop(time + 4);
        }

        // ═════════════════════════════════════════
        // SYNTH HELPER FUNCTIONS
        // ═════════════════════════════════════════

        _playBass(freq, length, vol, filterFreq, time) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playDistortedBass(freq, length, vol, filterFreq, time) {
            const osc = this.ctx.createOscillator();
            const distortion = this.ctx.createWaveShaper();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            // Create distortion curve
            const curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = (i / 128) - 1;
                curve[i] = Math.tanh(x * 3);
            }
            distortion.curve = curve;

            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playCompressedBass(freq, length, vol, time) {
            const osc = this.ctx.createOscillator();
            const compressor = this.ctx.createDynamicsCompressor();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            compressor.threshold.value = -20;
            compressor.knee.value = 10;
            compressor.ratio.value = 8;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(compressor);
            compressor.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playLead(freq, length, vol, filterFreq, time) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playPad(freq, length, vol, filterFreq, time) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // LFO for slight movement
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 0.1;
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(time);
            lfo.stop(time + length);

            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.linearRampToValueAtTime(vol * 0.7, time + length * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playPiano(freq, length, vol, filterFreq, time) {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;

            // Piano envelope: quick attack, natural decay
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(vol * 0.5, time + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playKick(time) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.15);
        }

        _playHeavyKick(time) {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(50, time);
            osc2.frequency.exponentialRampToValueAtTime(20, time + 0.1);

            gain.gain.setValueAtTime(0.6, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.18);
            osc2.start(time);
            osc2.stop(time + 0.18);
        }

        _playSnare(time) {
            // White noise via oscillator modulation
            const osc = this.ctx.createOscillator();
            const noise = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, time);

            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(800, time);

            filter.type = 'highpass';
            filter.frequency.value = 1000;

            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            osc.connect(gain);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.1);
            noise.start(time);
            noise.stop(time + 0.1);
        }

        _playHeavySnare(time) {
            // White noise burst
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            noise.start(time);
            noise.stop(time + 0.15);

            // Add tonal component
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, time);

            const oscGain = this.ctx.createGain();
            oscGain.gain.setValueAtTime(0.3, time);
            oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

            osc.connect(oscGain);
            oscGain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.1);
        }

        _playReverseCymbal(time) {
            // High frequency sweep with reverb tail
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(8000, time);
            osc.frequency.exponentialRampToValueAtTime(2000, time + 0.3);

            gain.gain.setValueAtTime(0.01, time);
            gain.gain.linearRampToValueAtTime(0.08, time + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.5);
        }

        _playHeartbeat(time) {
            // Low frequency thump
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = 60;

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.2);

            // Second beat slightly later
            setTimeout(() => {
                if (!this.isInitialized) return;
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();

                osc2.type = 'sine';
                osc2.frequency.value = 55;

                gain2.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

                osc2.connect(gain2);
                gain2.connect(this.musicGain);

                osc2.start(this.ctx.currentTime);
                osc2.stop(this.ctx.currentTime + 0.15);
            }, 200);
        }

        _playAlarmSynth(freq, length, vol, time) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + length);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + length);
        }

        _playStatic(time) {
            const bufferSize = this.ctx.sampleRate * 0.05;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

            noise.connect(gain);
            gain.connect(this.musicGain);

            noise.start(time);
        }

        _playWaterDrop(time) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, time);
            osc.frequency.exponentialRampToValueAtTime(400, time + 0.3);

            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + 0.4);
        }

        // ═════════════════════════════════════════
        // SFX IMPLEMENTATIONS
        // ═════════════════════════════════════════

        _sfxTone(freq, type, duration, vol) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(vol * this._sfxVolume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        }

        _sfxPowerupSpawn(volMult = 1) {
            // Ascending chime
            this._sfxTone(880, 'sine', 0.1, 0.12 * volMult);
            setTimeout(() => this._sfxTone(1320, 'sine', 0.15, 0.1 * volMult), 50);
        }

        _sfxMercyActivate(volMult = 1) {
            // Heartbeat pulse (two beats)
            const playBeat = (delay) => {
                setTimeout(() => {
                    this._sfxTone(60, 'sine', 0.15, 0.2 * volMult);
                    this._sfxTone(80, 'sine', 0.1, 0.15 * volMult);
                }, delay);
            };
            playBeat(0);
            playBeat(150);
        }

        _sfxAchievementUnlock(volMult = 1) {
            // Triumphant multi-voice arpeggio
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this._sfxTone(freq, 'square', 0.3, 0.1 * volMult);
                }, i * 100);
            });
            // Final chord
            setTimeout(() => {
                this._sfxTone(261.63, 'sawtooth', 0.5, 0.08 * volMult);
                this._sfxTone(329.63, 'sawtooth', 0.5, 0.08 * volMult);
                this._sfxTone(392, 'sawtooth', 0.5, 0.08 * volMult);
            }, 450);
        }

        _sfxWaveComplete(volMult = 1) {
            // Ascending three-tone announcement
            this._sfxTone(200, 'square', 0.15, 0.15 * volMult);
            setTimeout(() => this._sfxTone(300, 'square', 0.15, 0.15 * volMult), 100);
            setTimeout(() => this._sfxTone(400, 'square', 0.2, 0.2 * volMult), 200);
        }

        _sfxModeTransition(volMult = 1) {
            // Swoosh effect
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.1 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.3);
        }

        _sfxButtonHover(volMult = 1) {
            // Subtle blip
            this._sfxTone(1800, 'square', 0.05, 0.03 * volMult);
        }

        _sfxCharacterUnlockCascade(volMult = 1) {
            // Multi-note cascade sequence
            const notes = [440, 554.37, 659.25, 880, 1108.73];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this._sfxTone(freq, 'square', 0.2, 0.08 * volMult);
                }, i * 80);
            });
        }

        _sfxEasterEggDiscovered(volMult = 1) {
            // Mysterious chord
            const freqs = [220, 277.18, 329.63, 440];
            freqs.forEach(freq => {
                this._sfxTone(freq, 'sine', 0.8, 0.06 * volMult);
            });
        }

        _sfxRewind(volMult = 1) {
            // Reverse sweep with static (880→220Hz, 500ms)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.15 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.5);

            // Add static
            const bufferSize = this.ctx.sampleRate * 0.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / bufferSize);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.05 * volMult, this.ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

            noise.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(this.ctx.currentTime);
        }

        _sfxSlowmoActivate(volMult = 1) {
            // Doppler whoosh (200→800→200Hz, 300ms)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.15);
            osc.frequency.linearRampToValueAtTime(200, now + 0.3);

            gain.gain.setValueAtTime(0.1 * volMult, now);
            gain.gain.linearRampToValueAtTime(0.15 * volMult, now + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.3);
        }

        _sfxFastforwardActivate(volMult = 1) {
            // Speed-up sweep
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

            gain.gain.setValueAtTime(0.1 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.3);
        }

        _sfxPulseActivate(volMult = 1) {
            // Instant ping
            this._sfxTone(880, 'sine', 0.1, 0.15 * volMult);
            setTimeout(() => this._sfxTone(1760, 'sine', 0.15, 0.12 * volMult), 30);
        }

        _sfxNexusHum(volMult = 1) {
            // Low 60Hz drone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = 60;

            gain.gain.setValueAtTime(0.08 * volMult, this.ctx.currentTime);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            // Note: This is a continuous sound, call stopSFX('nexus_hum') to stop
        }

        _sfxSentinelSpawn(volMult = 1) {
            // Digital chirp (200→400Hz triangle, 100ms)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.12 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.1);
        }

        _sfxSentinelDeath(volMult = 1) {
            // Noise burst crunch (150ms)
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start(this.ctx.currentTime);
            noise.stop(this.ctx.currentTime + 0.15);
        }

        _sfxChronoCollect(volMult = 1) {
            // Chime (440→880Hz sine, 200ms)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.12 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.25);
        }

        _sfxFoodSpawn(volMult = 1) {
            // Subtle spawn sound
            this._sfxTone(600, 'sine', 0.08, 0.05 * volMult);
        }

        // Legacy SFX wrappers
        _sfxEat(volMult = 1) {
            this._sfxTone(800, 'square', 0.1, 0.1 * volMult);
            setTimeout(() => this._sfxTone(1200, 'square', 0.15, 0.1 * volMult), 50);
        }

        _sfxDeath(volMult = 1) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 1);

            gain.gain.setValueAtTime(0.3 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 1);
        }

        _sfxUnlock(volMult = 1) {
            // Triumphant arpeggio
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this._sfxTone(freq, 'square', 0.3, 0.1 * volMult);
                }, i * 100);
            });
        }

        _sfxPowerup(volMult = 1) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.15 * volMult, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.2);
        }
    }

    // Initialize global instance
    window.serpentineAudio = new SerpentineAudio();

    console.log('[Audio] SerpentineAudio loaded - Session 21 Audio Expansion');
})();