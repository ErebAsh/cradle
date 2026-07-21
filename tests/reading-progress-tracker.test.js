const test   = require('node:test');
const assert = require('node:assert/strict');
const {
    calculateBookProgress,
    estimateCompletionDate,
    calculateReadingStreak,
    calculateReadingStats,
    exportTrackerData,
    importTrackerData
} = require('../projects/productivity/reading-progress-tracker/tracker-logic');

// ─── calculateBookProgress ────────────────────────────────────────────────────

test('calculateBookProgress returns 0% for a new book', () => {
    const book = { id: '1', totalPages: 300, currentPage: 0 };
    const r = calculateBookProgress(book);
    assert.equal(r.percentage, 0);
    assert.equal(r.remainingPages, 300);
    assert.equal(r.isCompleted, false);
});

test('calculateBookProgress returns correct percentage mid-book', () => {
    const book = { id: '1', totalPages: 200, currentPage: 100 };
    const r = calculateBookProgress(book);
    assert.equal(r.percentage, 50);
    assert.equal(r.remainingPages, 100);
    assert.equal(r.isCompleted, false);
});

test('calculateBookProgress marks completed when currentPage >= totalPages', () => {
    const book = { id: '1', totalPages: 400, currentPage: 400 };
    const r = calculateBookProgress(book);
    assert.equal(r.percentage, 100);
    assert.equal(r.remainingPages, 0);
    assert.equal(r.isCompleted, true);
});

test('calculateBookProgress clamps currentPage over totalPages', () => {
    const book = { id: '1', totalPages: 100, currentPage: 150 };
    const r = calculateBookProgress(book);
    assert.equal(r.percentage, 100);
    assert.equal(r.isCompleted, true);
});

test('calculateBookProgress handles null/undefined gracefully', () => {
    const r = calculateBookProgress(null);
    assert.equal(r.percentage, 0);
    assert.equal(r.remainingPages, 0);
    assert.equal(r.isCompleted, false);
});

// ─── calculateReadingStreak ───────────────────────────────────────────────────

test('calculateReadingStreak returns 0 for empty sessions', () => {
    const r = calculateReadingStreak([]);
    assert.equal(r.currentStreak, 0);
    assert.equal(r.longestStreak, 0);
});

test('calculateReadingStreak detects single-session streak', () => {
    const today = new Date().toISOString().split('T')[0];
    const r = calculateReadingStreak([{ date: today }]);
    assert.equal(r.currentStreak, 1);
    assert.equal(r.longestStreak, 1);
});

test('calculateReadingStreak calculates longest streak correctly', () => {
    // 3 consecutive days followed by a gap
    const sessions = [
        { date: '2025-01-01' },
        { date: '2025-01-02' },
        { date: '2025-01-03' },
        { date: '2025-01-05' }, // gap
        { date: '2025-01-06' },
    ];
    const r = calculateReadingStreak(sessions);
    assert.equal(r.longestStreak, 3);
});

test('calculateReadingStreak deduplicates multiple sessions on the same day', () => {
    const sessions = [
        { date: '2025-03-10' },
        { date: '2025-03-10' }, // duplicate
        { date: '2025-03-11' },
    ];
    const r = calculateReadingStreak(sessions);
    assert.equal(r.longestStreak, 2);
});

// ─── calculateReadingStats ────────────────────────────────────────────────────

test('calculateReadingStats handles empty inputs', () => {
    const r = calculateReadingStats([], []);
    assert.equal(r.totalBooks, 0);
    assert.equal(r.completedBooks, 0);
    assert.equal(r.totalPagesRead, 0);
    assert.equal(r.totalHours, 0);
});

test('calculateReadingStats aggregates books correctly', () => {
    const books = [
        { id: '1', status: 'completed', genre: 'Fiction',     totalPages: 300, currentPage: 300 },
        { id: '2', status: 'reading',   genre: 'Technology',  totalPages: 400, currentPage: 150 },
        { id: '3', status: 'want-to-read', genre: 'Fiction',  totalPages: 200, currentPage: 0 },
    ];
    const r = calculateReadingStats(books, []);
    assert.equal(r.totalBooks, 3);
    assert.equal(r.completedBooks, 1);
    assert.equal(r.currentlyReading, 1);
    assert.equal(r.wantToRead, 1);
    assert.equal(r.genreBreakdown['Fiction'], 2);
    assert.equal(r.genreBreakdown['Technology'], 1);
});

test('calculateReadingStats aggregates session pages and minutes', () => {
    const sessions = [
        { bookId: '1', date: '2025-06-01', pagesRead: 30, durationMinutes: 60 },
        { bookId: '1', date: '2025-06-02', pagesRead: 25, durationMinutes: 45 },
        { bookId: '2', date: '2025-06-03', pagesRead: 40, durationMinutes: 90 },
    ];
    const r = calculateReadingStats([], sessions);
    assert.equal(r.totalPagesRead, 95);
    assert.equal(r.totalReadingMinutes, 195);
    assert.equal(r.totalHours, parseFloat((195 / 60).toFixed(1)));
});

test('calculateReadingStats builds monthly pages breakdown', () => {
    const sessions = [
        { bookId: '1', date: '2025-06-10', pagesRead: 20, durationMinutes: 30 },
        { bookId: '1', date: '2025-06-15', pagesRead: 30, durationMinutes: 40 },
        { bookId: '1', date: '2025-07-01', pagesRead: 50, durationMinutes: 60 },
    ];
    const r = calculateReadingStats([], sessions);
    assert.equal(r.monthlyPages['2025-06'], 50);
    assert.equal(r.monthlyPages['2025-07'], 50);
});

// ─── estimateCompletionDate ───────────────────────────────────────────────────

test('estimateCompletionDate returns completed status for finished book', () => {
    const book = { id: '1', totalPages: 200, currentPage: 200 };
    const r = estimateCompletionDate(book, []);
    assert.equal(r.status, 'completed');
    assert.equal(r.daysRemaining, 0);
});

test('estimateCompletionDate uses default velocity when no sessions', () => {
    const book = { id: '1', totalPages: 500, currentPage: 0 };
    const r = estimateCompletionDate(book, [], 50); // 50 pages/day default
    assert.equal(r.status, 'in-progress');
    assert.equal(r.daysRemaining, 10); // 500 / 50 = 10
    assert.ok(r.estimatedDate, 'Should produce an estimated date string');
});

// ─── exportTrackerData / importTrackerData ────────────────────────────────────

test('exportTrackerData produces valid JSON with version', () => {
    const books    = [{ id: '1', title: 'Test Book' }];
    const sessions = [{ id: 's1', bookId: '1' }];
    const json = exportTrackerData(books, sessions);
    const parsed = JSON.parse(json);
    assert.equal(parsed.version, '1.0');
    assert.equal(parsed.books.length, 1);
    assert.equal(parsed.sessions.length, 1);
});

test('importTrackerData round-trips export correctly', () => {
    const books    = [{ id: '2', title: 'Round Trip' }];
    const sessions = [{ id: 's2', bookId: '2', pagesRead: 40 }];
    const json = exportTrackerData(books, sessions);
    const result = importTrackerData(json);
    assert.equal(result.books.length, 1);
    assert.equal(result.books[0].title, 'Round Trip');
    assert.equal(result.sessions[0].pagesRead, 40);
});

test('importTrackerData throws on invalid JSON', () => {
    assert.throws(() => importTrackerData('not valid json'), /Import failed/);
});
