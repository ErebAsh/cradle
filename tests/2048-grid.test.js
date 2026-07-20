const test = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, moveGameState, canMove } = require('../projects/games/2048-game/logic');
const { saveBestScore, getBestScore } = require('../projects/games/2048-game/storage');

global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = String(value);
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    }
};

test('creates custom grid sizes correctly', () => {
    const state3x3 = createInitialState(3, () => 0.1);
    assert.equal(state3x3.board.length, 3);
    assert.equal(state3x3.board[0].length, 3);
    assert.equal(state3x3.size, 3);

    const state5x5 = createInitialState(5, () => 0.1);
    assert.equal(state5x5.board.length, 5);
    assert.equal(state5x5.board[0].length, 5);
    assert.equal(state5x5.size, 5);
});

test('moveGameState merges correctly in 5x5 board', () => {
    const state = {
        board: [
            [2, 2, 2, 2, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        score: 0,
        bestScore: 0,
        won: false,
        over: false,
        size: 5
    };

    const next = moveGameState(state, 'left', () => 0.5);
    // [2, 2, 2, 2, 0] left merge -> [4, 4, 0, 0, 0] plus a new tile placed randomly (which will be 2 or 4 in the empty cells)
    assert.equal(next.board[0][0], 4);
    assert.equal(next.board[0][1], 4);
    assert.equal(next.score, 8);
});

test('best score is preserved per grid size', () => {
    localStorage.clear();
    saveBestScore(3, 500);
    saveBestScore(5, 1200);

    assert.equal(getBestScore(3), 500);
    assert.equal(getBestScore(5), 1200);

    // Save worse score - should not change
    saveBestScore(3, 400);
    assert.equal(getBestScore(3), 500);

    // Save better score - should change
    saveBestScore(3, 800);
    assert.equal(getBestScore(3), 800);
});
