const test = require('node:test');
const assert = require('node:assert/strict');
const {
    WHITE,
    BLACK,
    createPiece,
    startPosition,
    cloneBoard,
    getLegalMoves,
    getAllLegalMoves,
    applyMove,
    findKing,
    isSquareAttacked
} = require('../projects/games/chess/chessLogic');

test('starts with a standard chess layout', () => {
    const board = startPosition();
    assert.equal(board.length, 8);
    assert.equal(board[0].length, 8);
    
    // Check black pieces on rank 0
    assert.equal(board[0][0].type, 'rook');
    assert.equal(board[0][0].color, BLACK);
    assert.equal(board[0][4].type, 'king');
    assert.equal(board[0][4].color, BLACK);
    
    // Check white pieces on rank 7
    assert.equal(board[7][4].type, 'king');
    assert.equal(board[7][4].color, WHITE);
});

test('detects king position', () => {
    const board = startPosition();
    const whiteKing = findKing(board, WHITE);
    assert.deepStrictEqual(whiteKing, { row: 7, col: 4 });
    const blackKing = findKing(board, BLACK);
    assert.deepStrictEqual(blackKing, { row: 0, col: 4 });
});

test('pawn has two legal moves at starting rank and one after moving', () => {
    const board = startPosition();
    // White pawn at (6, 4) i.e. e2
    const moves = getLegalMoves(board, 6, 4, WHITE, null);
    assert.equal(moves.length, 2); // e3, e4
    
    // Make move e2e3
    const move = moves.find(m => m.to.row === 5 && m.to.col === 4);
    assert.ok(move);
    
    applyMove(board, move);
    // Pawn at e3 should only have 1 move forward (e4) if path is clear
    const newMoves = getLegalMoves(board, 5, 4, WHITE, null);
    assert.equal(newMoves.length, 1);
});

test('detects checkmate scenario', () => {
    // Create an empty board
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][4] = createPiece('king', BLACK);
    board[7][4] = createPiece('king', WHITE);
    
    // Black king at (0,0). Covered by White Queen at (0,1). White King at (1,2) protecting the Queen.
    const customBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
    customBoard[0][0] = createPiece('king', BLACK);
    customBoard[0][1] = createPiece('queen', WHITE);
    customBoard[1][2] = createPiece('king', WHITE);
    
    const kingPos = findKing(customBoard, BLACK);
    const inCheck = isSquareAttacked(customBoard, kingPos.row, kingPos.col, WHITE);
    assert.equal(inCheck, true);
    
    const blackMoves = getAllLegalMoves(customBoard, BLACK, null);
    assert.equal(blackMoves.length, 0); // Checkmate!
});
