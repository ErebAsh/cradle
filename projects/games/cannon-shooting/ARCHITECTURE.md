# Project Architecture

## Overview

Cannon Shooting is a real-time reaction game for one player. A computer-controlled cannon fires a projectile across a divided battlefield at a random angle and position. The player must drag their own cannon into the correct horizontal position and adjust its barrel angle to intercept the incoming shot before impact. A countdown timer shows how long is left before each round fires.

The physics kinematics engine (`cannonEngine.js`) and score/streak persistence system (`cannonStorage.js`) are separated into standalone ES/CommonJS modules.

---

## Folder Structure

```
cannon-shooting/
├── index.html       # HTML structure for HUD, both cannons, road scale, and countdown
├── cannonEngine.js  # Trigonometric trajectory calculations, hit validation, score multiplier logic
├── cannonStorage.js # High score, defense streak, and total hits persistence via localStorage
├── script.js        # Controller and interactive drag event handlers
└── style.css        # Visual styling for cannons, HUD banner, road, countdown timer
```

---

## Application Flow

```
User opens index.html
        ↓
jQuery, cannonEngine.js, cannonStorage.js, script.js load
        ↓
Load stats from localStorage & update HUD banner
        ↓
Two setInterval loops start:
  • Countdown loop (every 1 s) — counts down and updates the display
  • Round loop (every 13 s)   — fires a new round
        ↓
Round loop: computer picks random angle (0–44°) and position (2–9 cm)
        ↓
CannonEngine.calculateBallMileage() calculates trajectory mileage
        ↓
Player adjusts cannon via interactive drag handles
        ↓
After fireTime − 2 s, shot fires:
  • CannonEngine.validateHit() checks hit condition
  • CannonEngine.calculateScore() evaluates score multiplier and streak
  • CannonStorage.recordShot() updates and persists high scores & streaks
  • HUD banner updates dynamically
```

---

## Core Modules

### `cannonEngine.js`
Kinematics physics engine:
- `degToRad(deg)`: Converts degrees to radians.
- `calculateBallMileage(cmCanX, cmCanAngle)`: Computes trajectory mileage `(cmCanX + 4.23) / cos(angle)`.
- `validateHit(userCanX, userCanY, comCanX, cmCanAngle, xTol, angleTol)`: Evaluates position and angle alignment against tolerance window.
- `calculateScore(isHit, currentStreak)`: Computes score awards and streak multipliers.

### `cannonStorage.js`
Persistence system:
- `loadStats()`: Loads stats from `localStorage`.
- `recordShot(stats, isHit, scoreAwarded, newStreak)`: Updates high score, current streak, best streak, accuracy, and saves back to `localStorage`.
- `resetStats()`: Resets score data.

### `script.js`
UI event bindings, HUD update controller, jQuery animation loops.

---

## Unit Testing

Automated unit test suite is located in `tests/cannon-shooting.test.js` and can be executed via:
```bash
node --test tests/cannon-shooting.test.js
```
