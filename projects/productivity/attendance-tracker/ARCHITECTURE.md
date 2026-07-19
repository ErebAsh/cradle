# Architecture Blueprint: Attendance Tracker

## 📌 Overview
The Attendance Tracker is a lightweight, client-side mini-application designed to help students or professionals log, calculate, and monitor their attendance percentages. It provides a visual indicator of whether they meet minimum attendance thresholds without requiring a database backend.

---

## 🏗️ Core Architecture & Flow
The application uses a standard decoupled **Frontend-First Architecture** where state is entirely handled in the user's browser runtime.
[ UI Dashboard ] ──(User Input)──> [ State & Calculation Logic ]
│                                     │
└────────(Auto-Save)──────────────────> [ LocalStorage ]


1. **View Layer (DOM):** Renders the tracking dashboard, input forms for classes attended/total classes, and progress bars.
2. **Calculation Engine:** Processes the raw input to compute real-time attendance percentages and determines the exact number of consecutive classes needed to reach target goals.
3. **Persistence Layer:** Uses the Web Storage API (`localStorage`) to cache user data across sessions seamlessly.

---

## 📂 File Structure Map

```text
├── index.html        # Main dashboard layout and semantic structural DOM
├── script.js         # State tracking, calculation engine, and DOM event listeners
├── style.css         # Scoped UI styles, themes, and responsive layout configurations
└── ARCHITECTURE.md    # System design documentation (This file)
```

## 🛠️ Tech Stack & Dependencies
UI/Layout: Semantic HTML5 and modern CSS Variables for handling dashboard themes.

Core Logic Engine: Vanilla JavaScript (ES6+) to keep the mini-app fast and free of external package overhead.

Storage: Native Web Browser localStorage.

## 🔒 Optimization & Performance Strategies
DOM Caching: Frequently accessed DOM elements are cached at initialization to reduce layout thrashing during dynamic calculations.

Input Sanitization: Prevents edge cases (e.g., entering more attended classes than total classes) directly in the validation layer before rendering updates.