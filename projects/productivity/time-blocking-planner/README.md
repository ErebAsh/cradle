# Time Blocking Planner

A daily productivity planner for assigning time blocks to activities using an interactive 24-hour timeline schedule with drag & resize capabilities, category breakdowns, and multi-format schedule exports.

## Features

- **Interactive Timeline**: Full 24-hour schedule grid (00:00 to 24:00) with 15-minute grid snapping and live current-time indicator.
- **Drag & Resize Time Blocks**:
  - Drag blocks vertically across the timeline to reschedule tasks.
  - Drag top and bottom edge handles to shrink or expand block duration.
  - Double-click any block to open detail editor modal.
- **Preset Activity Palette**: Drag and drop preset categories (Deep Work, General Work, Meetings, Study, Exercise, Meal, Break, Personal) onto your daily schedule.
- **Category Statistics**: Real-time breakdown of total planned time per category.
- **Multi-Format Export**:
  - **iCalendar (.ics)**: Export schedule to import directly into Google Calendar, Apple Calendar, or Outlook.
  - **JSON Data**: Export and import raw schedule data for backups.
  - **Text Summary (.md)**: Generate clean Markdown agenda reports.
- **LocalStorage Persistence**: Auto-saves schedules keyed by selected date.

## Project Structure

```text
projects/productivity/time-blocking-planner/
├── index.html      # UI structure, toolbar, sidebar palette, timeline grid, modal markup
├── style.css       # Layout styles, timeline grid sizing, handle styling, color schemes
├── script.js       # Drag & drop engine, resize logic, storage persistence, iCal generator
├── README.md       # Project documentation
└── ARCHITECTURE.md # Architectural documentation
```

## How to Run Locally

1. Open `index.html` directly in any web browser, or serve via local web server:
   ```bash
   python -m http.server 8000
   ```
2. Navigate to `http://localhost:8000/projects/productivity/time-blocking-planner/` in your browser.

## Technologies Used

- **HTML5**: Form controls, native date input, file inputs, semantic elements.
- **CSS3**: Flexbox, CSS Grid, custom properties, absolute positioning calculations.
- **Vanilla JavaScript (ES6+)**: Mouse event tracking for drag/resize, iCalendar format builder, LocalStorage API.
