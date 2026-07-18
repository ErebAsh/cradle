# Project Architecture

## Overview

A digital implementation of Ludo, the classic board game for up to four players. The board is drawn on an HTML5 Canvas element and redrawn every frame using `requestAnimationFrame`. Tokens animate smoothly between squares, and a 3D CSS dice cube spins to show each roll result.

Each player can be set to Human or Bot. Bots roll and move automatically using a heuristic that evaluates captures, safe zones, entering the board, and progress towards the finish. Game state is automatically saved to `localStorage` so sessions can be resumed after closing the browser.

---

## Folder Structure

```
ludo-game/
├── index.html   # Page shell, canvas, side panels, modals
├── script.js    # All game logic, rendering engine, AI, save/load
└── style.css    # Layout, 3D dice, modal styling, responsive design
```

---

## Application Flow

```
User opens index.html
        ↓
script.js loads
        ↓
Check localStorage for a saved game
  ├─ Found   → show "Resume" modal
  └─ Not found → show "Game Setup" modal
        ↓
User configures player types (Human / Bot) and clicks Start
        ↓
newGame() initialises token positions
        ↓
requestAnimationFrame starts the render loop (drawBoard + drawTokens)
        ↓
Red's turn begins; if Red is a Bot, rollDice() is called automatically
        ↓
rollDice() → animates the CSS 3D dice → after 1 s sets diceValue
        ↓
checkAutoTurn():
  ├─ No valid moves → nextTurn() after 1 s
  └─ Human's turn  → player clicks a token on the canvas
  └─ Bot's turn    → executeAITurn() after 0.8 s
        ↓
executeMove(token) moves the token, handles captures, checks for victory
        ↓
animateTokenTo(token) triggers smooth interpolated movement
        ↓
If diceValue was 6 (or token finished) → same player rolls again
Otherwise → nextTurn()
        ↓
saveGame() writes state to localStorage after every move
        ↓
First player to get all 4 tokens to the centre wins
```

---

## Core Components

### `index.html`
Contains:

- A sticky top bar with the game title and a live status badge.
- A three-column layout: left side panel (controls, player list), a `<canvas id="ludoCanvas">` in the centre, and a right side panel (dashboard stats, move history).
- A **Resume modal** shown on page load if a saved game is detected.
- A **Game Setup modal** for configuring Human/Bot for each player before starting.

### `script.js`
Implements everything: the rendering engine, game rules, AI, and persistence.

**Rendering engine**

- `drawBoard()` — draws the full board each frame: home quadrants with linear gradients, the global track, safe zone stars, victory path lanes with opacity gradients, and four coloured centre triangles. Uses the Canvas 2D API exclusively.
- `drawTokens()` — draws each non-finished token with a radial gradient fill, specular highlight, drop shadow, and a glow effect when the token is hovered and movable.
- `renderLoop()` — called via `requestAnimationFrame` every frame; calls `drawBoard()` then `drawTokens()`.
- `animateTokenTo(token)` — sets `startX/Y`, `targetX/Y`, and resets `animProgress` to 0. The render loop interpolates position using an ease-in-out curve until `animProgress` reaches 1.

**Board geometry**

| Constant | Purpose |
|---|---|
| `GLOBAL_TRACK` | Array of 52 `[row, col]` coordinates defining the shared looping track |
| `VICTORY_PATHS` | Per-colour arrays of 5 cells leading into the centre |
| `HOME_CENTERS` | Per-colour 2×2 grid of home slot positions |
| `START_INDEX` | The global track index where each colour enters the board |
| `SAFE_ZONES` | Eight track positions where tokens cannot be captured |

**Game logic**

- `isValidMove(token)` — checks whether the current dice value can legally move a token (must roll 6 to leave home, cannot overshoot the centre).
- `calculateDistanceToHome(token)` — counts how many steps a token needs to reach its victory path entry square.
- `executeMove(token)` — updates the token's position, transitions to the victory path when appropriate, handles captures, grants an extra turn on a 6 or when finishing, and calls `checkWinner()`.
- `handleCaptures(movedToken)` — sends any opponent token on the same non-safe square back to its home position.
- `nextTurn()` — advances `currentPlayerIndex`, clears `diceValue`, updates the UI, and triggers the next bot roll if needed.

