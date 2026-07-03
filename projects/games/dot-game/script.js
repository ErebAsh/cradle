const boardElement = document.getElementById("board");
const playerCountElement = document.getElementById("playerCount");
const gridPresetElement = document.getElementById("gridPreset");
const gridCustomElement = document.getElementById("gridCustom");
const gridValueElement = document.getElementById("gridValue");
const currentPlayerElement = document.getElementById("currentPlayer");
const playerStatsElement = document.getElementById("playerStats");
const analyticsContainer = document.getElementById("analyticsContainer");

const COLORS = ["red", "blue", "green", "yellow"];

let boardSize = 8;
let state = {};
let matchHistory = JSON.parse(localStorage.getItem('dotGameHistory')) || [];

function updateGridValue(size) {
    gridValueElement.textContent = `${size} × ${size}`;
}

gridPresetElement.addEventListener("change", (e) => {
    if (e.target.value === "custom") {
        gridCustomElement.style.display = "inline-block";
        handleSizeChange(+gridCustomElement.value);
    } else {
        gridCustomElement.style.display = "none";
        handleSizeChange(+e.target.value);
    }
});

gridCustomElement.addEventListener("input", (e) => {
    let val = +e.target.value;
    if (val < 2) val = 2;
    if (val > 12) val = 12;
    handleSizeChange(val);
});

function handleSizeChange(size) {
    if (state.isActive && state.analytics && state.analytics.moves > 0) {
        if (!confirm("Are you sure you want to change board size and reset the active match?")) {
            // Revert UI to match actual size
            if (boardSize === 3 || boardSize === 5 || boardSize === 8) {
                gridPresetElement.value = boardSize;
                gridCustomElement.style.display = "none";
            } else {
                gridPresetElement.value = "custom";
                gridCustomElement.style.display = "inline-block";
                gridCustomElement.value = boardSize;
            }
            return;
        }
    }
    boardSize = size;
    updateGridValue(size);
    if (state.isActive) {
        startGame();
    }
}

const createBoard = size =>
    Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({
            owner: null,
            dots: 0
        }))
    );

function getCapacity(row, col) {
    const last = boardSize - 1;
    const edges = (row === 0) + (row === last) + (col === 0) + (col === last);
    return edges === 2 ? 2 : edges === 1 ? 3 : 4;
}

function renderBoard() {
    boardElement.innerHTML = "";
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const data = state.board[row][col];

            const cell = document.createElement("button");
            cell.className = `cell ${data.owner || ""}`;
            cell.textContent = data.dots || "";
            cell.onclick = () => addDot(row, col);

            boardElement.appendChild(cell);
        }
    }
}

function addDot(row, col) {
    if (!state.isActive) return;
    
    const player = state.players[state.currentPlayer];
    const cell = state.board[row][col];

    if (cell.owner && cell.owner !== player) return;

    // Analytics: Record move
    state.analytics.moves++;
    const moveDuration = Date.now() - state.lastMoveTime;
    state.analytics.moveTimes[player].push(moveDuration);
    state.lastMoveTime = Date.now();

    cell.owner = player;
    cell.dots++;

    resolveBoard();
    
    if (state.isActive) {
        checkGameOver();
    }
    
    if (state.isActive) {
        nextTurn();
    }
    render();
}

function resolveBoard() {
    let changed = true;

    while (changed) {
        changed = false;

        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = state.board[row][col];

                if (cell.dots >= getCapacity(row, col)) {
                    explode(row, col, cell.owner);
                    changed = true;
                }
            }
        }
    }
}

function explode(row, col, owner) {
    state.board[row][col] = {
        owner: null,
        dots: 0
    };
    
    state.analytics.totalExplosions++; // Analytics

    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr < 0 || nc < 0 || nr >= boardSize || nc >= boardSize) continue;
        
        const neighbor = state.board[nr][nc];
        
        if (neighbor.owner !== owner && neighbor.owner !== null) {
            state.analytics.captures[owner]++;
        }

        neighbor.owner = owner;
        neighbor.dots++;
    }
}

function checkGameOver() {
    // Only check if everyone has had at least one turn
    if (state.analytics.moves <= state.players.length) return;
    
    const activePlayers = new Set();
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (state.board[row][col].owner) {
                activePlayers.add(state.board[row][col].owner);
            }
        }
    }
    
    if (activePlayers.size <= 1) {
        state.isActive = false;
        state.winner = activePlayers.size === 1 ? Array.from(activePlayers)[0] : 'draw';
        saveMatchHistory();
        renderAnalytics();
    }
}

function nextTurn() {
    let next = (state.currentPlayer + 1) % state.players.length;
    
    if (state.analytics.moves >= state.players.length) {
        let loopProtect = 0;
        while (!hasPieces(state.players[next]) && loopProtect < state.players.length) {
            next = (next + 1) % state.players.length;
            loopProtect++;
        }
    }
    
    state.currentPlayer = next;
}

function hasPieces(player) {
    return state.board.flat().some(cell => cell.owner === player);
}

