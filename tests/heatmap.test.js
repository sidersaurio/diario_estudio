// Tests for heatmap pure functions
// Run with: node --test

const { test } = require('node:test');
const assert = require('node:assert');

// Import the functions - we'll need to make them available
// For now, we'll define them inline and later move to app.js

// ===== Pure functions (will be moved to app.js) =====

function getIntensityLevel(minutes) {
    if (minutes <= 0) return 0;
    if (minutes < 60) return 1;
    if (minutes < 120) return 2;
    if (minutes < 180) return 3;
    return 4;
}

function getDailyMinutes(sessions) {
    const daily = new Map();
    for (const s of sessions) {
        // Validate session
        if (!s || typeof s.date !== 'string' || typeof s.minutes !== 'number') continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) continue;
        if (s.minutes < 1) continue;
        
        const current = daily.get(s.date) || 0;
        daily.set(s.date, current + s.minutes);
    }
    return daily;
}

function getMondayOfWeek(dateISO) {
    // Returns the Monday (YYYY-MM-DD) of the week containing dateISO
    const d = new Date(dateISO + 'T00:00:00');
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = (day + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diffToMonday);
    return d.toISOString().split('T')[0];
}

function getHeatMapData(sessions, todayISO, weeksBack = 52) {
    const dailyMinutes = getDailyMinutes(sessions);
    
    // Find the Monday of the week containing today
    const todayMonday = getMondayOfWeek(todayISO);
    
    // Build 52 weeks x 7 days matrix
    // weeks[0] = current week (most recent, bottom in GitHub view)
    // weeks[51] = 52 weeks ago (top in GitHub view)
    const weeks = [];
    
    for (let w = 0; w < weeksBack; w++) {
        const week = [];
        const monday = new Date(todayMonday + 'T00:00:00');
        monday.setDate(monday.getDate() - w * 7);
        
        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(monday);
            cellDate.setDate(monday.getDate() + d);
            const cellISO = cellDate.toISOString().split('T')[0];
            
            const minutes = dailyMinutes.get(cellISO) || 0;
            const isFuture = cellISO > todayISO;
            const level = isFuture ? 0 : getIntensityLevel(minutes);
            
            week.push({
                date: cellISO,
                minutes,
                level,
                isFuture
            });
        }
        weeks.push(week);
    }
    
    return { weeks, startDate: todayMonday };
}

function formatTooltipDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
}

// ===== Tests =====

test('getIntensityLevel: thresholds', () => {
    assert.strictEqual(getIntensityLevel(0), 0);
    assert.strictEqual(getIntensityLevel(-5), 0);
    assert.strictEqual(getIntensityLevel(1), 1);
    assert.strictEqual(getIntensityLevel(30), 1);
    assert.strictEqual(getIntensityLevel(59), 1);
    assert.strictEqual(getIntensityLevel(60), 2);
    assert.strictEqual(getIntensityLevel(90), 2);
    assert.strictEqual(getIntensityLevel(119), 2);
    assert.strictEqual(getIntensityLevel(120), 3);
    assert.strictEqual(getIntensityLevel(150), 3);
    assert.strictEqual(getIntensityLevel(179), 3);
    assert.strictEqual(getIntensityLevel(180), 4);
    assert.strictEqual(getIntensityLevel(200), 4);
    assert.strictEqual(getIntensityLevel(500), 4);
});

test('getDailyMinutes: groups by day and sums minutes', () => {
    const sessions = [
        { date: '2026-10-10', minutes: 30 },
        { date: '2026-10-10', minutes: 45 },
        { date: '2026-10-11', minutes: 60 },
    ];
    const daily = getDailyMinutes(sessions);
    assert.strictEqual(daily.get('2026-10-10'), 75);
    assert.strictEqual(daily.get('2026-10-11'), 60);
    assert.strictEqual(daily.size, 2);
});

test('getDailyMinutes: ignores invalid sessions', () => {
    const sessions = [
        { date: '2026-10-10', minutes: 30 },
        { date: 'invalid', minutes: 45 },
        { date: '2026-10-11', minutes: 'not-a-number' },
        { date: '2026-10-12', minutes: -5 },
        { minutes: 30 }, // missing date
        null,
    ];
    const daily = getDailyMinutes(sessions);
    assert.strictEqual(daily.get('2026-10-10'), 30);
    assert.strictEqual(daily.size, 1);
});