**AI**

- `executeAITurn(validMoves)` — evaluates each valid move using `evaluateMove()` and executes the highest-scoring one.
- `evaluateMove(token)` — assigns a score based on: leaving home (+50), entering the victory path (+50), reaching a safe zone (+50), finishing (+50), and capturing an opponent (+100). Tie-breaks are random.

**Persistence**

- `saveGame()` — serialises `state`, `history`, `currentPlayerIndex`, `diceValue`, and `playerTypes` to `localStorage` as JSON under `'ludoSave'`.
- `loadGame(saveData)` — restores all variables, resets animation state to the correct positions, and resumes the correct turn.

### `style.css`
Handles layout (three-column flexbox), the 3D CSS dice (`transform-style: preserve-3d`, one face per `div`), the two modal overlays, player list highlighting, move history scroll, and responsive collapse to a single-column layout on smaller screens. Uses the `Outfit` font (loaded from Google Fonts).

---

## State Management

Token state is stored in a plain object keyed by colour:

```js
state = {
  red:    Token[],   // 4 tokens per player
  green:  Token[],
  blue:   Token[],
  yellow: Token[]
}
```

Each token:

```js
{
  id: number,            // 0–3 within its colour
  color: string,         // 'red' | 'green' | 'blue' | 'yellow'
  position: number,      // -1 = home; 0–51 = global track index; 0–4 = victory path index
  isVictoryPath: boolean,// true once the token enters its colour lane
  finished: boolean,     // true when the token reaches the centre
  // Animation
  currentX: number,      // Pixel position (interpolated each frame)
  currentY: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  animProgress: number,  // 0 = start, 1 = arrived
  zOffset: number        // Used for the arc/jump effect during animation
}
```

Additional top-level variables: `currentPlayerIndex`, `diceValue`, `isRolling`, `history` (array of strings), `gameOver`, `hoveredToken`, `playerTypes`.

The full state is serialised to `localStorage` after every move.

---

## Event Flow

```
User clicks "Roll Dice" button (Human player only)
        ↓
rollDice()
  ├─ CSS dice animation plays for 1 s
  └─ diceValue = random 1–6
        ↓
checkAutoTurn()
  ├─ No valid moves → nextTurn() after 1 s
  └─ Bot's turn → executeAITurn() after 0.8 s
  └─ Human's turn → wait for canvas click

User clicks a token on the canvas
        ↓
canvas 'click' event → checks hoveredToken via mousemove distance
        ↓
isValidMove(hoveredToken) → true
        ↓
executeMove(token)
  ├─ Update token.position / token.isVictoryPath / token.finished
  ├─ handleCaptures() → send captured opponents home
  ├─ animateTokenTo() → set animation targets
  ├─ checkWinner() → if all 4 tokens finished → gameOver = true
  └─ if not 6 and not finished → nextTurn() after 600 ms
        ↓
saveGame() → writes to localStorage
        ↓
Render loop continues drawing interpolated positions each frame
```

---

## Assets

| Asset | Source | Purpose |
|---|---|---|
| Outfit font | Google Fonts (CDN) | Typography throughout the UI |

No image or audio files are used. The board, tokens, and dice are rendered entirely with Canvas 2D and CSS.

---

## Dependencies

| Library | Source | Purpose |
|---|---|---|
| Outfit (font) | Google Fonts CDN | UI typography |

No JavaScript libraries are used. All game logic, rendering, and animation are implemented with vanilla JavaScript and the native Canvas 2D API.

---

## Future Improvements

- **Animated dice with dots** — replace the number faces on the CSS cube with proper dot patterns for a more authentic look.
- **Sound effects** — dice roll, token movement, and capture sounds would improve game feel.
- **Configurable number of players** — currently always four players; supporting 2- or 3-player games would add flexibility.
- **Better AI** — the current heuristic does not look ahead. A simple lookahead (evaluating the opponent's response) would improve AI quality.
- **Touch controls** — tokens are selected by clicking the canvas; adding pinch-to-zoom and tap detection would improve mobile usability.
- **Animated captures** — visually showing a token flying back to home when captured would make captures more noticeable.
