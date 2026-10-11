// ============================
// Diario de Estudio - app.js
// ============================

const STORAGE_KEY = 'study_sessions';
const form = document.getElementById('session-form');
const dateInput = document.getElementById('date');
const topicInput = document.getElementById('topic');
const minutesInput = document.getElementById('minutes');
const sessionsList = document.getElementById('sessions-list');
const emptyMessage = document.getElementById('empty-message');
const streakNumber = document.getElementById('streak-number');
const bestStreakNumber = document.getElementById('best-streak-number');
const weeklyNumber = document.getElementById('weekly-number');
const monthlyNumber = document.getElementById('monthly-number');
const heatmapContainer = document.getElementById('heatmap');

// Inicializar fecha por defecto a hoy (formato YYYY-MM-DD para input[type=date])
function getTodayISO() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Formatear YYYY-MM-DD a DD-MM-YYYY para mostrar
function formatDateDisplay(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
}

// Obtener sesiones de localStorage
function getSessions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Guardar sesiones en localStorage
function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Calcular racha actual
function calculateStreak(sessions) {
    if (sessions.length === 0) return 0;

    // Agrupar por fecha (YYYY-MM-DD) - un día cuenta si tiene al menos una sesión
    const daysWithSession = new Set();
    sessions.forEach(s => daysWithSession.add(s.date));

    const today = getTodayISO();
    let streak = 0;
    let currentDate = today;

    // Si hoy no hay sesión, la racha sigue viva hasta medianoche
    // Empezamos a contar desde ayer si hoy no tiene sesión
    const hasToday = daysWithSession.has(today);
    if (!hasToday) {
        // Mover a ayer
        const yesterday = new Date(today + 'T00:00:00');
        yesterday.setDate(yesterday.getDate() - 1);
        currentDate = yesterday.toISOString().split('T')[0];
    }

    // Contar días consecutivos hacia atrás
    while (daysWithSession.has(currentDate)) {
        streak++;
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        currentDate = d.toISOString().split('T')[0];
    }

    return streak;
}

// Calcular mejor racha histórica (máximo de días consecutivos en cualquier momento)
function calculateBestStreak(sessions) {
    if (sessions.length === 0) return 0;

    // Días únicos con sesión, ordenados cronológicamente (YYYY-MM-DD)
    const days = [...new Set(sessions.map(s => s.date))].sort();

    let best = 0;
    let current = 0;
    let prevDate = null;

    for (const d of days) {
        if (prevDate) {
            const pd = new Date(prevDate + 'T00:00:00');
            pd.setDate(pd.getDate() + 1);
            const nextISO = pd.toISOString().split('T')[0];
            if (d === nextISO) {
                current++;
            } else {
                current = 1;
            }
        } else {
            current = 1;
        }
        best = Math.max(best, current);
        prevDate = d;
    }

    return best;
}

// Calcular total de minutos esta semana (lunes a domingo, fecha local)
function calculateWeeklyTotal(sessions) {
    if (sessions.length === 0) return 0;

    const now = new Date();
    const today = now.getDay(); // 0 = domingo, 1 = lunes, ...
    const diffToMonday = (today + 6) % 7; // días desde el lunes (0 si hoy es lunes)

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayISO = monday.toISOString().split('T')[0];
    const sundayISO = sunday.toISOString().split('T')[0];

    return sessions
        .filter(s => s.date >= mondayISO && s.date <= sundayISO)
        .reduce((sum, s) => sum + s.minutes, 0);
}

// Formatear minutos a "X min" o "X h Y min"
function formatMinutes(totalMinutes) {
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

// Calcular días estudiados este mes (fecha local, excluye fechas futuras)
function calculateMonthlyDays(sessions) {
    if (sessions.length === 0) return 0;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const todayISO = getTodayISO();

    // Primer día del mes a medianoche local
    const firstDay = new Date(year, month, 1);
    // Último día del mes a medianoche local (día 0 del mes siguiente)
    const lastDay = new Date(year, month + 1, 0);

    // Convertir a YYYY-MM-DD con padding manual (evita toISOString UTC)
    const pad = (n) => String(n).padStart(2, '0');
    const firstISO = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
    const lastISO = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;

    // Días únicos con sesión en el mes actual, sin pasar de hoy
    const daysInMonth = new Set();
    sessions.forEach(s => {
        if (s.date >= firstISO && s.date <= lastISO && s.date <= todayISO) {
            daysInMonth.add(s.date);
        }
    });

    return daysInMonth.size;
}

// ===== Heatmap pure functions (no DOM, no localStorage, receive todayISO) =====

// Agrupa sesiones por día y suma minutos
function getDailyMinutes(sessions) {
    const daily = new Map();
    for (const s of sessions) {
        if (!s || typeof s.date !== 'string' || typeof s.minutes !== 'number') continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) continue;
        if (s.minutes < 1) continue;

        const current = daily.get(s.date) || 0;
        daily.set(s.date, current + s.minutes);
    }
    return daily;
}

// Devuelve el lunes (YYYY-MM-DD) de la semana que contiene dateISO
function getMondayOfWeek(dateISO) {
    const d = new Date(dateISO + 'T00:00:00');
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    return d.toISOString().split('T')[0];
}

