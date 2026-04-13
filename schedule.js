// schedule.js – автоматическое расписание на сегодня и завтра

// ===== НАСТРОЙКИ =====
const SEMESTER_START = new Date(2026, 2, 30); // 30 марта 2026 (месяцы 0-11)

// ===== РАСПИСАНИЕ ЗВОНКОВ =====
const bellSchedule = [
    { pair: 0, start: "08:35", end: "09:55", break: 5 },
    { pair: 1, start: "10:00", end: "11:20", break: 5 },
    { pair: 2, start: "11:25", end: "12:45", break: 20 },
    { pair: 3, start: "13:05", end: "14:25", break: 5 },
    { pair: 4, start: "14:30", end: "15:50", break: 5 },
    { pair: 5, start: "15:55", end: "17:15", break: 5 },
    { pair: 6, start: "17:20", end: "18:40", break: 5 },
    { pair: 7, start: "18:45", end: "20:05", break: 5 }
];

// ===== РАСПИСАНИЕ ЗАНЯТИЙ (числитель) =====
const numeratorSchedule = {
    1: [{ subject: "КГ 2пд", time: "14:30 - 15:50", room: "Ауд. 302" }, { subject: "КГ 1пд / ТСИ 2пд", time: "15:55 - 17:15", room: "Ауд. 302 / Ауд. 305" }, { subject: "ТА 1пд", time: "17:20 - 18:40", room: "Лаб. 302" }, { subject: "КГ 1пд", time: "18:45 - 20:05", room: "Ауд. 302" }],
    2: [{ subject: "ТСИ 1пд", time: "8:35 - 9:55", room: "Ауд. 305" }, { subject: "ТСИ", time: "10:00 - 11:20", room: "Ауд. 305" }, { subject: "Физ.воспитание", time: "11:25 - 12:45", room: "Ауд. 02" }, { subject: "БЖД", time: "13:05 - 14:25", room: "Ауд. 106" }, { subject: "ТА 2пд", time: "14:30 - 15:50", room: "Ауд. 302" }],
    3: [{ subject: "Кыргызский язык", time: "13:05 - 14:25", room: "Ауд. 304" }, { subject: "История Кыргызстана", time: "14:30 - 15:50", room: "Ауд. 208" }],
    4: [{ subject: "КГ", time: "11:25 - 12:45", room: "Ауд. 302" }, { subject: "География", time: "13:05 - 14:25", room: "Ауд. 206" }, { subject: "ТА", time: "14:30 - 15:50", room: "Ауд. 302" }, { subject: "ТА 1пд", time: "15:55 - 17:15", room: "Ауд. 302" }],
    5: [{ subject: "История Кыргызстана", time: "10:00 - 11:20", room: "Ауд. 208" }, { subject: "Кыргызский язык", time: "11:25 - 12:45", room: "Ауд. 304" }, { subject: "Английский язык", time: "13:05 - 14:25", room: "Ауд. 214 / Ауд. 216" }],
    6: [{ subject: "Выходной", time: "", room: "" }],
    0: [{ subject: "Выходной", time: "", room: "" }]
};

