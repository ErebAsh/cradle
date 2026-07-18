# Architecture: Random Meme Generator

## Project Overview

**Purpose:** A browser-based app that fetches and displays random memes from a public API.

**Main Functionality:**
- Loads a random meme image automatically on page load.
- Lets the user fetch a new random meme by clicking the "Load New" button.
- Shows an animated, interactive button with a rotating gradient effect tied to mouse position.

**Brief Description:**
The Random Meme Generator is a lightweight single-page application with no build step or framework. It makes asynchronous HTTP requests to the public [meme-api.com](https://meme-api.com) REST API and renders the result directly in the browser.

---

## Folder Structure

```
projects/misc/meme-generator/
├── index.html        # App shell and markup
├── script.js         # API calls, DOM interactions, and event handling
└── style.css         # Layout, theming, and button animation styles
```

The project also uses a shared utility from the parent `projects/` directory:

```
projects/
└── back-to-home.js   # Shared script that injects a "Back to Home" navigation button
```

---

## Architecture Overview

| File | Responsibility |
|---|---|
| `index.html` | Defines the page structure: a heading, the meme `<img>` element, and the "Load New" button. Loads Google Fonts, `style.css`, the shared `back-to-home.js`, and `script.js`. |
| `script.js` | Contains all application logic — fetching meme data from the API, updating the DOM with the result, and managing button event listeners. |
| `style.css` | Handles the full visual design: dark blue background, centered layout, yellow-bordered meme image, and the animated gradient button using a CSS custom property. |
| `back-to-home.js` | A shared, self-contained IIFE used across all Cradle mini projects. Dynamically appends a fixed "Back to Home" anchor element to the page when the user is inside a project route. |

---

## Application Flow

1. **Page Load**
   - The browser parses `index.html` and applies `style.css`.
   - Google Fonts (`Playfair Display` and `Poppins`) are loaded via a `<link>` tag in the HTML head.
   - `back-to-home.js` is loaded with the `defer` attribute — it runs after HTML parsing is complete, checks the current URL path, and if inside a project route, injects the "Back to Home" button into the DOM.
   - `script.js` executes synchronously after the DOM is ready. The `meme` and `loadBtn` DOM elements are selected.
   - `fetchAPI()` is called directly at the bottom of the script, triggering an API request so a meme is visible immediately without the user needing to click anything.

2. **Fetching a Meme**
   - `fetchAPI()` sends a `GET` request to `https://meme-api.com/gimme`.
   - On success, the JSON response's `url` field is assigned to `meme.src`, and `data.title` (falling back to `"Random Meme"` if absent) is assigned to `meme.alt`.
   - On failure, an error is logged to the console and an `alert` is shown to the user.

3. **User Interaction**
   - Clicking the "Load New" button triggers another `fetchAPI()` call, replacing the current meme.
   - Moving the mouse horizontally over the button updates the `--x` CSS custom property, which rotates the gradient angle on the button border, creating a dynamic colour-shift effect.

---

## UI Components

### Page Wrapper (`#root`)
A vertically stacked flex container centred on the page. Holds the heading, meme image, and button with a consistent `20px` gap between elements. Constrained to a `max-width` of `500px`.

### Heading (`h2`)
A white text label reading "Random Meme Generator" positioned at the top of the layout.

### Meme Image (`#meme`)
A responsive `<img>` element with `max-width: 450px`. Its `src` and `alt` are set dynamically by `script.js`. Styled with a `10px` solid yellow (`#fbd208`) border, `30px` rounded corners, and a drop shadow.

### Load New Button (`#loadBtn`)
A custom-styled `<button>` (`150px × 55px`) built from three child elements:
- Two `<i>` elements acting as layered gradient borders — the first renders the sharp gradient, the second is identical but blurred (`filter: blur(12px)`) to produce a glow effect. The gradient colour direction is driven by `var(--x)`.
- A `<span>` child that renders the label "Load New" (displayed as `LOAD NEW` via `text-transform: uppercase` in CSS) over a semi-transparent dark overlay, with a glass-sheen `::before` highlight stripe.

### Back to Home Button (injected by `back-to-home.js`)
A fixed-position pill button in the bottom-right corner. Rendered only when the current URL path is inside `/projects/`. Navigates back to `../../../index.html`.

---

## JavaScript Architecture

### Initialization
```js
const meme = document.getElementById("meme");
const loadBtn = document.getElementById("loadBtn");
```
Both DOM references are stored at the top of the script. `fetchAPI()` is called once immediately at the bottom of the script to populate the meme on load.

### Event Listeners

| Event | Element | Action |
|---|---|---|
| `click` | `#loadBtn` | Calls `fetchAPI()` to load a new meme |
| `mousemove` | `#loadBtn` | Reads cursor X position relative to the button, multiplies the offset by `3` to derive a degree value, then sets the `--x` CSS variable |

### Main Functions

#### `fetchAPI()`
```js
async function fetchAPI() { ... }
```
- Uses the native Fetch API with `async/await`.
- Sends a `GET` request to `https://meme-api.com/gimme`.
- Checks `response.ok`; throws an `Error` if the request was not successful.
- On success: sets `meme.src = data.url` and `meme.alt = data.title || "Random Meme"`.
- On failure: logs to `console.error` and shows an `alert("Failed to load meme. Please try again.")`.

### DOM Interactions
- `meme.src` and `meme.alt` are written directly after a successful API response.
- `document.documentElement.style.setProperty("--x", `${angle}deg`)` updates the root CSS variable on every `mousemove` event to drive the button gradient animation.

### State Handling
There is no explicit application state object. The only transient state is:
- The currently displayed meme image (held implicitly in the `<img>` element's `src` and `alt` attributes).
- The `--x` CSS custom property (updated on each `mousemove` event over the button).

---

## Data Flow

```
User opens page
      │
      ▼
fetchAPI() called automatically
      │
      ▼
GET https://meme-api.com/gimme
      │
      ├─ Success → Parse JSON → meme.src = data.url
      │                       → meme.alt = data.title || "Random Meme"
      │                       → Image renders in the browser
      │
      └─ Failure → console.error(error)
                 → alert("Failed to load meme. Please try again.")

User clicks "Load New" button
      │
      ▼
fetchAPI() called again → same fetch flow above

User moves mouse over button
      │
      ▼
mousemove handler fires
      │
      ▼
angle = (event.clientX - rect.left) * 3
      │
      ▼
document.documentElement.style.setProperty("--x", `${angle}deg`)
      │
      ▼
CSS gradient on button rotates in real time
```

---

## Styling

`style.css` is a single flat stylesheet with no preprocessor. It is organized as follows:

- **Google Font imports** — three `@import` rules at the top for `Plus Jakarta Sans`, `Archivo Narrow`, and `Work Sans`. (`Playfair Display` and `Poppins` are additionally loaded via a `<link>` tag in `index.html`.)
- **CSS Custom Property** — `--x: 45deg` declared on `:root` as the initial gradient angle for the button; updated dynamically by JavaScript on mouse movement.
- **Reset** — `*` selector zeroes `margin` and `padding`, and sets `box-sizing: border-box`.
- **Body** — Full-viewport flexbox layout centred both axes, deep blue (`#1229a0`) background, `20px` padding.
- **`#root`** — Vertical flex column, centred, `max-width: 500px`, `gap: 20px`.
- **`#meme`** — Responsive image, `max-width: 450px`, yellow (`#fbd208`) border, `border-radius: 30px`, and a box shadow.
- **`#loadBtn`** — Transparent `150px × 55px` button. Two `<i>` children act as gradient border layers using `inset: -2px` positioning. The second `<i>` is blurred for a glow. The `<span>` label sits on top with `inset: 1px` and a glass-like highlight via `::before`.
- **Media query** — At `max-width: 500px`: reduced body padding, top-aligned `#root`, and `#meme` constrained to `max-width: 340px`.

---

## Assets

This project does not use any local image, icon, audio, or font files. All assets are loaded remotely:

- **Meme images** — fetched at runtime from `https://meme-api.com/gimme` (external REST API).
- **Fonts** — loaded from Google Fonts CDN. `Playfair Display` and `Poppins` via `<link>` in `index.html`; `Plus Jakarta Sans`, `Archivo Narrow`, and `Work Sans` via `@import` in `style.css`.

---

## External Dependencies

| Dependency | Type | How it's used |
|---|---|---|
| [meme-api.com](https://meme-api.com) | REST API | Provides random meme image URLs and titles via `GET /gimme` |
| Google Fonts | CDN stylesheet | Loads `Playfair Display` and `Poppins` (HTML `<link>`) and `Plus Jakarta Sans`, `Archivo Narrow`, `Work Sans` (CSS `@import`) |

No npm packages, bundlers, or frameworks are used. The project runs entirely in the browser with vanilla HTML, CSS, and JavaScript.

---

## Summary

The Random Meme Generator is a minimal, framework-free single-page app. Its architecture is intentionally simple: one HTML shell, one CSS file for layout and animation, and one JavaScript file containing two event listeners and a single async function. On load, `fetchAPI()` immediately calls the public meme-api.com REST endpoint, parses the JSON response, and sets the image `src` and `alt` directly on the DOM element. The "Load New" button repeats this cycle on demand. The only other interaction is the mouse-tracking gradient effect on the button — achieved by computing an angle from the cursor's horizontal offset within the button, multiplying it by `3`, and writing it as the `--x` CSS custom property on the root element — keeping all logic minimal with no external animation libraries.