// Asigna nivel de intensidad según minutos
function getIntensityLevel(minutes) {
    if (minutes <= 0) return 0;
    if (minutes < 60) return 1;
    if (minutes < 120) return 2;
    if (minutes < 180) return 3;
    return 4;
}

// Genera matriz 52x7 para el heatmap
function getHeatMapData(sessions, todayISO, weeksBack = 52) {
    const dailyMinutes = getDailyMinutes(sessions);
    const todayMonday = getMondayOfWeek(todayISO);

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

            week.push({ date: cellISO, minutes, level, isFuture });
        }
        weeks.push(week);
    }

    return { weeks, startDate: todayMonday };
}

// Formatea YYYY-MM-DD a DD-MM-YYYY para tooltip
function formatTooltipDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
}

// Renderizar lista de sesiones (más reciente arriba)
function renderSessions(sessions) {
    sessionsList.innerHTML = '';

    if (sessions.length === 0) {
        emptyMessage.hidden = false;
        return;
    }

    emptyMessage.hidden = true;

    // Ordenar: más reciente primero (por createdAt descendente)
    const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach(session => {
        const li = document.createElement('li');
        li.className = 'session-item';
        li.innerHTML = `
            <div class="session-info">
                <div class="session-topic">${escapeHtml(session.topic)}</div>
                <div class="session-meta">
                    <span class="session-date">${formatDateDisplay(session.date)}</span>
                    <span class="session-minutes">${session.minutes} min</span>
                </div>
            </div>
        `;
        sessionsList.appendChild(li);
    });
}

// Escape HTML básico para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar heatmap
function renderHeatMap(heatMapData, todayISO) {
    if (!heatmapContainer) return;

    const { weeks } = heatMapData;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Build HTML: weeks as columns (GitHub style), days as rows
    // We iterate weeks in reverse (week 51 first = top, week 0 last = bottom)
    // But for grid layout, we need columns = weeks, so we render week 0 first (leftmost column)
    // Actually GitHub has most recent week on the right. Let's do columns = weeks, left to right = oldest to newest
    // So week 51 (oldest) = column 0, week 0 (newest) = column 51

    let html = '<div class="heatmap-grid" role="img" aria-label="Mapa de calor de actividad de estudio">';

    // Day labels (Mon-Sun) on the left
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    html += '<div class="heatmap-day-labels" aria-hidden="true">';
    for (const label of dayLabels) {
        html += `<div class="heatmap-day-label">${label}</div>`;
    }
    html += '</div>';

    // Grid: 52 columns (weeks), 7 rows (days)
    html += '<div class="heatmap-cells">';
    for (let d = 0; d < 7; d++) {
        for (let w = weeks.length - 1; w >= 0; w--) {
            const cell = weeks[w][d];
            const levelClass = cell.isFuture ? 'heatmap-cell--future' : `heatmap-cell--level-${cell.level}`;
            const title = cell.isFuture
                ? ''
                : `${formatTooltipDate(cell.date)}: ${cell.minutes} min`;
            html += `<div class="heatmap-cell ${levelClass}" 
                data-date="${cell.date}" 
                data-level="${cell.level}" 
                data-minutes="${cell.minutes}"
                ${title ? `title="${title}"` : ''}
                tabindex="0" role="cell" aria-label="${title || 'Día futuro'}"></div>`;
        }
    }
    html += '</div>';

    // Month labels (top) - find first occurrence of each month
    html += '<div class="heatmap-month-labels" aria-hidden="true">';
    let lastMonth = -1;
    for (let w = weeks.length - 1; w >= 0; w--) {
        const cell = weeks[w][0]; // Monday of each week
        const month = parseInt(cell.date.split('-')[1], 10) - 1;
        if (month !== lastMonth) {
            const xPos = ((weeks.length - 1 - w) / weeks.length) * 100;
            html += `<div class="heatmap-month-label" style="left: ${xPos}%">${monthNames[month]}</div>`;
            lastMonth = month;
        }
    }
    html += '</div>';

    html += '</div>';
    heatmapContainer.innerHTML = html;
}

// Actualizar UI completa
function refreshUI() {
    const sessions = getSessions();
    const todayISO = getTodayISO();
    renderSessions(sessions);
    streakNumber.textContent = calculateStreak(sessions);
    bestStreakNumber.textContent = calculateBestStreak(sessions);
    weeklyNumber.textContent = formatMinutes(calculateWeeklyTotal(sessions));
    monthlyNumber.textContent = calculateMonthlyDays(sessions);
    renderHeatMap(getHeatMapData(sessions, todayISO), todayISO);
}

// Manejar envío del formulario
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = dateInput.value; // YYYY-MM-DD
    const topic = topicInput.value.trim();
    const minutes = parseInt(minutesInput.value, 10);

    if (!date || !topic || !minutes || minutes < 1) return;

    const sessions = getSessions();
    sessions.push({
        date,
        topic,
        minutes,
        createdAt: new Date().toISOString()
    });

    saveSessions(sessions);
    refreshUI();

    // Resetear formulario (mantener fecha por defecto en hoy)
    topicInput.value = '';
    minutesInput.value = '';
    dateInput.value = getTodayISO();
    topicInput.focus();
});

// Inicializar
dateInput.value = getTodayISO();
refreshUI();
topicInput.focus();