// ===== РАСПИСАНИЕ ЗАНЯТИЙ (знаменатель) =====
const denominatorSchedule = {
    1: [{ subject: "КГ 2пд", time: "14:30 - 15:50", room: "Ауд. 302" }, { subject: "КГ 1пд / ТСИ 2пд", time: "15:55 - 17:15", room: "Ауд. 302 / Ауд. 305" }, { subject: "ТА 2пд", time: "17:20 - 18:40", room: "Лаб. 302" }, { subject: "КГ 2пд", time: "18:45 - 20:05", room: "Ауд. 302" }],
    2: [{ subject: "ТСИ 1пд", time: "8:35 - 9:55", room: "Ауд. 305" }, { subject: "ТСИ", time: "10:00 - 11:20", room: "Ауд. 305" }, { subject: "Физ.воспитание", time: "11:25 - 12:45", room: "Ауд. 02" }, { subject: "БЖД", time: "13:05 - 14:25", room: "Ауд. 106" }, { subject: "ТА 2пд", time: "14:30 - 15:50", room: "Ауд. 302" }],
    3: [{ subject: "Кыргызский язык", time: "13:05 - 14:25", room: "Ауд. 304" }, { subject: "История Кыргызстана", time: "14:30 - 15:50", room: "Ауд. 208" }],
    4: [{ subject: "ТСИ", time: "10:00 - 11:20", room: "Ауд. 305" }, { subject: "КГ", time: "11:25 - 12:45", room: "Ауд. 302" }, { subject: "География", time: "13:05 - 14:25", room: "Ауд. 206" }, { subject: "ТА", time: "14:30 - 15:50", room: "Ауд. 302" }, { subject: "ТА 1пд", time: "15:55 - 17:15", room: "Ауд. 302" }],
    5: [{ subject: "История Кыргызстана", time: "10:00 - 11:20", room: "Ауд. 208" }, { subject: "Кыргызский язык", time: "11:25 - 12:45", room: "Ауд. 304" }, { subject: "Английский язык", time: "13:05 - 14:25", room: "Ауд. 214 / Ауд. 216" }],
    6: [{ subject: "Выходной", time: "", room: "" }],
    0: [{ subject: "Выходной", time: "", room: "" }]
};

// ===== ОПРЕДЕЛЕНИЕ ТИПА НЕДЕЛИ ДЛЯ ДАТЫ =====
function getWeekTypeForDate(date) {
    const diffTime = date - SEMESTER_START;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    return (weekNumber % 2 === 0) ? 'numerator' : 'denominator';
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getDayName(dayNumber) {
    const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    return days[dayNumber] || "";
}

function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day.toString().padStart(2,"0")}.${month.toString().padStart(2,"0")}.${year}`;
}

// ===== ЗАГРУЗКА РАСПИСАНИЯ С КРАСИВЫМ ЗАГОЛОВКОМ =====
function loadScheduleForDay(dayOffset, containerId) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);

    const weekType = getWeekTypeForDate(targetDate);
    const schedule = weekType === 'numerator' ? numeratorSchedule : denominatorSchedule;
    const dayOfWeek = targetDate.getDay();

    const scheduleForDay = schedule[dayOfWeek] || schedule[0];

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // Заголовок: день недели, дата, тип недели
    const header = document.createElement('div');
    header.className = "schedule-header";
    header.innerHTML = `<strong>${getDayName(dayOfWeek)}, ${formatDate(targetDate)}</strong> — ${weekType === 'numerator' ? "Числитель (Белая)" : "Знаменатель (Чёрная)"}`;
    container.appendChild(header);

    // Пары
    scheduleForDay.forEach(item => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        scheduleItem.innerHTML = `
            <div>
                <div class="schedule-subject">${item.subject}</div>
                <div class="schedule-time">${item.time}</div>
            </div>
            <span class="schedule-room">${item.room}</span>
        `;
        container.appendChild(scheduleItem);
    });
}

// ===== ЗАГРУЗКА ЗВОНКОВ =====
function loadBellSchedule() {
    const container = document.getElementById('bell-schedule');
    if (!container) return;

    container.innerHTML = '';
    bellSchedule.forEach(item => {
        const bellItem = document.createElement('div');
        bellItem.className = 'bell-item';
        bellItem.innerHTML = `<div><strong>${item.pair} пара:</strong> ${item.start} – ${item.end} <span style="margin-left:20px;">перемена ${item.break} мин</span></div>`;
        container.appendChild(bellItem);
    });
}

// ===== ЗАГРУЗКА ТЕКУЩЕЙ НЕДЕЛИ =====
function loadWeekInfo() {
    const today = new Date();
    const weekType = getWeekTypeForDate(today);
    const weekTypeText = weekType === 'numerator' ? 'Числитель (Белая)' : 'Знаменатель (Чёрная)';
    const badge = document.getElementById('week-type-badge');
    if (badge) badge.textContent = `Текущая неделя: ${weekTypeText}`;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    loadScheduleForDay(0, 'today-schedule'); // Сегодня
    loadScheduleForDay(1, 'tomorrow-schedule'); // Завтра
    loadBellSchedule(); // Звонки
    loadWeekInfo(); // Тип недели
});