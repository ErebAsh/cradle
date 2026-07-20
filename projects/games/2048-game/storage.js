const STATE_KEY_PREFIX = "2048_game_state_";
const BEST_KEY_PREFIX = "2048_best_score_";

function saveGameState(size, state) {
    if (!size) return;
    localStorage.setItem(STATE_KEY_PREFIX + size, JSON.stringify(state));
}

function loadGameState(size) {
    if (!size) return null;
    const item = localStorage.getItem(STATE_KEY_PREFIX + size);
    return item ? JSON.parse(item) : null;
}

function clearGameState(size) {
    if (!size) return;
    localStorage.removeItem(STATE_KEY_PREFIX + size);
}

function saveBestScore(size, score) {
    if (!size) return;
    const currentBest = getBestScore(size);
    if (score > currentBest) {
        localStorage.setItem(BEST_KEY_PREFIX + size, score);
        return true;
    }
    return false;
}

function getBestScore(size) {
    if (!size) return 0;
    const val = localStorage.getItem(BEST_KEY_PREFIX + size);
    return val ? parseInt(val, 10) : 0;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveGameState,
        loadGameState,
        clearGameState,
        saveBestScore,
        getBestScore
    };
}
