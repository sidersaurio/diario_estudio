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
const weeklyNumber = document.getElementById('weekly-number');
const monthlyNumber = document.getElementById('monthly-number');

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

// Actualizar UI completa
function refreshUI() {
    const sessions = getSessions();
    renderSessions(sessions);
    streakNumber.textContent = calculateStreak(sessions);
    weeklyNumber.textContent = formatMinutes(calculateWeeklyTotal(sessions));
    monthlyNumber.textContent = calculateMonthlyDays(sessions);
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