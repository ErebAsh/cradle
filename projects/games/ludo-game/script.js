const canvas = document.getElementById("ludoCanvas");
const ctx = canvas.getContext("2d");
const CELL_SIZE = 40; // 600 / 15
const BOARD_SIZE = 15;

const statusElement = document.getElementById("status");
const turnLabel = document.getElementById("turnLabel");
const moveList = document.getElementById("moveList");
const moveCount = document.getElementById("moveCount");
const diceCube = document.getElementById("diceCube");

const COLORS = ["red", "green", "blue", "yellow"];
const THEME = {
    red: "#ff4757", green: "#2ed573", blue: "#1e90ff", yellow: "#ffc312",
    redDark: "#c0392b", greenDark: "#1e8449", blueDark: "#1565c0", yellowDark: "#d4a017",
    boardBg: "#1a1a2e", trackBg: "#2a2a40", border: "#3a3a55", safeZone: "#35354d",
    centerBg: "#222240"
};

const GLOBAL_TRACK = [
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0]
];

const SAFE_ZONES = [
    [6,1], [2,6], [1,8], [6,13],
    [8,13], [12,8], [13,6], [8,1]
];

// 5 steps to reach center triangle
const VICTORY_PATHS = {
    red:    [[7,1], [7,2], [7,3], [7,4], [7,5]],
    green:  [[1,7], [2,7], [3,7], [4,7], [5,7]],
    blue:   [[7,13], [7,12], [7,11], [7,10], [7,9]],
    yellow: [[13,7], [12,7], [11,7], [10,7], [9,7]]
};

const HOME_CENTERS = {
    red: [[2,2], [2,3], [3,2], [3,3]],
    green: [[2,11], [2,12], [3,11], [3,12]],
    blue: [[11,11], [11,12], [12,11], [12,12]],
    yellow: [[11,2], [11,3], [12,2], [12,3]]
};

const START_INDEX = { red: 0, green: 13, blue: 26, yellow: 39 };

let currentPlayerIndex = 0;
let diceValue = null;
let isRolling = false;
let history = [];
let gameOver = false;
let hoveredToken = null;

let playerTypes = {
    red: 'human',
    green: 'bot',
    blue: 'bot',
    yellow: 'bot'
};

let state = {
    red: createTokens("red"),
    green: createTokens("green"),
    blue: createTokens("blue"),
    yellow: createTokens("yellow")
};

function createTokens(color) {
    return Array.from({ length: 4 }, (_, id) => ({
        id,
        color,
        position: -1, // -1 means home
        isVictoryPath: false,
        finished: false,
        // Animation states
        currentX: HOME_CENTERS[color][id][1] * CELL_SIZE + CELL_SIZE/2,
        currentY: HOME_CENTERS[color][id][0] * CELL_SIZE + CELL_SIZE/2,
        targetX: null,
        targetY: null,
        animProgress: 1,
        zOffset: 0
    }));
}

