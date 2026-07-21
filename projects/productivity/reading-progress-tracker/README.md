# Reading Progress Tracker

A browser-based reading tracker that helps you monitor books, log reading sessions, visualize progress, and estimate completion dates — all stored locally in your browser.

## Features

- **Book Library** — Add books with title, author, total pages, genre, and status
- **Progress Tracking** — Visual progress bar per book with current page and percentage
- **Reading Sessions** — Log each reading session with start/end page and duration
- **Estimated Completion** — Calculates finish date based on your reading velocity
- **Statistics Dashboard** — Total books, completed count, pages read, hours spent, current streak
- **Analytics** — Monthly pages chart, genre breakdown, reading speed and completion rate
- **Export / Import** — Save and restore your data as JSON
- **Reading Streak** — Tracks consecutive days with a reading session

## How to Use

1. Click **Add Book** to add a book with its total page count
2. Use **Log Session** (or the 📝 icon on any book card) to record a reading session — set start and end page
3. Click any book card to see full details and progress history
4. Switch to the **Analytics** tab for charts and reading statistics
5. Use **Export / Import** to back up and restore your library

## Running Locally

Open `index.html` via a local server or directly in a browser. No build step or internet connection is required — all logic runs client-side and data is persisted in `localStorage`.

```bash
# Example using Python's built-in server
python3 -m http.server 8000
# Then open: http://localhost:8000/projects/productivity/reading-progress-tracker/
```

## File Structure

```
reading-progress-tracker/
├── index.html         # App shell and all modals
├── style.css          # Dark-theme styling and responsive layout
├── tracker-logic.js   # Pure business logic (UMD — also used by tests)
├── script.js          # UI wiring and localStorage persistence
├── README.md          # This file
└── ARCHITECTURE.md    # Technical architecture documentation
```

## Dependencies

None. Uses only native browser APIs — no external libraries required.
