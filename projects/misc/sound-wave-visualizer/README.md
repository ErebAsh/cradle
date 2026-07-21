# Sound Wave Visualizer

A real-time audio visualization tool that records microphone input and displays a live waveform, frequency spectrum (FFT) and scrolling spectrogram — all built with the Web Audio API and Canvas 2D.

## Features

- **Live Waveform** — Oscilloscope-style amplitude-over-time display with RMS dB readout
- **Frequency Spectrum** — Real-time FFT bar chart with peak-frequency detection
- **Spectrogram** — Scrolling time-frequency heatmap showing how sound evolves
- **Recording & Playback** — Record sessions via the microphone and replay them in the browser
- **Download** — Save recordings as WebM/OGG audio files
- **Adjustable FFT Size** — 512 / 1024 / 2048 / 4096 bins for resolution vs. performance trade-off
- **Smoothing & Gain controls** — Fine-tune the analyser's temporal smoothing and input gain
- **5 Color Themes** — Cyan, Violet, Amber, Green and Rainbow

## How to Use

1. Open the page in a browser and click **Record** — allow microphone access when prompted
2. Speak, play music, or make any sound — all three visualisations update in real time
3. Click **Stop** (or the Record button again) to end the recording
4. Use **Play** to replay the recording or **Download** to save it
5. Adjust **FFT Size**, **Smoothing**, **Gain**, and **Color Scheme** at any time

## Running Locally

This project uses `getUserMedia` which requires a secure context (HTTPS or localhost).

```bash
# Using Python's built-in server
python3 -m http.server 8000
# Then open: http://localhost:8000/projects/misc/sound-wave-visualizer/
```

> ⚠️ Do **not** open `index.html` by double-clicking — the `file://` protocol blocks microphone access.

## File Structure

```
sound-wave-visualizer/
├── index.html      # App shell, canvas elements, control bar, recordings list
├── style.css       # Dark-theme styling, responsive grid, recording rows
├── script.js       # Web Audio API, canvas rendering, MediaRecorder integration
├── README.md       # This file
└── ARCHITECTURE.md # Technical architecture documentation
```

## Dependencies

None. Uses only native browser APIs:
- **Web Audio API** (`AudioContext`, `AnalyserNode`, `GainNode`)
- **MediaDevices API** (`getUserMedia`)
- **MediaRecorder API** (recording + download)
- **Canvas 2D API** (all visualisations)