function renderStats() {
    playerStatsElement.innerHTML = "";

    state.players.forEach(player => {
        const count = state.board.flat().filter(cell => cell.owner === player).length;

        const div = document.createElement("div");
        div.className = `player-card ${player}`;
        
        if (!state.isActive && state.winner === player) {
            div.textContent = `👑 ${player.toUpperCase()} : ${count}`;
        } else {
            div.textContent = `${player.toUpperCase()} : ${count}`;
        }

        playerStatsElement.appendChild(div);
    });
}

function render() {
    if (state.isActive) {
        currentPlayerElement.textContent = state.players[state.currentPlayer];
    } else {
        currentPlayerElement.textContent = state.winner === 'draw' ? 'Draw!' : `${state.winner.toUpperCase()} Wins!`;
    }

    renderBoard();
    renderStats();
}

function startGame() {
    const count = +playerCountElement.value;
    const players = COLORS.slice(0, count);
    
    let moveTimes = {};
    let captures = {};
    players.forEach(p => {
        moveTimes[p] = [];
        captures[p] = 0;
    });

    state = {
        isActive: true,
        winner: null,
        currentPlayer: 0,
        players: players,
        board: createBoard(boardSize),
        lastMoveTime: Date.now(),
        analytics: {
            moves: 0,
            moveTimes: moveTimes,
            totalExplosions: 0,
            captures: captures,
            gridSize: `${boardSize}x${boardSize}`
        }
    };
    
    // Set UI dropdown correctly
    if (boardSize === 3 || boardSize === 5 || boardSize === 8) {
        gridPresetElement.value = boardSize;
        gridCustomElement.style.display = "none";
    } else {
        gridPresetElement.value = "custom";
        gridCustomElement.style.display = "inline-block";
        gridCustomElement.value = boardSize;
    }
    updateGridValue(boardSize);

    render();
}

function saveMatchHistory() {
    const pCount = state.players.length;
    const historyEntry = {
        date: new Date().toLocaleString(),
        gridSize: state.analytics.gridSize,
        players: pCount,
        winner: state.winner,
        moves: state.analytics.moves,
        explosions: state.analytics.totalExplosions,
        stats: {}
    };
    
    state.players.forEach(p => {
        const times = state.analytics.moveTimes[p];
        const avgTime = times.length ? (times.reduce((a,b)=>a+b,0) / times.length / 1000).toFixed(1) : 0;
        
        historyEntry.stats[p] = {
            captures: state.analytics.captures[p],
            avgMoveTime: avgTime
        };
    });
    
    matchHistory.unshift(historyEntry); // Add to beginning
    if (matchHistory.length > 10) matchHistory.pop(); // Keep last 10
    
    localStorage.setItem('dotGameHistory', JSON.stringify(matchHistory));
}

function renderAnalytics() {
    if (matchHistory.length === 0) {
        analyticsContainer.innerHTML = '<p class="empty-state">No completed games yet.</p>';
        return;
    }
    
    analyticsContainer.innerHTML = '';
    
    matchHistory.forEach((match, idx) => {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        
        card.innerHTML = `
            <h3>Match on ${match.date} (${match.gridSize})</h3>
            <div class="stats-grid">
                <div class="stat-item"><span class="stat-label">Winner</span><span class="stat-val" style="color: ${match.winner === 'draw' ? 'inherit' : match.winner}">${match.winner}</span></div>
                <div class="stat-item"><span class="stat-label">Total Moves</span><span class="stat-val">${match.moves}</span></div>
                <div class="stat-item"><span class="stat-label">Total Explosions</span><span class="stat-val">${match.explosions}</span></div>
            </div>
            <h4>Captures per Player</h4>
        `;
        
        const chartCont = document.createElement('div');
        let maxCap = 0;
        for (const p in match.stats) {
            if (match.stats[p].captures > maxCap) maxCap = match.stats[p].captures;
        }
        
        for (const p in match.stats) {
            const data = match.stats[p];
            const pct = maxCap > 0 ? (data.captures / maxCap) * 100 : 0;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.innerHTML = `
                <div class="chart-label" style="color: ${p}">${p}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${pct}%; background-color: ${p}"></div>
                </div>
                <div class="chart-value">${data.captures}</div>
            `;
            chartCont.appendChild(bar);
        }
        
        card.appendChild(chartCont);
        
        const timeHeader = document.createElement('h4');
        timeHeader.textContent = "Avg Move Time (s)";
        card.appendChild(timeHeader);
        
        const timeCont = document.createElement('div');
        let maxTime = 0;
        for (const p in match.stats) {
            if (parseFloat(match.stats[p].avgMoveTime) > maxTime) maxTime = parseFloat(match.stats[p].avgMoveTime);
        }
        
        for (const p in match.stats) {
            const data = match.stats[p];
            const pct = maxTime > 0 ? (data.avgMoveTime / maxTime) * 100 : 0;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.innerHTML = `
                <div class="chart-label" style="color: ${p}">${p}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${pct}%; background-color: ${p}"></div>
                </div>
                <div class="chart-value">${data.avgMoveTime}s</div>
            `;
            timeCont.appendChild(bar);
        }
        
        card.appendChild(timeCont);
        
        analyticsContainer.appendChild(card);
    });
}

document.getElementById("newGame").addEventListener("click", () => {
    if (state.isActive && state.analytics && state.analytics.moves > 0) {
        if (!confirm("Are you sure you want to start a new game?")) return;
    }
    startGame();
});

renderAnalytics();
startGame();