// --- RENDERING ENGINE ---
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Board background
    ctx.fillStyle = THEME.boardBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Homes with subtle inner gradient
    const homes = [
        { color: 'red', x: 0, y: 0 },
        { color: 'green', x: 9, y: 0 },
        { color: 'blue', x: 9, y: 9 },
        { color: 'yellow', x: 0, y: 9 }
    ];
    homes.forEach(h => {
        let grd = ctx.createLinearGradient(
            h.x * CELL_SIZE, h.y * CELL_SIZE,
            (h.x + 6) * CELL_SIZE, (h.y + 6) * CELL_SIZE
        );
        grd.addColorStop(0, THEME[h.color]);
        grd.addColorStop(1, THEME[h.color + 'Dark']);
        ctx.fillStyle = grd;
        ctx.fillRect(h.x * CELL_SIZE, h.y * CELL_SIZE, 6 * CELL_SIZE, 6 * CELL_SIZE);
    });

    // Inner home boxes (darker for dark theme)
    ctx.fillStyle = "#12122a";
    roundRect(1.2*CELL_SIZE, 1.2*CELL_SIZE, 3.6*CELL_SIZE, 3.6*CELL_SIZE, 10); ctx.fill();
    roundRect(10.2*CELL_SIZE, 1.2*CELL_SIZE, 3.6*CELL_SIZE, 3.6*CELL_SIZE, 10); ctx.fill();
    roundRect(10.2*CELL_SIZE, 10.2*CELL_SIZE, 3.6*CELL_SIZE, 3.6*CELL_SIZE, 10); ctx.fill();
    roundRect(1.2*CELL_SIZE, 10.2*CELL_SIZE, 3.6*CELL_SIZE, 3.6*CELL_SIZE, 10); ctx.fill();

    // Home slots (empty circles)
    COLORS.forEach(color => {
        HOME_CENTERS[color].forEach(([r, c]) => {
            ctx.beginPath();
            ctx.arc(c * CELL_SIZE + CELL_SIZE/2, r * CELL_SIZE + CELL_SIZE/2, 12, 0, 2*Math.PI);
            ctx.fillStyle = THEME[color + 'Dark'];
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = THEME[color];
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    });

    // Global Track
    ctx.lineWidth = 1;
    ctx.strokeStyle = THEME.border;
    GLOBAL_TRACK.forEach(([r, c]) => {
        let isSafe = SAFE_ZONES.some(z => z[0]===r && z[1]===c);
        ctx.fillStyle = isSafe ? THEME.safeZone : THEME.trackBg;
        
        // Color starting tiles
        if (r===6 && c===1)  ctx.fillStyle = THEME.red;
        if (r===1 && c===8)  ctx.fillStyle = THEME.green;
        if (r===8 && c===13) ctx.fillStyle = THEME.blue;
        if (r===13 && c===6) ctx.fillStyle = THEME.yellow;

        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Safe zone star
        if (isSafe) {
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "18px Outfit";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★", c * CELL_SIZE + CELL_SIZE/2, r * CELL_SIZE + CELL_SIZE/2);
        }
    });

    // Victory Paths (with gradient intensity)
    COLORS.forEach(color => {
        VICTORY_PATHS[color].forEach(([r, c], i) => {
            ctx.globalAlpha = 0.5 + (i * 0.1);
            ctx.fillStyle = THEME[color];
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = THEME.border;
            ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });
    });

    // Center Triangles
    ctx.lineWidth = 1;
    ctx.strokeStyle = THEME.border;
    // Yellow (bottom-left)
    ctx.beginPath(); ctx.moveTo(6*CELL_SIZE, 9*CELL_SIZE); ctx.lineTo(7.5*CELL_SIZE, 7.5*CELL_SIZE); ctx.lineTo(9*CELL_SIZE, 9*CELL_SIZE); ctx.closePath(); ctx.fillStyle = THEME.yellow; ctx.fill(); ctx.stroke();
    // Green (top-right)
    ctx.beginPath(); ctx.moveTo(9*CELL_SIZE, 6*CELL_SIZE); ctx.lineTo(7.5*CELL_SIZE, 7.5*CELL_SIZE); ctx.lineTo(6*CELL_SIZE, 6*CELL_SIZE); ctx.closePath(); ctx.fillStyle = THEME.green; ctx.fill(); ctx.stroke();
    // Red (left)
    ctx.beginPath(); ctx.moveTo(6*CELL_SIZE, 6*CELL_SIZE); ctx.lineTo(7.5*CELL_SIZE, 7.5*CELL_SIZE); ctx.lineTo(6*CELL_SIZE, 9*CELL_SIZE); ctx.closePath(); ctx.fillStyle = THEME.red; ctx.fill(); ctx.stroke();
    // Blue (right)
    ctx.beginPath(); ctx.moveTo(9*CELL_SIZE, 6*CELL_SIZE); ctx.lineTo(9*CELL_SIZE, 9*CELL_SIZE); ctx.lineTo(7.5*CELL_SIZE, 7.5*CELL_SIZE); ctx.closePath(); ctx.fillStyle = THEME.blue; ctx.fill(); ctx.stroke();
}

function drawTokens() {
    COLORS.forEach(color => {
        state[color].forEach(token => {
            if (token.finished) return;

            // Handle jumping animation interpolation
            if (token.animProgress < 1) {
                token.animProgress += 0.05;
                if (token.animProgress > 1) token.animProgress = 1;
                
                let p = token.animProgress;
                let ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
                
                token.currentX = token.startX + (token.targetX - token.startX) * ease;
                token.currentY = token.startY + (token.targetY - token.startY) * ease;
                token.zOffset = Math.sin(p * Math.PI) * 15;
            }

            let isHovered = hoveredToken === token;
            let canMove = isHovered && isValidMove(token);
            let tx = token.currentX;
            let ty = token.currentY - token.zOffset;

            // Glow for valid movable tokens
            if (canMove) {
                ctx.shadowColor = THEME[color];
                ctx.shadowBlur = 20;
            }

            // Drop shadow
            ctx.beginPath();
            ctx.ellipse(tx, token.currentY + 2, 10, 4, 0, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fill();

            // Outer ring
            ctx.beginPath();
            ctx.arc(tx, ty, 14, 0, 2*Math.PI);
            ctx.fillStyle = '#eee';
            ctx.fill();
            ctx.strokeStyle = THEME[color + 'Dark'];
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner gradient fill
            let grd = ctx.createRadialGradient(tx - 3, ty - 4, 2, tx, ty, 11);
            grd.addColorStop(0, '#fff');
            grd.addColorStop(0.3, THEME[color]);
            grd.addColorStop(1, THEME[color + 'Dark']);
            ctx.beginPath();
            ctx.arc(tx, ty, 11, 0, 2*Math.PI);
            ctx.fillStyle = grd;
            ctx.fill();

            // Specular highlight
            ctx.beginPath();
            ctx.arc(tx - 3, ty - 4, 4, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fill();

            ctx.shadowBlur = 0;
        });
    });
}


function rollDice() {
    if (gameOver) return;

function renderLoop() {
    drawBoard();
    drawTokens();
    requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);



// --- LOGIC ---
function getTokenCoordinate(token) {
    if (token.finished) return null;
    
    let r, c;
    if (token.position === -1) {
        [r, c] = HOME_CENTERS[token.color][token.id];
    } else if (token.isVictoryPath) {
        [r, c] = VICTORY_PATHS[token.color][token.position];
    } else {
        [r, c] = GLOBAL_TRACK[token.position];
    }
    
    return {
        x: c * CELL_SIZE + CELL_SIZE/2,
        y: r * CELL_SIZE + CELL_SIZE/2
    };
}


    diceValue = Math.floor(Math.random() * 6) + 1;
    diceValueElement.textContent = diceValue;

    const playerColorName = capitalize(COLORS[currentPlayer]); 
    setStatus(`${playerColorName} rolled ${diceValue}`);

    const currentTokens = (typeof tokens !== 'undefined' ? tokens : 
                           typeof playerTokens !== 'undefined' ? playerTokens : 
                           typeof gameState !== 'undefined' ? gameState.tokens : null)?.[COLORS[currentPlayer]];

    if (currentTokens) {
        const allTokensInYard = currentTokens.every(token => token.stepsTraveled === 0);

        if (diceValue !== 6 && allTokensInYard) {
            setStatus(`${playerColorName} rolled a ${diceValue}. Need a 6 to leave base!`);
            
            setTimeout(() => {
                diceValue = null; 
                nextTurn(); 
            }, 1200);
            return;
        }
    } else {
        if (diceValue !== 6) {
            setTimeout(() => {
                diceValue = null;
                nextTurn();
            }, 1200);
            return;
        }
    }

function animateTokenTo(token) {
    let coords = getTokenCoordinate(token);
    if (!coords) return;
    
    token.startX = token.currentX;
    token.startY = token.currentY;
    token.targetX = coords.x;
    token.targetY = coords.y;
    token.animProgress = 0;
}

function rollDice() {
    if (gameOver || diceValue !== null || isRolling) return;
    
    isRolling = true;
    diceCube.classList.add('rolling');
    
    setTimeout(() => {
        diceValue = Math.floor(Math.random() * 6) + 1;
        diceCube.classList.remove('rolling');
        
        // Reset classes
        diceCube.className = `cube show-${diceValue}`;
        
        isRolling = false;
        setStatus(`${capitalize(COLORS[currentPlayerIndex])} rolled ${diceValue}`);
        
        saveGame();
        checkAutoTurn();
    }, 1000);

}

function checkAutoTurn() {
    let validMoves = state[COLORS[currentPlayerIndex]].filter(t => isValidMove(t));
    if (validMoves.length === 0) {
        setTimeout(nextTurn, 1000);
    } else if (playerTypes[COLORS[currentPlayerIndex]] === 'bot') {
        setTimeout(() => executeAITurn(validMoves), 800);
    } else if (validMoves.length === 1 && validMoves[0].position !== -1) {
        // Auto move if only one valid non-home token
        // setTimeout(() => executeMove(validMoves[0]), 500); // optional polish
    }
}

function executeAITurn(validMoves) {
    if (validMoves.length === 0) return;
    
    let bestMove = null;
    let bestScore = -1;

    // Heuristic evaluation
    validMoves.forEach(token => {
        let score = evaluateMove(token);
        if (score > bestScore) {
            bestScore = score;
            bestMove = token;
        } else if (score === bestScore) {
            // Random tie break
            if (Math.random() > 0.5) {
                bestMove = token;
            }
        }
    });

    if (bestMove) {
        executeMove(bestMove);
    }
}

function evaluateMove(token) {
    let score = 10; // Base score for any valid move
    
    // Simulate move
    let newPosition = -1;
    let newIsVictoryPath = token.isVictoryPath;

    if (token.position === -1) {
        score += 50; // Move out of home
        newPosition = START_INDEX[token.color];
    } else if (token.isVictoryPath) {
        newPosition = token.position + diceValue;
        if (newPosition === 5) {
            score += 50; // Finished
        }
    } else {
        let dist = calculateDistanceToHome(token);
        if (diceValue > dist) {
            newIsVictoryPath = true;
            newPosition = diceValue - dist - 1;
            score += 50; // Entering victory path
        } else {
            newPosition = (token.position + diceValue) % 52;
        }
    }

    // Check captures
    if (!newIsVictoryPath && newPosition !== -1) {
        let [r, c] = GLOBAL_TRACK[newPosition];
        let isSafe = SAFE_ZONES.some(z => z[0]===r && z[1]===c);
        
        if (isSafe) {
            score += 50; // Moving to safe zone
        } else {
            // Check if capturing opponent
            COLORS.forEach(c => {
                if (c !== token.color) {
                    state[c].forEach(targetToken => {
                        if (!targetToken.isVictoryPath && targetToken.position === newPosition) {
                            score += 100; // Capture opponent
                        }
                    });
                }
            });
        }
    }
    
    return score;
}

function isValidMove(token) {
    if (COLORS[currentPlayerIndex] !== token.color || diceValue === null) return false;
    if (token.finished) return false;

    if (token.position === -1) {
        return diceValue === 6;
    }

    if (token.isVictoryPath) {
        return token.position + diceValue <= 5; // 5 means finished
    }

    // Checking distance to home entry
    let distToHome = calculateDistanceToHome(token);
    if (diceValue > distToHome + 5) {
        return false; // Overshoots center
    }

    return true;
}

function calculateDistanceToHome(token) {
    let homeEntryIndex;
    if (token.color === 'red') homeEntryIndex = 50;
    if (token.color === 'green') homeEntryIndex = 11;
    if (token.color === 'blue') homeEntryIndex = 24;
    if (token.color === 'yellow') homeEntryIndex = 37;

    if (token.position <= homeEntryIndex) return homeEntryIndex - token.position;
    return (52 - token.position) + homeEntryIndex;
}

function executeMove(token) {
    if (token.position === -1) {
        token.position = START_INDEX[token.color];
        history.unshift(`${capitalize(token.color)} Token ${token.id + 1} entered board`);
    } else if (token.isVictoryPath) {
        token.position += diceValue;
        if (token.position === 5) {
            token.finished = true;
            history.unshift(`${capitalize(token.color)} Token ${token.id + 1} reached center`);
        }
    } else {
        let dist = calculateDistanceToHome(token);
        if (diceValue > dist) {
            token.isVictoryPath = true;
            token.position = diceValue - dist - 1; // 0-based index in victory path
        } else {
            token.position = (token.position + diceValue) % 52;
        }
        
        // Handle capturing (simplified, no safe zones check for capture in this basic version for brevity, but easy to add)
        handleCaptures(token);
    }

    animateTokenTo(token);
    
    if (checkWinner(token.color)) {
        gameOver = true;
        setStatus(`${capitalize(token.color)} wins!`);
        localStorage.removeItem('ludoSave');
        return;
    }

    if (diceValue !== 6 && !token.finished) {
        setTimeout(nextTurn, 600); // Wait for animation
    } else {
        setTimeout(() => {
            diceValue = null;
            setStatus(`${capitalize(COLORS[currentPlayerIndex])} gets another turn`);
            
            saveGame();

            if (playerTypes[COLORS[currentPlayerIndex]] === 'bot') {
                setTimeout(rollDice, 800);
            }
        }, 600);
    }
}

function handleCaptures(movedToken) {
    if (movedToken.isVictoryPath) return;
    
    // Check if on safe zone
    let [r, c] = GLOBAL_TRACK[movedToken.position];
    if (SAFE_ZONES.some(z => z[0]===r && z[1]===c)) return;

    COLORS.forEach(color => {
        if (color === movedToken.color) return;
        state[color].forEach(targetToken => {
            if (!targetToken.isVictoryPath && targetToken.position === movedToken.position) {
                targetToken.position = -1;
                animateTokenTo(targetToken);
                history.unshift(`${capitalize(movedToken.color)} captured ${capitalize(color)}!`);
            }
        });
    });
}

function nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % COLORS.length;
    diceValue = null;
    diceCube.className = 'cube';
    turnLabel.textContent = capitalize(COLORS[currentPlayerIndex]);
    moveCount.textContent = history.length;
    setStatus(`${capitalize(COLORS[currentPlayerIndex])}'s turn`);
    updatePlayerIndicators();
    renderHistory();
    
    saveGame();
    
    if (playerTypes[COLORS[currentPlayerIndex]] === 'bot') {
        setTimeout(rollDice, 800);
    }
}

function updatePlayerIndicators() {
    document.querySelectorAll('.player-row').forEach(row => {
        row.classList.toggle('active', row.dataset.color === COLORS[currentPlayerIndex]);
    });
}

function checkWinner(color) {
    return state[color].every(t => t.finished);
}

function renderHistory() {
    moveList.innerHTML = history.map(m => `<li>${m}</li>`).join("");
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

function setStatus(text) { statusElement.textContent = text; }

function newGame() {
    COLORS.forEach(color => { state[color] = createTokens(color); });
    currentPlayerIndex = 0;
    diceValue = null;
    history = [];
    gameOver = false;
    diceCube.className = 'cube';
    turnLabel.textContent = "Red";
    moveCount.textContent = "0";
    setStatus("Red's turn");
    updatePlayerIndicators();
    renderHistory();
    
    saveGame();
    
    if (playerTypes[COLORS[currentPlayerIndex]] === 'bot') {
        setTimeout(rollDice, 800);
    }
}

// Interactivity
canvas.addEventListener("mousemove", (e) => {
    if (gameOver || isRolling) { hoveredToken = null; return; }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoveredToken = null;
    const activeColor = COLORS[currentPlayerIndex];
    
    for (let token of state[activeColor]) {
        let dx = x - token.currentX;
        let dy = y - token.currentY;
        if (dx*dx + dy*dy <= 196) { // 14^2 radius
            hoveredToken = token;
            break;
        }
    }
});

canvas.addEventListener("click", () => {
    if (hoveredToken && isValidMove(hoveredToken)) {
        executeMove(hoveredToken);
        hoveredToken = null;
    }
});

document.getElementById("rollDice").addEventListener("click", () => {
    if (playerTypes[COLORS[currentPlayerIndex]] === 'human') {
        rollDice();
    }
});

const setupModal = document.getElementById('setupModal');
document.getElementById("newGame").addEventListener("click", () => {
    setupModal.classList.remove('hidden');
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
    setupModal.classList.add('hidden');
});

document.getElementById("startGameBtn").addEventListener("click", () => {
    playerTypes.red = document.getElementById('select-red').value;
    playerTypes.green = document.getElementById('select-green').value;
    playerTypes.blue = document.getElementById('select-blue').value;
    playerTypes.yellow = document.getElementById('select-yellow').value;
    
    document.getElementById('icon-red').textContent = playerTypes.red === 'human' ? '👤' : '🤖';
    document.getElementById('icon-green').textContent = playerTypes.green === 'human' ? '👤' : '🤖';
    document.getElementById('icon-blue').textContent = playerTypes.blue === 'human' ? '👤' : '🤖';
    document.getElementById('icon-yellow').textContent = playerTypes.yellow === 'human' ? '👤' : '🤖';

    setupModal.classList.add('hidden');
    newGame();
});

document.getElementById("backHome").addEventListener("click", () => window.location.href = "/");

// Save/Load System
function saveGame() {
    const saveData = {
        state: state,
        history: history,
        currentPlayerIndex: currentPlayerIndex,
        diceValue: diceValue,
        playerTypes: playerTypes
    };
    localStorage.setItem('ludoSave', JSON.stringify(saveData));
}

function loadGame(saveData) {
    state = saveData.state;
    history = saveData.history;
    currentPlayerIndex = saveData.currentPlayerIndex;
    diceValue = saveData.diceValue;
    playerTypes = saveData.playerTypes || playerTypes;

    COLORS.forEach(color => {
        state[color].forEach(token => {
            token.animProgress = 1;
            token.zOffset = 0;
            let coords = getTokenCoordinate(token);
            if (coords) {
                token.currentX = coords.x;
                token.currentY = coords.y;
                token.targetX = coords.x;
                token.targetY = coords.y;
                token.startX = coords.x;
                token.startY = coords.y;
            }
        });
    });

    if (diceValue !== null) {
        diceCube.className = `cube show-${diceValue}`;
        setStatus(`${capitalize(COLORS[currentPlayerIndex])} rolled ${diceValue}`);
    } else {
        diceCube.className = 'cube';
        setStatus(`${capitalize(COLORS[currentPlayerIndex])}'s turn`);
    }
    
    turnLabel.textContent = capitalize(COLORS[currentPlayerIndex]);
    moveCount.textContent = history.length;
    
    updatePlayerIndicators();
    renderHistory();
    
    document.getElementById('icon-red').textContent = playerTypes.red === 'human' ? '👤' : '🤖';
    document.getElementById('icon-green').textContent = playerTypes.green === 'human' ? '👤' : '🤖';
    document.getElementById('icon-blue').textContent = playerTypes.blue === 'human' ? '👤' : '🤖';
    document.getElementById('icon-yellow').textContent = playerTypes.yellow === 'human' ? '👤' : '🤖';

    if (diceValue !== null) {
        checkAutoTurn();
    } else if (playerTypes[COLORS[currentPlayerIndex]] === 'bot') {
        setTimeout(rollDice, 800);
    }
}

// Initial Load Logic
const savedDataString = localStorage.getItem('ludoSave');
const resumeModal = document.getElementById('resumeModal');

if (savedDataString) {
    resumeModal.classList.remove('hidden');
} else {
    setupModal.classList.remove('hidden');
}

document.getElementById('resumeGameBtn').addEventListener('click', () => {
    resumeModal.classList.add('hidden');
    try {
        const savedData = JSON.parse(savedDataString);
        loadGame(savedData);
    } catch (e) {
        console.error("Failed to load save data", e);
        setupModal.classList.remove('hidden');
    }
});

document.getElementById('startFreshBtn').addEventListener('click', () => {
    resumeModal.classList.add('hidden');
    localStorage.removeItem('ludoSave');
    setupModal.classList.remove('hidden');
});