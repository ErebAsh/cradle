# Morse Code Studio Architecture Documentation

## Overview

The Morse Code Studio is a browser-based tool that converts plain text into Morse code and decodes Morse code back into text. It also plays Morse code as audio signals with an adjustable playback speed.

## System Architecture

```text
┌───────────────────────────────┐
│        User Input             │
│  Text or Morse Code           │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│      Translation Engine       │
│         (script.js)           │
└──────────────┬────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
 Encode Text      Decode Morse
      │                 │
      └────────┬────────┘
               ▼
┌───────────────────────────────┐
│        Output Display         │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   Audio Playback Generator    │
│      (Web Audio API)          │
└───────────────────────────────┘
```

## Features

- Encode text into Morse code
- Decode Morse code into text
- Play Morse code as audio
- Adjustable playback speed
- Copy output
- Clear and swap input/output

## Project Structure

```text
projects/misc/morse-code-studio/
├── ARCHITECTURE.md    # Project documentation
├── index.html         # User interface
├── script.js          # Translation and audio logic
└── style.css          # Styling
```

## Technologies Used

- HTML
- CSS
- JavaScript
- Web Audio API

## Future Improvements

- Download Morse audio as WAV
- Flash visual signals while playing
- Support additional symbols
- Export translations as text files