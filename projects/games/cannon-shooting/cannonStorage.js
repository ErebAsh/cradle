// Cannon Storage System for persisting high scores and defense streaks

const STORAGE_KEY = 'cannonShootingStats';

function getInitialStats() {
    return {
        highScore: 0,
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalHits: 0,
        totalShots: 0
    };
}

function loadStats() {
    if (typeof localStorage === 'undefined') return getInitialStats();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getInitialStats();
        return { ...getInitialStats(), ...JSON.parse(raw) };
    } catch (e) {
        console.error('Failed to load cannon stats from localStorage:', e);
        return getInitialStats();
    }
}

function saveStats(stats) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save cannon stats to localStorage:', e);
    }
}

function recordShot(stats, isHit, scoreAwarded = 0, newStreak = 0) {
    const updated = { ...stats };
    updated.totalShots += 1;

    if (isHit) {
        updated.totalHits += 1;
        updated.score += scoreAwarded;
        updated.currentStreak = newStreak;
        if (updated.score > updated.highScore) {
            updated.highScore = updated.score;
        }
        if (updated.currentStreak > updated.bestStreak) {
            updated.bestStreak = updated.currentStreak;
        }
    } else {
        updated.currentStreak = 0;
    }

    saveStats(updated);
    return updated;
}

function resetStats() {
    const fresh = getInitialStats();
    saveStats(fresh);
    return fresh;
}

const CannonStorage = {
    STORAGE_KEY,
    getInitialStats,
    loadStats,
    saveStats,
    recordShot,
    resetStats
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CannonStorage;
} else if (typeof window !== 'undefined') {
    window.CannonStorage = CannonStorage;
}
