# Project Architecture

---

## Overview

Interactive Periodic Table is a client-side web application for exploring element properties, electron configurations, state changes across temperature variations, and visual element categories. It allows users to search, filter by category, visualize heatmaps, and inspect Bohr electron shell models for all 118 chemical elements.

---

## Purpose & Goals

- Provide an intuitive, interactive periodic table interface with instant search and filtering capabilities.
- Demonstrate real-time state-of-matter calculation across a wide temperature slider (-273°C to 5727°C).
- Render visual representations of Bohr electron orbital configurations using the HTML5 Canvas API.
- Maintain a zero-dependency, self-contained architecture using vanilla HTML, CSS, and JavaScript.

---

## Folder Structure

```text
projects/misc/periodic-table/
├── index.html      # Main HTML entry point, layout structure, control panel, modal markup
├── style.css       # Visual styles, CSS Grid periodic layout, theme tokens, category colors
├── elements.js     # Comprehensive dataset of all 118 chemical elements
├── script.js       # Table grid rendering, filter handlers, modal interaction, canvas Bohr model
├── README.md       # Project overview and usage guidelines
└── ARCHITECTURE.md # Project architecture documentation
```

---

## System / Project Architecture Overview

The application is structured into three main layers:
1. **Data Layer (`elements.js`)**: Static array of element objects containing physical constants, atomic numbers, electron shell configurations, and summaries.
2. **Presentation Layer (`index.html`, `style.css`)**: Responsive 18-column grid layout with CSS custom properties for category color coding and glassmorphism styling.
3. **Logic Layer (`script.js`)**: Handles filtering, search indexing, temperature state evaluation, view mode switching, and HTML5 Canvas drawing.

```
User Action (Search / Slider / Filter / Tile Click)
                      ↓
          Event Listeners (script.js)
                      ↓
  State Engine (Temperature / Filter Query / View Mode)
                      ↓
     DOM Re-render & HTML5 Canvas Draw (Bohr Model)
```

---

## Component Breakdown

| File | Responsibility |
|---|---|
| `index.html` | Page markup, search input, view mode buttons, temperature slider, table container, detail modal |
| `style.css` | 18-column CSS grid layout, category color variables, element tile micro-animations, modal styles |
| `elements.js` | Full dataset of 118 elements with atomic properties, melting/boiling points, and shell arrays |
| `script.js` | Grid rendering logic, state-of-matter calculator, search & category filters, canvas Bohr model renderer |

---

## Data Flow / Execution Flow

```
User opens index.html
        ↓
Browser loads style.css → elements.js → script.js
        ↓
Initialization: category pills rendered, temperature set to 298K
        ↓
Table Grid generated dynamically matching 18 groups and 7 periods + f-block
        ↓
User interacts (types search term, adjusts temperature slider, or clicks category pill)
        ↓
Filter logic evaluates matching elements & updates tile dimming / state indicator dots
        ↓
User clicks an element tile → Modal opens → HTML5 Canvas draws Bohr model for element shells
```

---

## Key Features

- **18-Column Grid Layout**: Accurately positions elements 1-118 into periods 1-7 and separate Lanthanide/Actinide rows.
- **Instant Multi-attribute Search**: Filters by element name, symbol, atomic number, and category keyword.
- **Dynamic Temperature Engine**: Real-time evaluation of element phase (Solid, Liquid, Gas, Synthetic) across 0K–6000K range.
- **View Heatmaps**: Electronegativity heatmap and Atomic Mass gradient visualization modes.
- **HTML5 Canvas Bohr Model**: Generates concentric electron orbit diagrams with animated shell placement.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Semantic layout, range slider, modal structures, and `<canvas>` element |
| CSS3 | 18-column CSS Grid, Flexbox, custom property design tokens |
| Vanilla JavaScript | Dynamic DOM manipulation, array filtering, canvas rendering |

---

## File Responsibilities

### `elements.js`
- Exports `ELEMENTS` array containing 118 element records.
- Exports `CATEGORY_NAMES` mapping category keys to human-readable strings.

### `script.js`
- `renderTable()`: Generates tile elements and positions them into grid cells.
- `getElementState(elem, tempK)`: Determines element state at given Kelvin temperature.
- `applyFilters()`: Toggles `.dimmed` and `.highlighted` CSS classes based on active search and category filters.
- `drawBohrModel(shells, symbol)`: Clears canvas and draws atomic nucleus and orbital shells with electron dots.

---

## Design Decisions

- **CSS Grid for 18 Groups**: Used `grid-column` and `grid-row` matching standard IUPAC group numbers to place elements without needing empty placeholder elements.
- **HTML5 Canvas for Bohr Models**: Rendered dynamically via canvas rather than inline SVGs to maintain performance and smooth rendering.
- **Zero Build Step**: Ensured full compatibility with standard browser execution via simple script tags.

---

## Dependencies

None. Uses native browser APIs exclusively.

---

## Future Improvements

- Add 3D crystal structure viewer using Three.js.
- Add element isotope breakdown and radioisotope decay chain viewer.
- Add compound builder / reaction calculator.

---

## Known Limitations

- F-block elements (Lanthanides and Actinides) are rendered below the main grid to maintain desktop grid legibility.

---

## Development Notes

- Serve through a local HTTP server (`python -m http.server`) for standard browser testing.
