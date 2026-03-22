# SERPENTINE: AUDIO MANIFEST 🎵🛡️

Serpentine features a **100% Procedural Audio Engine**. Every note and sound effect is mathematically synthesized in real-time using the browser's native **Web Audio API**. No external MP3 or WAV files are ever downloaded.

---

## 🌌 Soundtrack: "THE STANDBY PROTOCOL" (Main Menu)
*A developing atmospheric drone designed for system initialization.*

- **Tempo**: 175ms per step (Approx. 85 BPM).
- **Core Loop**: 64-step sequence.
- **Phases**:
    - **Steps 0–31 (Atmospheric)**: Deep, low-pass filtered sawtooth drones (Am-F-C-G progression).
    - **Steps 32–63 (The Decryption Drop)**: Rhythmic square-wave arpeggios, a driving pulsing bassline, and a soft kicks every 4 beats.
- **Synthesis**: Multi-layer `Sawtooth` and `Square` oscillators with `LowPass` resonance filters.

---

## ⚡ Soundtrack: "NEON EXECUTION" (Gameplay)
*A high-octane 4-on-the-floor synthwave loop to drive the action.*

- **Tempo**: 150ms per step (Approx. 100 BPM).
- **Core Loop**: 256-step sequence (Approx. 38.4 seconds).
- **Phases**:
    - **Intro (Steps 0–127)**: Constant "Galloping" bassline (Root-Root-Octave pattern) and drum machines.
    - **The Breach (Steps 128–255)**: A bright, driving square-wave melody arpeggio cuts through the mix.
- **Synthesis**: Sawtooth Bass + Square Lead + White Noise (Simulated Triangle FM) Snare.

---

## 🔈 Tactical UI Sound Effects
| SOUND | TYPE | FREQUENCIES | FEEL |
| :--- | :--- | :--- | :--- |
| **System Nav** | Blip | 1800Hz (Square) | Precise, high-freq digital focus. |
| **Access Grant** | Thud | 180Hz (Saw) + 3kHz (Click) | Industrial, mechanical "Data Decryption" thud. |
| **System Back** | Swipe | 350Hz ↘ 100Hz (Saw) | Whooshing downward frequency shift. |

---

## 🐍 Game State Sound Effects
| SOUND | TYPE | FREQUENCIES | FEEL |
| :--- | :--- | :--- | :--- |
| **Byte Consumed** | Pop | 800Hz → 1200Hz (Square) | Satisfying "digital swallow" pop. |
| **System Failure** | Burst | 150Hz ↘ 10Hz (Sawtooth) | Gritty, explosive drop into silence. |
| **Protocol Unlock**| Chord | Major Arpeggio (A-C#-E-A) | Triumphant, high-energy success chord. |

---

## 🛠️ Technical Specifications
- **API**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Node Graph**: `OscillatorNode` → `BiquadFilterNode` → `GainNode` → `AudioDestination`.
- **Latency**: Sub-10ms (Native hardware acceleration).
- **Storage Cost**: 0 KB (Calculated in real-time).
