# Project Architecture

## Overview

A fully playable chess game that runs entirely in the browser. It supports two-player local play and a single-player mode where the human plays as White against an AI opponent. The AI runs in a Web Worker so the UI never freezes while the computer is thinking.

Features include legal move generation (including castling, en passant, and pawn promotion), check/checkmate/stalemate detection, undo/redo, board flipping, move history, captured piece display, and PGN (Portable Game Notation) export.

---

## Folder Structure

```
chess/
├── index.html      # Page shell, board grid, side panel, controls
├── chessLogic.js   # All chess rules — no DOM access
├── ai-worker.js    # AI engine running inside a Web Worker
├── script.js       # UI layer — rendering, event handling, game flow
└── style.css       # Visual styling and responsive layout
```

The three JavaScript files have distinct responsibilities and are never interchangeable:

- `chessLogic.js` — pure chess rules, no DOM
- `ai-worker.js` — imports `chessLogic.js` and runs the minimax search off the main thread
- `script.js` — reads from both, owns the DOM

---

## Application Flow

```
User opens index.html
        ↓
chessLogic.js loads (defines global constants and functions)
        ↓
script.js loads → calls newGame()
        ↓
Board is set to the standard starting position (startPosition())
        ↓
render() draws all 64 squares and pieces
        ↓
User clicks a square
        ↓
handleSquareClick(row, col)
        ↓
If a piece is selected → getLegalMoves() highlights valid targets
        ↓
User clicks a valid target square
        ↓
makeMove(move) applies the move, updates captures, en passant, promotion
        ↓
Turn switches to the next player
        ↓
updateGameState() checks for check, checkmate, or stalemate
        ↓
If mode is "Player vs Computer" and it is Black's turn → triggerAI()
        ↓
AI Worker receives board state via postMessage
        ↓
Worker runs minimax and posts the best move back
        ↓
makeMove() is called with the AI's chosen move
        ↓
render() redraws the board
```

---

## Core Components

### `index.html`
Defines the static page skeleton: the board grid (`#board`), player strips, game status card, control buttons (New Game, Undo, Redo, Copy PGN, Flip Board), game-mode and difficulty selectors, captured piece displays, and a scrollable move list.

### `chessLogic.js`
The rules engine. It is a plain script (not a module) so it can be loaded both by `index.html` via a `<script>` tag and by `aiWorker.js` via `importScripts()`.

Key functions:

| Function | Purpose |
|---|---|
| `startPosition()` | Returns an 8×8 array representing the standard chess opening |
| `getLegalMoves(board, row, col, color, epTarget)` | Returns all legal moves for a piece, filtering out moves that leave the king in check |
| `getAllLegalMoves(board, color, epTarget)` | Returns every legal move for a given colour |
| `getPseudoMoves(board, row, col, epTarget)` | Returns moves without the legality filter (used internally) |
| `applyMove(board, move)` | Mutates the board to apply a move (castling, en passant, promotion handled here) |
| `isSquareAttacked(board, row, col, byColor)` | Returns `true` if a square is under attack |
| `findKing(board, color)` | Locates the king of a given colour |
| `cloneBoard(board)` | Deep copies the board (used before simulating moves) |

### `ai-worker.js`
Runs the computer opponent. It imports `chessLogic.js` for move generation and board manipulation, then implements:

- **`evaluateBoard(board, color)`** — scores a position using piece values and a piece-square table (PST) that rewards central control.
- **`minimax(board, depth, alpha, beta, isMaximizing, color)`** — a standard minimax search with alpha-beta pruning.
- **`onmessage` handler** — receives `{ board, color, depth, enPassantTarget }` from the main thread, finds the best move, and posts it back.

Difficulty levels map to search depths: Easy = 1, Medium = 3, Hard = 4.

### `script.js`
The UI controller. It owns all DOM references and application state variables.

Key responsibilities:

