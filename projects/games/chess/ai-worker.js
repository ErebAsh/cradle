importScripts('chessLogic.js');

const PIECE_VALUES = {
    pawn: 10,
    knight: 30,
    bishop: 30,
    rook: 50,
    queen: 90,
    king: 9000
};

// Basic piece-square tables (PST) to encourage central control.
// The tables are defined from White's perspective. We mirror them for Black.
const pstCenter = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  1,  2,  2,  1,  0,  0],
    [ 0,  0,  2,  3,  3,  2,  0,  0],
    [ 0,  0,  2,  3,  3,  2,  0,  0],
    [ 0,  0,  1,  2,  2,  1,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
];

function evaluateBoard(board, color) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                let val = PIECE_VALUES[piece.type];
                
                // Add center bonus for non-king pieces
                if (piece.type !== 'king' && piece.type !== 'rook') {
                    const pstRow = piece.color === WHITE ? r : 7 - r;
                    val += pstCenter[pstRow][c];
                }

                if (piece.color === color) {
                    score += val;
                } else {
                    score -= val;
                }
            }
        }
    }
    return score;
}

function minimax(board, depth, alpha, beta, isMaximizing, color) {
    if (depth === 0) {
        return evaluateBoard(board, color);
    }

    const turnColor = isMaximizing ? color : other(color);
    const moves = getAllLegalMoves(board, turnColor, null);

    if (moves.length === 0) {
        const king = findKing(board, turnColor);
        if (king && isSquareAttacked(board, king.row, king.col, other(turnColor))) {
            return isMaximizing ? -Infinity : Infinity;
        }
        return 0; // Stalemate
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const copy = cloneBoard(board);
            applyMove(copy, move);
            const ev = minimax(copy, depth - 1, alpha, beta, false, color);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const copy = cloneBoard(board);
            applyMove(copy, move);
            const ev = minimax(copy, depth - 1, alpha, beta, true, color);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

onmessage = function(e) {
    const { board, color, depth, enPassantTarget } = e.data;
    const moves = getAllLegalMoves(board, color, enPassantTarget);
    
    if (moves.length === 0) {
        postMessage(null);
        return;
    }

    let bestMove = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    // Randomize moves slightly so it doesn't always pick the same one for equal scores
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        const copy = cloneBoard(board);
        applyMove(copy, move);
        const boardValue = minimax(copy, depth - 1, alpha, beta, false, color);
        
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
        alpha = Math.max(alpha, boardValue);
    }

    postMessage(bestMove);
}
