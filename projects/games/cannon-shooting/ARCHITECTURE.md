# Project Architecture

## Overview

Cannon Shooting is a real-time reaction game for one player. A computer-controlled cannon fires a projectile across a divided battlefield at a random angle and position. The player must drag their own cannon into the correct horizontal position and adjust its barrel angle to intercept the incoming shot before impact. A countdown timer shows how long is left before each round fires.

---

## Folder Structure

```
cannon-shooting/
├── index.html   # HTML structure for both cannons, the road scale, and countdown
├── script.js    # All game logic and interactive drag behaviour
└── style.css    # Visual styling for cannons, ball, road, countdown timer
```

---

## Application Flow

```
User opens index.html
        ↓
jQuery and script.js load
        ↓
Two setInterval loops start:
  • Countdown loop (every 1 s) — counts down and updates the display
  • Round loop (every 13 s)   — fires a new round
        ↓
Round loop: computer picks a random angle (0–44°) and position (2–9 cm)
        ↓
Computer cannon animates to its new position and angle
        ↓
Level indicator updates to show the incoming angle
        ↓
Player adjusts their cannon:
  • Drag .wheel-handle  → moves cannon left/right
  • Drag .level-handle  → tilts the barrel (0–65°)
        ↓
After fireTime − 2 s, the round fires:
  • Both cannons play the fire animation
  • Player position and angle are compared against the computer's values
        ↓
If player is within ±5 px (position) and ±2° (angle) → "defended"
  • Ball animates back towards the player cannon
  • Hit sound plays
        ↓
If player missed:
  • Ball flies off screen
        ↓
Next round begins automatically
```

---

## Core Components

### `index.html`
Defines the visual structure of the game:

- **`.game-wrapper`** — full-viewport flex column that stacks the game area and the road.
- **`.countdown`** — fixed circular timer in the centre of the screen.
- **`.game-container`** — the battlefield, divided by a centre dashed line into two columns.
  - **`.computer-col`** — left side, mirrored with CSS `rotateY(180deg)`. Holds the computer's cannon (`.cannon.cm`).
  - **`.user-col`** — right side. Holds the player's cannon with its interactive handles.
- **`.road`** — a ruler-like strip at the bottom showing centimetre markings for both sides, helping the player estimate distances.

### `script.js`
Contains all game behaviour. There are no separate modules — logic, physics, and UI interaction live together in one file.

Key variables:

| Variable | Purpose |
|---|---|
| `userCanX` | Current horizontal position of the player's cannon in pixels |
| `userCanY` | Current barrel angle of the player's cannon in degrees |
| `fireTime` | Duration of each round in milliseconds (13,000 ms) |
| `countdown` | Seconds remaining until the shot fires |
| `hitAudio` / `fireAudio` | Audio objects for the hit and fire sound effects |

Key logic blocks:

- **Countdown interval** — decrements `countdown` every second and writes it to `.countdown`.
- **Round interval** — runs every `fireTime` ms. Picks random values for the computer cannon's position (`cmCanX`) and angle (`cmCanAngle`), then computes the expected ball travel distance using basic trigonometry (`ballMileage = (cmCanX + 4.23) / cos(angle)`). Sets a nested `setTimeout` to fire the shot after `fireTime − 2000` ms.
- **Hit detection** — compares `userCanX` (in pixels, converted: `cmCanX * 37.79`) with the player's position, and `userCanY` with the computer's angle, using a tolerance window (±5 px, ±2°).
- **`.wheel-handle` drag** — jQuery `mousedown` / `mousemove` / `mouseup` pattern. Translates horizontal mouse delta into cannon position, clamped to the valid range (35–375 px).
- **`.level-handle` drag** — same pattern for vertical mouse delta, which is mapped to barrel angle (−5–65°).

### `style.css`
Builds the cannons entirely from CSS shapes (no images):

- The barrel (`.pipe`) is a horizontal rectangle with `border-radius` on the right end and a pseudo-element for the cannon mouth.
- The wheel (`.wheel`) is a `border-radius: 50%` div with a striped background pattern.
- The cannonball (`.ball`) is a small circle that animates with jQuery `.animate()`.
- The explosion effect on the computer's ball is a background image triggered by the `.defended` class.

---

## State Management

There is no centralised state object. State is tracked through a small set of module-level variables:

| Variable | Where Updated |
|---|---|
| `userCanX` | Updated on `mouseup` after a horizontal drag |
| `userCanY` | Updated on `mouseup` after a vertical drag |
| `countdown` | Decremented by the countdown interval; reset by the round interval |

All other "state" is implicit in the CSS classes and jQuery animation queue (e.g. whether the `.fire` class is applied, whether `.game-container` has the `.defended` class).

---

## Event Flow

```
User drags .wheel-handle (horizontal)
        ↓
jQuery mousemove → compute new X position (clamped 35–375 px)
        ↓
CSS transform: translateX applied to .user-col .cannon
        ↓
mouseup → userCanX is persisted

User drags .level-handle (vertical)
        ↓
jQuery mousemove → compute new angle (clamped −5–65°)
        ↓
CSS transform: rotate applied to .user-col .pipe
        ↓
mouseup → userCanY is persisted

Round timer fires
        ↓
Computer cannon moves to random position and angle
        ↓
setTimeout fires after (fireTime − 2000) ms
        ↓
Hit check: compare userCanX with cmCanX (converted) and userCanY with cmCanAngle
        ↓
.defended class added or ball animates off screen
        ↓
Audio plays
```

---

## Assets

| Asset | Source | Purpose |
|---|---|---|
| Background image | `https://bhckids.org/wp-content/uploads/2015/04/background.jpg` | Battlefield background loaded via CSS |
| Wheel handle icon | `https://cdn.onlinewebfonts.com/svg/img_520243.png` | SVG icon for the drag handle |
| Explosion image | `https://www.onlygfx.com/wp-content/uploads/2017/06/comic-boom-explosion-2-1.png` | Shown on a successful defence |
| Fire sound | `http://soundbible.com/mp3/Super%20Punch%20MMA-SoundBible.com-1869306362.mp3` | Plays when a shot fires |
| Hit sound | `http://soundbible.com/mp3/Sniper_Rifle-Kibblesbob-2053709564.mp3` | Plays on a successful interception |

All assets are loaded from external URLs at runtime. The game requires an internet connection to display the background and play audio.

---

## Dependencies

| Library | Version | How Used |
|---|---|---|
| jQuery | 3.4.1 (CDN) | DOM selection, `.css()`, `.animate()`, `.mousedown()` / `.mousemove()` drag events |
| Meyer Reset | 2.0 (CDN) | CSS reset to normalise default browser styles |

---

## Future Improvements

- **Touch / mobile support** — replace jQuery mouse events with pointer events or touch events so the game works on touchscreen devices.
- **Local asset hosting** — bundle the background image, sounds, and icons locally to remove the dependency on external URLs and make the game work offline.
- **Score tracking** — count how many shots the player successfully intercepts across rounds and display a running score.
- **Difficulty progression** — gradually reduce the tolerance window or increase the round speed as the player's score grows.
- **Visual feedback** — show a "miss" indicator and the correct target position after each round so players can learn from mistakes.
- **Remove jQuery dependency** — the drag interactions and CSS updates could be rewritten in vanilla JavaScript to remove the external dependency.
