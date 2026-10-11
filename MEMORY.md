# Memory - Diario de Estudio

## Current Status (2026-10-11)
- Added **Best Streak** (mejor racha) feature
- Added **Heatmap** (mapa de calor) feature - 52 weeks GitHub-style visualization

## Decisions Made

### Best Streak
1. **Icon**: 🏆 (trofeo)
2. **Color**: Violet/Morado (`--violet-dark: #5E3FA0`)
3. **Mobile layout**: Single row with flex-wrap (dividers hidden on ≤480px)
4. **Tie handling**: Shows both equal, no special indicator
5. **Persistence**: Recalculates from localStorage on each render; decreases if sessions deleted
6. **Label**: "mejor racha"

### Heatmap
1. **Palette**: GitHub-style green scale (5 levels: `--heatmap-level-0` through `--heatmap-level-4`)
2. **Cell size**: 11px desktop / 9px mobile (≤480px), gap 2px / 1px
3. **Week orientation**: Mon–Sun, most recent week rightmost (GitHub style)
4. **Future days**: Neutral gray (`--heatmap-future`), no tooltip
5. **Tooltips**: Native `title` + CSS `::after` on hover/focus, format "DD-MM-YYYY: X min"
6. **Month labels**: Top row (Ene, Feb...), day labels left (Lun–Dom)
7. **Keyboard accessible**: `tabindex="0"`, focus shows tooltip + scale
8. **Tests**: 11 unit tests in `tests/heatmap.test.js`, all passing

## Files Modified
- `app.js`: + `calculateBestStreak()`, `getDailyMinutes()`, `getMondayOfWeek()`, `getIntensityLevel()`, `getHeatMapData()`, `formatTooltipDate()`, `renderHeatMap()`, DOM ref `#heatmap`, `refreshUI()` update
- `index.html`: + 4th stat with 🏆, `#best-streak-number`, label; + `.heatmap-section` with `#heatmap`
- `styles.css`: + `--violet`, `--violet-dark` tokens; `:nth-child(2) .stat-number` color; + heatmap variables, `.heatmap-section`, `.heatmap-grid`, `.heatmap-cells`, `.heatmap-cell`, responsive
- `tests/heatmap.test.js`: **New** - 11 unit tests for pure functions
- `AGENTS.md`: Documented `calculateBestStreak()` and heatmap functions in Key Implementation Details
- `specs/001-heat-map/spec.md`: **New** - full specification

## Algorithm Notes
- `calculateBestStreak` iterates unique dates sorted ascending, uses local-midnight arithmetic
- `getHeatMapData` builds 52×7 matrix (weeks×days), receives `todayISO` param, truncates >52 weeks
- All date math uses `new Date(iso + 'T00:00:00')` to avoid UTC shifts (Constitución #3)
- Pure functions have no DOM/localStorage dependencies