test('getHeatMapData: empty sessions returns all zeros', () => {
    const today = '2026-10-11';
    const { weeks } = getHeatMapData([], today, 52);
    assert.strictEqual(weeks.length, 52);
    assert.strictEqual(weeks[0].length, 7);
    for (const week of weeks) {
        for (const cell of week) {
            assert.strictEqual(cell.level, 0);
            assert.strictEqual(cell.minutes, 0);
        }
    }
});

test('getHeatMapData: session today appears in week 0', () => {
    const today = '2026-10-11'; // Sunday
    const sessions = [{ date: '2026-10-11', minutes: 90 }];
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Week 0, day 6 (Sunday) should have level 2
    assert.strictEqual(weeks[0][6].level, 2);
    assert.strictEqual(weeks[0][6].minutes, 90);
});

test('getHeatMapData: session on Monday appears in correct day', () => {
    const today = '2026-10-11'; // Sunday
    const sessions = [{ date: '2026-10-05', minutes: 90 }]; // Monday of current week
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Week 0, day 0 (Monday)
    assert.strictEqual(weeks[0][0].level, 2);
    assert.strictEqual(weeks[0][0].date, '2026-10-05');
});

test('getHeatMapData: session 51 weeks ago in week 51', () => {
    const today = '2026-10-11';
    // 51 weeks ago = 357 days (within 52-week window)
    const date51WeeksAgo = new Date('2026-10-11T00:00:00');
    date51WeeksAgo.setDate(date51WeeksAgo.getDate() - 357);
    const iso51 = date51WeeksAgo.toISOString().split('T')[0];
    
    const sessions = [{ date: iso51, minutes: 100 }];
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Should be in week 51 (index 51)
    let found = false;
    for (let d = 0; d < 7; d++) {
        if (weeks[51][d].date === iso51) {
            assert.strictEqual(weeks[51][d].level, 2);
            found = true;
            break;
        }
    }
    assert.ok(found, 'Session 51 weeks ago should be in week 51');
});

test('getHeatMapData: session exactly 52 weeks ago (364 days) is truncated', () => {
    const today = '2026-10-11';
    // 52 weeks ago = 364 days (exactly at boundary, should be truncated)
    const date52WeeksAgo = new Date('2026-10-11T00:00:00');
    date52WeeksAgo.setDate(date52WeeksAgo.getDate() - 364);
    const iso52 = date52WeeksAgo.toISOString().split('T')[0];
    
    const sessions = [{ date: iso52, minutes: 100 }];
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Should NOT appear in any week (truncated)
    for (const week of weeks) {
        for (const cell of week) {
            assert.notStrictEqual(cell.date, iso52);
        }
    }
});

test('getHeatMapData: future days marked as future and level 0', () => {
    const today = '2026-10-11';
    const sessions = [
        { date: '2026-10-12', minutes: 120 }, // tomorrow
        { date: '2026-10-15', minutes: 200 }, // future
    ];
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Find the future cells
    for (const week of weeks) {
        for (const cell of week) {
            if (cell.date === '2026-10-12' || cell.date === '2026-10-15') {
                assert.strictEqual(cell.isFuture, true);
                assert.strictEqual(cell.level, 0); // Future = level 0 visually
            }
        }
    }
});

test('getHeatMapData: more than 52 weeks of data gets truncated', () => {
    const today = '2026-10-11';
    // Create session 53 weeks ago
    const date53WeeksAgo = new Date('2026-10-11T00:00:00');
    date53WeeksAgo.setDate(date53WeeksAgo.getDate() - 371); // 53*7 = 371
    const iso53 = date53WeeksAgo.toISOString().split('T')[0];
    
    const sessions = [
        { date: iso53, minutes: 100 },
        { date: '2026-10-11', minutes: 100 },
    ];
    const { weeks } = getHeatMapData(sessions, today, 52);
    
    // Session 53 weeks ago should NOT appear in any week
    for (const week of weeks) {
        for (const cell of week) {
            assert.notStrictEqual(cell.date, iso53);
        }
    }
    // But today's session should
    assert.strictEqual(weeks[0][6].level, 2);
});

test('formatTooltipDate: converts YYYY-MM-DD to DD-MM-YYYY', () => {
    assert.strictEqual(formatTooltipDate('2026-10-11'), '11-10-2026');
    assert.strictEqual(formatTooltipDate('2026-01-05'), '05-01-2026');
    assert.strictEqual(formatTooltipDate('2026-12-31'), '31-12-2026');
});

console.log('All tests defined. Run with: node --test tests/heatmap.test.js');