## Overview

Sound Wave Visualizer records microphone input using the Web Audio API and renders a live waveform, frequency spectrum and scrolling spectrogram via Canvas 2D. Recordings can be replayed in the browser or downloaded as audio files. It runs entirely in the browser with no server or dependencies.

---

## Purpose & Goals

- Demonstrate real-time audio processing using the Web Audio API's `AnalyserNode`
- Provide three complementary visualisation modes (waveform, spectrum, spectrogram) in one interface
- Allow users to record, replay and download microphone audio without any server infrastructure
- Keep the codebase self-contained so contributors can understand it in a single session

---

## Folder Structure

```
sound-wave-visualizer/
├── index.html      # App shell, canvas elements, controls, recordings list
├── style.css       # Full dark-theme styling and responsive layout
├── script.js       # All logic: audio graph, canvas rendering, recording, playback
├── README.md       # User-facing documentation
└── ARCHITECTURE.md # This file
```

---

## System / Project Architecture Overview

The project has a single-file JavaScript architecture centred on the Web Audio API graph:

```mermaid
graph TD
    MIC[Microphone getUserMedia] --> SRC[MediaStreamSource]
    SRC --> GAIN[GainNode]
    GAIN --> AN[AnalyserNode]
    AN --> DEST[AudioContext Destination]
    AN -->|getByteTimeDomainData| WV[Waveform Canvas]
    AN -->|getByteFrequencyData| SP[Spectrum Canvas]
    AN -->|getByteFrequencyData| SG[Spectrogram Canvas]
    MIC --> MR[MediaRecorder]
    MR --> BLOB[Blob / ObjectURL]
    BLOB --> PB[Audio Playback]
    BLOB --> DL[Download]
```

- **Audio graph** is assembled once on first record; `GainNode` and `AnalyserNode` settings are updated live from the UI controls.
- **Animation loop** (`requestAnimationFrame`) reads `Uint8Array` buffers from the `AnalyserNode` and repaints all three canvases 60 fps.
- **MediaRecorder** runs in parallel, collecting audio chunks into a `Blob` for download or in-browser playback.

---

## Component Breakdown

| File | Responsibility |
|---|---|
| `index.html` | App structure: header, control bar, settings row, three canvas panels, recordings list |
| `style.css` | Design tokens, button styles, visualiser grid (2-col), recording rows, status pill animations |
| `script.js` | Audio graph, waveform / spectrum / spectrogram draw functions, MediaRecorder, playback, timer, event wiring |

---

## Data Flow / Execution Flow

```
User opens index.html
        ↓
Browser loads style.css → script.js
        ↓
init() — canvases sized, idle placeholder drawn, status = "Ready"
        ↓
User clicks Record
        ↓
getUserMedia() → MediaStreamSource → GainNode → AnalyserNode
MediaRecorder.start() begins collecting audio chunks
        ↓
requestAnimationFrame loop fires every frame (~16ms)
        ↓
getByteTimeDomainData → drawWaveform()
getByteFrequencyData  → drawSpectrum()
getByteFrequencyData  → drawSpectrogram() (scrolling left by 1px each frame)
        ↓
User clicks Stop
        ↓
MediaRecorder.stop() → ondataavailable → Blob → ObjectURL
Recording entry pushed to `recordings` array → renderRecordings()
        ↓
User clicks Play / Download on a recording row
```

---

## Key Features

- Live waveform (oscilloscope) with RMS dB level meter
- FFT frequency spectrum with per-bar colour gradient and peak-frequency detection
- Scrolling spectrogram — each frame a 1-pixel column is drawn from bottom (low freq) to top (high freq), coloured by magnitude
- Adjustable FFT size (512–4096), temporal smoothing (0–0.99) and input gain (1–10×)
- 5 colour themes including a full rainbow HSL gradient mode
- Recording session list with per-entry Play/Pause, Download and Delete controls
- Status pill with animated dot (recording pulse, playing pulse)
- Responsive two-column canvas grid (collapses to single column on mobile)

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 Canvas 2D | Rendering waveform, spectrum bars and spectrogram pixels |
| Web Audio API | `AudioContext`, `AnalyserNode`, `GainNode`, `MediaStreamSource` |
| MediaDevices API | `getUserMedia` for microphone capture |
| MediaRecorder API | Capturing audio data for download and playback |
| CSS3 (Grid, Custom Properties, Animations) | Layout, theming and status-dot pulse animations |
| Vanilla JavaScript (ES6+) | All logic; no dependencies |
| Google Fonts (Outfit, JetBrains Mono) | Typography |

