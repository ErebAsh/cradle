# Interactive Periodic Table

An interactive, responsive Periodic Table visualization tool built for exploring elements, chemical properties, electron configurations, state changes across temperature ranges, and visual category highlighting.

## Features

- **Search Elements**: Instant search filtering by element name, chemical symbol, atomic number, or element category.
- **Detailed Properties**: Click any element to view comprehensive property metadata including atomic mass, electron configuration, electronegativity, melting/boiling points, density, discovery year, and summary.
- **Visual Category Highlighting**: Interactive category filter pills highlighting Alkali Metals, Alkaline Earth Metals, Transition Metals, Metalloids, Nonmetals, Halogens, Noble Gases, Lanthanides, and Actinides.
- **Bohr Model Visualizer**: Interactive canvas rendering electron shells and electron distribution for each element.
- **Temperature Slider**: Dynamic state of matter visualization (Solid, Liquid, Gas, Synthetic) calculated in real-time as temperature changes from 0 K (-273°C) up to 6000 K (5727°C).
- **View Modes**: Switch between Standard view, Electronegativity Heatmap, and Atomic Mass Gradient views.

## Project Structure

```text
projects/misc/periodic-table/
├── index.html      # UI structure, header, controls, grid container, and modal
├── style.css       # Glassmorphism dark mode styles, category colors, grid layout
├── elements.js     # Data store containing all 118 elements metadata
├── script.js       # Grid rendering, filtering, temperature simulation, modal logic, Bohr model canvas
├── README.md       # Project documentation
└── ARCHITECTURE.md # Architectural documentation
```

## How to Run Locally

1. Open `index.html` directly in any web browser, or serve via local web server:
   ```bash
   python -m http.server 8000
   ```
2. Navigate to `http://localhost:8000/projects/misc/periodic-table/` in your browser.

## Technologies Used

- **HTML5**: Semantic elements, Range input slider, HTML5 Canvas API for Bohr electron orbit visualization.
- **CSS3**: CSS Grid (18-column periodic table layout), Custom Properties (CSS variables), Flexbox, Animations.
- **Vanilla JavaScript (ES6+)**: DOM manipulation, filter logic, canvas graphics, event handling.
