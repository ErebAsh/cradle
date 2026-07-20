const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateStats, exportToCSV, parseCSV } = require('../projects/productivity/attendance-tracker/data-handler');

test('calculateStats aggregates correctly', () => {
    const subjects = [
        { name: "Maths", total: 40, p: 20, a: 5, target: 75 },
        { name: "Physics", total: 30, p: 15, a: 5, target: 80 }
    ];

    const stats = calculateStats(subjects);
    assert.equal(stats.totalConducted, 45);
    assert.equal(stats.totalPresent, 35);
    assert.equal(stats.overallPercentage, 77.8);
    // Maths is 20/25 = 80% (>= 75% target)
    // Physics is 15/20 = 75% (< 80% target)
    assert.equal(stats.belowTargetCount, 1);
});

test('calculateStats handles empty array', () => {
    const stats = calculateStats([]);
    assert.equal(stats.totalConducted, 0);
    assert.equal(stats.totalPresent, 0);
    assert.equal(stats.overallPercentage, 0);
    assert.equal(stats.belowTargetCount, 0);
});

test('exportToCSV generates valid CSV output', () => {
    const subjects = [
        { name: "Chemistry", total: 50, p: 30, a: 10, target: 75 }
    ];

    const csv = exportToCSV(subjects);
    const expectedHeaders = "Subject,Total Classes,Present,Absent,Target";
    const expectedRow = `"Chemistry",50,30,10,75`;
    assert.ok(csv.includes(expectedHeaders));
    assert.ok(csv.includes(expectedRow));
});

test('parseCSV reads CSV correctly', () => {
    const csv = `Subject,Total Classes,Present,Absent,Target\n"English",45,35,5,80\n"CS",30,28,0,85`;
    const subjects = parseCSV(csv);
    assert.equal(subjects.length, 2);
    
    assert.equal(subjects[0].name, "English");
    assert.equal(subjects[0].total, 45);
    assert.equal(subjects[0].p, 35);
    assert.equal(subjects[0].a, 5);
    assert.equal(subjects[0].target, 80);

    assert.equal(subjects[1].name, "CS");
    assert.equal(subjects[1].total, 30);
    assert.equal(subjects[1].p, 28);
    assert.equal(subjects[1].a, 0);
    assert.equal(subjects[1].target, 85);
});