---

## File Responsibilities

### `script.js`

- `initAudio()` — Creates `AudioContext`, `AnalyserNode`, `GainNode`, wires graph
- `startRecording()` / `stopRecording()` — `getUserMedia` + `MediaRecorder` lifecycle
- `finalizeRecording()` — Assembles `Blob` from chunks, creates `ObjectURL`, pushes to `recordings`
- `drawWaveform(data)` — Oscilloscope with RMS dB using `getByteTimeDomainData`
- `drawSpectrum(data, bufferLength)` — FFT bar chart with magnitude-to-colour gradient
- `drawSpectrogram(data, bufferLength)` — Shifts canvas image left by 1 px, draws new column
- `playRecording(id)` / `stopPlayback()` / `togglePlayback(id)` — `Audio` element playback
- `renderRecordings()` — Generates HTML list of recording rows with event listeners
- `resizeCanvases()` — Responsive canvas sizing via `ResizeObserver`
- `hslToRgb()`, `blendColors()`, `lerp()` — Colour math utilities

### `style.css`

- `.status-dot.recording` — CSS `pulse-red` animation for live recording indicator
- `.vis-panel.wide` — spans full two-column grid width (spectrogram)
- `.bar-column` — FFT bars; coloured by JS via `fillStyle` per-draw
- `@keyframes pulse-red` / `pulse-green` — status dot glow animations

---

## Design Decisions

- **Shared `AnalyserNode` for all three visualisations** — A single `getByteTimeDomainData` and `getByteFrequencyData` call per frame feeds all canvases, avoiding redundant reads.
- **Spectrogram as image-shift** — Using `getImageData` / `putImageData` to shift the spectrogram canvas left by 1 pixel is the canonical, efficient approach for scrolling spectrograms without clearing the whole canvas each frame.
- **`MediaRecorder` runs alongside the audio graph** — Decoupled from `AnalyserNode`; the `MediaStream` is split into two branches: one for analysis, one for recording.
- **No external visualisation library** — Raw Canvas 2D keeps the project dependency-free and makes the rendering logic fully transparent to contributors.
- **`ResizeObserver` instead of `window.resize`** — More accurate for responsive canvas sizing when the parent container changes width due to layout shifts.

---

## Dependencies

None. This project uses only native browser APIs — no external libraries are required.

---

## Future Improvements

- Beat / BPM detection using onset detection on the frequency data
- Note detection overlay using pitch detection (autocorrelation or YIN algorithm)
- Save spectrogram as a PNG screenshot
- Custom frequency-band highlighting (e.g. bass, mid, treble zones)
- Noise gate / threshold-triggered recording to skip silence

---

## Known Limitations

- Requires HTTPS or `localhost` — `getUserMedia` is blocked on insecure origins
- Recording format depends on browser support; typically WebM/Opus in Chromium, OGG in Firefox
- All recordings are in-memory only — refreshing the page clears them
- Spectrogram resolution is tied to canvas pixel width; very narrow viewports reduce time fidelity
- No audio processing (noise reduction, echo cancellation) is applied beyond the browser's default

---

## Development Notes

- Open `index.html` via `python3 -m http.server 8000` or any local server — not by double-clicking, as `file://` blocks `getUserMedia`.
- No build step required. Edit files and refresh the browser.
- On Chromium, inspect the audio graph in `chrome://webrtc-internals` or DevTools → Media panel.

---

## References

- [MDN Web Docs — Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MDN Web Docs — AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)
- [MDN Web Docs — MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MDN Web Docs — getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
