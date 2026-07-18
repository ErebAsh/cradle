# Project Architecture

## Overview

Pairwise is a single-player memory card game. The player is presented with 64 face-down tiles arranged in an 8×8 grid. Each tile hides an emoji symbol. Tiles come in matched pairs (32 symbols × 2 = 64 tiles). The player flips two tiles at a time; if they match they stay face-up, otherwise they flip back after a short delay. The goal is to clear the entire board using as few flips as possible.

---

## Folder Structure

```
memory-flip-game/
├── index.html   # Page shell: navbar, home screen, game screen, result screen
├── script.js    # All game logic and screen management
└── style.css    # CSS flip animation, tile styling, layout
```

---

## Application Flow

```
User opens index.html
        ↓
Home screen is displayed
        ↓
User clicks "Start Game"
        ↓
startGame()
  ├─ buildDeck() → shuffles 64 cards (32 symbol pairs)
  ├─ Creates a <div class="card"> for each card and appends to #board
  └─ showScreen("game") → switches visible section
        ↓
User clicks a face-down tile
        ↓
onCardClick(card) flips the card (adds .is-flipped class)
        ↓
When two cards are flipped → checkForMatch()
  ├─ Match: both cards get .is-matched, matchedPairs++
  └─ No match: cards shake, then flip back after 700 ms
        ↓
flipCount is incremented and the navbar counter updates
        ↓
When matchedPairs === 32 → endGame() after 500 ms
        ↓
Result screen shows total flip count
        ↓
User clicks "Play Again" → startGame() restarts
```

---

## Core Components

### `index.html`
Three `<section>` elements are used as screens; only one is visible at a time (controlled via the `hidden` attribute):

- **`#homeScreen`** — welcome copy and the "Start Game" button.
- **`#gameScreen`** — contains the `#board` div where cards are injected.
- **`#resultScreen`** — shows the final flip count and a "Play Again" button.

The `<header class="navbar">` is always visible. It shows the live flip counter and matched pair count during a game, hidden on the home and result screens.

### `script.js`
The entire game fits in one small file. Key functions:

| Function | Purpose |
|---|---|
| `buildDeck()` | Duplicates the 32-symbol `SYMBOLS` array, shuffles it using Fisher-Yates, and returns an array of `{ id, symbol }` card objects |
| `startGame()` | Resets all counters, clears the board, creates card DOM elements, and switches to the game screen |
| `onCardClick(card)` | Guards against double-clicks and locked board; flips the card by adding `.is-flipped`; calls `checkForMatch` when two are flipped |
| `checkForMatch()` | Compares `data-symbol` attributes of the two flipped cards; marks matched pairs or schedules a flip-back |
| `endGame()` | Writes the final flip count to the result screen and switches to it |
| `showScreen(screen)` | Toggles the `hidden` attribute on the three screens and the navbar stats |
| `shuffle(array)` | In-place Fisher-Yates shuffle, returns the mutated array |

The `SYMBOLS` array at the top of the file contains 32 unique emoji characters. These are the only "assets" in the game.

### `style.css`
Implements the card flip effect using CSS 3D transforms:

- Each `.card` has `perspective` applied.
- `.card__inner` uses `transform-style: preserve-3d` and `transition: transform 0.45s`.
- `.card__face--back` is the default visible face; `.card__face--front` has `transform: rotateY(180deg)` and is hidden by `backface-visibility: hidden`.
- Adding `.is-flipped` or `.is-matched` to `.card` rotates `.card__inner` by 180°, revealing the front face.
- Mismatched cards get a brief shake animation via `.is-mismatch`.

Layout uses a CSS Grid of `repeat(8, 1fr)` for the board and flexbox for the navbar.

---

## State Management

State is tracked with four module-level variables in `script.js`:

| Variable | Type | Purpose |
|---|---|---|
| `flippedCards` | `Element[]` | Holds the one or two currently face-up, unmatched cards |
| `matchedPairs` | `number` | Count of matched pairs; wins when it reaches 32 |
| `flipCount` | `number` | Total number of two-card flip attempts |
| `boardLocked` | `boolean` | Prevents further clicks during the mismatch delay |

There is no persistent state — each game starts fresh with no `localStorage` involvement.

---

## Event Flow

```
User clicks a tile
        ↓
onCardClick(card)
  ├─ boardLocked? → return
  ├─ already flipped or matched? → return
  ├─ two cards already held? → return
  └─ add .is-flipped, push to flippedCards[]
        ↓
If flippedCards.length === 2:
  flipCount++, update navbar
  checkForMatch()
    ├─ Same symbol?
    │   ├─ add .is-matched to both
    │   ├─ matchedPairs++
    │   └─ matchedPairs === 32 → setTimeout(endGame, 500)
    └─ Different symbol?
        ├─ boardLocked = true
        ├─ add .is-mismatch (shake animation)
        └─ setTimeout 700 ms:
              remove .is-flipped and .is-mismatch
              flippedCards = []
              boardLocked = false
```

---

## Assets

No image or audio files are used. The 32 game symbols are Unicode emoji embedded directly in the `SYMBOLS` array in `script.js`. The `Fraunces` and `Space Grotesk` fonts are loaded from Google Fonts.

---

## Dependencies

| Library | Source | Purpose |
|---|---|---|
| Fraunces (font) | Google Fonts CDN | Display headings |
| Space Grotesk (font) | Google Fonts CDN | Body text and UI labels |

No JavaScript libraries are used.

---

## Future Improvements

- **Difficulty levels** — offer smaller grids (e.g. 4×4, 6×6) for beginners alongside the full 8×8 board.
- **Timer** — show elapsed time alongside the flip count to give players a second metric to improve.
- **Best score persistence** — save the all-time lowest flip count to `localStorage` and display it on the home screen.
- **Themed card sets** — allow players to switch between emoji categories (animals, food, sports) without changing the game rules.
- **Accessibility** — add `aria-label` attributes to each card describing its state (face-down, flipped, matched) for screen reader support.