- **`render()`** — rebuilds the 64-square grid, applies CSS classes for selected, legal, capture, and check highlights.
- **`handleSquareClick(row, col)`** — handles piece selection and move execution.
- **`makeMove(move)`** — applies the move, tracks captures, updates en passant state, auto-promotes pawns to queens, switches turns, and records move notation.
- **`buildNotation(move)`** — generates algebraic notation (SAN) for the move list.
- **`undoMove()` / `redoMove()`** — restore previous board states from the `history` and `redoStack` arrays.
- **`triggerAI()`** — creates a new Web Worker, sends the current board state, and awaits the response.
- **`generatePGN()`** — assembles the full game record in PGN format for clipboard export.

### `style.css`
Provides the full visual design: board colours, piece glyphs (Unicode chess symbols), square highlight colours (selected, legal move, capture ring, check), side-panel layout, responsive breakpoints, and a pawn promotion modal.

---

## State Management

Game state is held in module-level variables inside `script.js`:

| Variable | Type | Purpose |
|---|---|---|
| `board` | `Object[][]` | 8×8 matrix; each cell is `{ type, color, moved }` or `null` |
| `turn` | `string` | `"white"` or `"black"` |
| `selected` | `Object \| null` | `{ row, col }` of the currently selected piece |
| `legalTargets` | `Object[]` | Move objects for the selected piece |
| `history` | `Object[]` | Stack of previous states (for undo) |
| `redoStack` | `Object[]` | Stack of undone states (for redo) |
| `capturedByWhite` | `Object[]` | Pieces captured by White |
| `capturedByBlack` | `Object[]` | Pieces captured by Black |
| `enPassantTarget` | `Object \| null` | Square eligible for en passant capture |
| `flipped` | `boolean` | Whether the board is displayed from Black's perspective |
| `gameOver` | `boolean` | Set to `true` on checkmate or stalemate |
| `isComputerThinking` | `boolean` | Blocks user input while the AI Worker is running |

State is snapshotted (deep-cloned) on every move and pushed to `history`, which enables undo without any special diff logic.

---

## Event Flow

```
User clicks a square
        ↓
handleSquareClick(row, col)
        ↓
[No piece selected] → select the piece, compute legalTargets, render()
[Piece selected + valid target clicked] → makeMove(move)
        ↓
makeMove()
  ├─ applyMove(board, move)        [chessLogic.js]
  ├─ update captures, en passant
  ├─ auto-promote pawn if needed
  ├─ push snapshot to history[]
  └─ call updateGameState()
        ↓
updateGameState()
  ├─ getAllLegalMoves()             [chessLogic.js]
  ├─ check / checkmate / stalemate detection
  └─ if AI mode + Black's turn → triggerAI()
        ↓
triggerAI()
  ├─ create Web Worker (ai-worker.js)
  ├─ postMessage({ board, color, depth, enPassantTarget })
  └─ worker.onmessage → makeMove(bestMove)
        ↓
render() redraws the board
```

---

## Assets

No image or audio files are used. Chess pieces are rendered with Unicode HTML entities (e.g. `&#9812;` for ♔). All visual styling is pure CSS.

The `Outfit` font (referenced in the CSS) is the system sans-serif fallback; it is not loaded from an external source in this project.

---

## Dependencies

None. The project uses only native browser APIs:

- **Web Workers** (`new Worker('ai-worker.js')`) for off-thread AI computation.
- **`navigator.clipboard`** for the Copy PGN feature.

---

## Future Improvements

- **Pawn promotion choice** — currently all pawns auto-promote to a queen. A modal to choose the promotion piece (queen, rook, bishop, knight) is partially scaffolded in the CSS.
- **Board coordinates** — algebraic rank/file labels (a–h, 1–8) are styled in the CSS but not yet injected into the DOM.
- **Move highlighting** — highlight the last move made (from/to squares) to make it easier to follow after the AI plays.
- **Opening book** — adding a small set of known opening moves would make the AI's early game stronger and more varied.
- **Time controls** — per-player countdown clocks would allow timed games.
- **Draw detection** — threefold repetition and the fifty-move rule are not currently detected.
