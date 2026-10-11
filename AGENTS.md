# Diario de Estudio - Agent Guide

## Project Overview
Vanilla HTML/CSS/JS study tracker. No build step, no dependencies, no server required.

## Run / Verify
- Open `index.html` directly in browser (double-click or `file://` protocol)
- No dev server, no npm, no install needed

## File Structure
```
├── index.html    # Entry point, semantic structure
├── styles.css    # Mobile-first, CSS variables, no media queries beyond 480px
└── app.js        # All logic: localStorage, streak calc, render, form handling
```

## Key Implementation Details

### Streak Logic (`app.js:calculateStreak`)
- Groups sessions by `date` (YYYY-MM-DD from `<input type="date">`)
- A day counts if ≥1 session exists
- Streak = consecutive days ending **today** (local timezone)
- If today has no session but yesterday does → streak stays alive until midnight
- Uses `new Date(iso + 'T00:00:00')` for date arithmetic to avoid UTC shifts

### Date Format
- Storage & grouping: `YYYY-MM-DD` (native input value)
- Display only: `DD-MM-YYYY` via `formatDateDisplay()`

### Data Schema (localStorage key: `study_sessions`)
```json
[
  { "date": "2026-10-10", "topic": "JavaScript", "minutes": 45, "createdAt": "2026-10-10T14:30:00.000Z" }
]
```
- `createdAt` used for tie-breaking same-day sessions (newest first)

### No Framework Conventions
- No components, no state management, no bundler
- Direct DOM manipulation in `refreshUI()`
- Event delegation not needed (single form, static list)
- XSS protection via `escapeHtml()` using textContent → innerHTML

### Weekly Total (`app.js:calculateWeeklyTotal`)
- Week = Monday to Sunday (ISO-8601), based on local `new Date()`
- Filters sessions by `date` (YYYY-MM-DD) between Monday 00:00 and Sunday 23:59
- Sums `minutes` field
- Display: "X min" or "X h Y min" via `formatMinutes()`
- Element: `#weekly-number` in `.weekly-card` (green gradient)

### Monthly Days (`app.js:calculateMonthlyDays`)
- Month = current month (local `new Date()`), excludes future dates (> today)
- Uses `new Date(year, month, 1)` and `new Date(year, month + 1, 0)` for boundaries (no UTC)
- Builds YYYY-MM-DD strings with manual padding (avoids `toISOString()` UTC shift)
- Counts unique days with sessions via `Set`
- Display: "X días"
- Element: `#monthly-number` in `.monthly-card` (blue/indigo gradient)

## Common Tasks

### Add a Feature
1. Edit the relevant file directly
2. Open `index.html` to test
3. No lint/typecheck/test commands exist

### Modify Streak Rules
- Edit `calculateStreak()` in `app.js`
- Test by adding sessions with different dates in the form

### Change Storage
- Edit `STORAGE_KEY`, `getSessions()`, `saveSessions()` in `app.js`
- Clear localStorage in DevTools to reset

## Gotchas
- `input[type="date"]` **always** returns `YYYY-MM-DD` — cannot be changed
- `localStorage` only works on `http(s)://` or `file://` (some browsers block `file://` storage)
- No backend — data is per-browser, per-origin

## Memory

* At the start, read 'MEMORY.md' to understand the project status and decisions made.
* Upon finishing a task, update it: current status, important decisions (with their rationale), and mistakes to avoid.
* Keep it brief (maximum ~50 lines): summarize or remove anything that is no longer useful.
* If something becomes a permanent rule, propose moving it to `AGENTS.md` instead of leaving it in memory.
* Never store sensitive data (keys, tokens, personal data).