const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const turnLabel = document.getElementById("turnLabel");
const moveList = document.getElementById("moveList");
const moveCount = document.getElementById("moveCount");
const whiteCaptures = document.getElementById("whiteCaptures");
const blackCaptures = document.getElementById("blackCaptures");


const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const SYMBOLS = {
    white: { king: "&#9812;", queen: "&#9813;", rook: "&#9814;", bishop: "&#9815;", knight: "&#9816;", pawn: "&#9817;" },
    black: { king: "&#9818;", queen: "&#9819;", rook: "&#9820;", bishop: "&#9821;", knight: "&#9822;", pawn: "&#9823;" }
};
const PIECE_LETTER = { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N", pawn: "" };

let board = [];
let turn = WHITE;
let selected = null;
let legalTargets = [];
let history = [];
let capturedByWhite = [];
let capturedByBlack = [];
let flipped = false;
let gameOver = false;
let enPassantTarget = null;
let aiWorker = null;
let isComputerThinking = false;



function squareName(row, col) {
    return `${FILES[col]}${8 - row}`;
}

function orderedSquares() {
    const squares = [];
    const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    rows.forEach(row => cols.forEach(col => squares.push({ row, col })));
    return squares;
}

function render() {
    boardElement.innerHTML = "";
    const legalKeys = new Set(legalTargets.map(move => `${move.to.row},${move.to.col}`));
    const captureKeys = new Set(legalTargets.filter(move => move.capture || move.enPassant).map(move => `${move.to.row},${move.to.col}`));
    const checkedKing = findKing(board, turn);
    const turnInCheck = checkedKing && isSquareAttacked(board, checkedKing.row, checkedKing.col, other(turn));

    orderedSquares().forEach(({ row, col }) => {
        const square = document.createElement("button");
        const piece = board[row][col];
        square.type = "button";
        square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.setAttribute("role", "gridcell");
        square.setAttribute("aria-label", squareName(row, col));

        if (selected && selected.row === row && selected.col === col) square.classList.add("selected");
        if (legalKeys.has(`${row},${col}`)) square.classList.add("legal");
        if (captureKeys.has(`${row},${col}`)) square.classList.add("capture");
        if (turnInCheck && checkedKing.row === row && checkedKing.col === col) square.classList.add("check");

        if (piece) {
            const pieceNode = document.createElement("span");
            pieceNode.className = `piece ${piece.color}`;
            pieceNode.innerHTML = SYMBOLS[piece.color][piece.type];
            square.appendChild(pieceNode);
        }

        square.addEventListener("click", () => handleSquareClick(row, col));
        boardElement.appendChild(square);
    });

    updatePanels();
}

function updatePanels() {
    turnLabel.textContent = turn === WHITE ? "White" : "Black";
    whiteCaptures.innerHTML = capturedByWhite.length ? capturedByWhite.map(piece => SYMBOLS[piece.color][piece.type]).join(" ") : "None";
    blackCaptures.innerHTML = capturedByBlack.length ? capturedByBlack.map(piece => SYMBOLS[piece.color][piece.type]).join(" ") : "None";
    moveCount.textContent = history.length;
    moveList.innerHTML = history.map((entry, index) => `<li>${index + 1}. ${entry.notation}</li>`).join("");
}

function handleSquareClick(row, col) {
    if (gameOver || isComputerThinking) return;
    const piece = board[row][col];

    if (selected) {
        const chosenMove = legalTargets.find(move => move.to.row === row && move.to.col === col);
        if (chosenMove) {
            makeMove(chosenMove);
            return;
        }
    }

    if (piece && piece.color === turn) {
        selected = { row, col };
        legalTargets = getLegalMoves(board, row, col, turn, enPassantTarget);
        setStatus(`${capitalize(turn)} selected ${piece.type} on ${squareName(row, col)}.`);
    } else {
        selected = null;
        legalTargets = [];
        setStatus(`${capitalize(turn)} to move.`);
    }

    render();
}

function makeMove(move) {
    const previous = {
        board: cloneBoard(board),
        turn,
        capturedByWhite: capturedByWhite.map(piece => ({ ...piece })),
        capturedByBlack: capturedByBlack.map(piece => ({ ...piece })),
        enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        notation: buildNotation(move)
    };

    const movingPiece = board[move.from.row][move.from.col];
    const captured = move.enPassant
        ? board[move.from.row][move.to.col]
        : board[move.to.row][move.to.col];

    applyMove(board, move);

    if (captured) {
        (movingPiece.color === WHITE ? capturedByWhite : capturedByBlack).push(captured);
    }

    enPassantTarget = null;
    if (movingPiece.type === "pawn" && Math.abs(move.to.row - move.from.row) === 2) {
        enPassantTarget = {
            row: (move.from.row + move.to.row) / 2,
            col: move.from.col,
            pawnRow: move.to.row,
            pawnCol: move.to.col
        };
    }

    if (movingPiece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
        board[move.to.row][move.to.col].type = "queen";
        previous.notation += "=Q";
    }

    turn = other(turn);
    selected = null;
    legalTargets = [];
    previous.notation += stateSuffix();
    history.push(previous);
    updateGameState();
    render();
}

function buildNotation(move) {
    const piece = board[move.from.row][move.from.col];
    if (move.castle) return move.to.col === 6 ? "O-O" : "O-O-O";

    const capture = move.capture || move.enPassant ? "x" : "";
    const prefix = piece.type === "pawn" && capture ? FILES[move.from.col] : PIECE_LETTER[piece.type];
    return `${prefix}${capture}${squareName(move.to.row, move.to.col)}`;
}

function stateSuffix() {
    const king = findKing(board, turn);
    if (!king || !isSquareAttacked(board, king.row, king.col, other(turn))) return "";
    return getAllLegalMoves(board, turn, enPassantTarget).length ? "+" : "#";
}

function updateGameState() {
    const king = findKing(board, turn);
    const inCheck = king && isSquareAttacked(board, king.row, king.col, other(turn));
    const moves = getAllLegalMoves(board, turn, enPassantTarget);

    if (!moves.length && inCheck) {
        gameOver = true;
        setStatus(`Checkmate. ${capitalize(other(turn))} wins.`);
        return;
    }

    if (!moves.length) {
        gameOver = true;
        setStatus("Stalemate. The game is drawn.");
        return;
    }

    setStatus(inCheck ? `${capitalize(turn)} is in check.` : `${capitalize(turn)} to move.`);
    checkTriggerAI();
}

function checkTriggerAI() {
    const mode = document.getElementById("gameMode").value;
    if (mode === "computer" && turn === BLACK && !gameOver) {
        triggerAI();
    }
}

function triggerAI() {
    isComputerThinking = true;
    const currentStatus = statusElement.textContent;
    setStatus(currentStatus + " Computer is thinking...");
    
    if (aiWorker) {
        aiWorker.terminate();
    }
    
    aiWorker = new Worker('aiWorker.js');
    aiWorker.onmessage = function(e) {
        isComputerThinking = false;
        const bestMove = e.data;
        if (bestMove) {
            makeMove(bestMove);
        }
    };
    
    const depth = parseInt(document.getElementById("aiDifficulty").value, 10);
    aiWorker.postMessage({
        board: board,
        color: turn,
        depth: depth,
        enPassantTarget: enPassantTarget
    });
}

function cancelAI() {
    if (aiWorker) {
        aiWorker.terminate();
        aiWorker = null;
    }
    isComputerThinking = false;
}



function undoMove() {
    cancelAI();
    const previous = history.pop();
    if (!previous) {
        setStatus("No moves to undo.");
        return;
    }

    board = cloneBoard(previous.board);
    turn = previous.turn;
    capturedByWhite = previous.capturedByWhite.map(piece => ({ ...piece }));
    capturedByBlack = previous.capturedByBlack.map(piece => ({ ...piece }));
    enPassantTarget = previous.enPassantTarget ? { ...previous.enPassantTarget } : null;
    selected = null;
    legalTargets = [];
    gameOver = false;
    setStatus(`${capitalize(turn)} to move.`);
    render();
    checkTriggerAI();
}

function setStatus(text) {
    statusElement.textContent = text;
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function newGame() {
    cancelAI();
    board = startPosition();
    turn = WHITE;
    selected = null;
    legalTargets = [];
    history = [];
    capturedByWhite = [];
    capturedByBlack = [];
    enPassantTarget = null;
    gameOver = false;
    setStatus("White to move.");
    render();
    checkTriggerAI();
}

document.getElementById("newGame").addEventListener("click", newGame);
document.getElementById("undoMove").addEventListener("click", undoMove);
document.getElementById("flipBoard").addEventListener("click", () => {
    flipped = !flipped;
    render();
});
document.getElementById("gameMode").addEventListener("change", (e) => {
    const aiDiff = document.getElementById("aiDifficulty");
    if (e.target.value === "computer") {
        aiDiff.classList.remove("hidden");
    } else {
        aiDiff.classList.add("hidden");
    }
    checkTriggerAI();
});

newGame();
document.getElementById("backHome").addEventListener("click", () => {
    window.location.href = "/";
});
