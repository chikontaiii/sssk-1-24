import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allAbsences = [];
let allStudents = [];

async function loadData() {
    // Загружаем пропуски
    const qAbs = query(collection(db, "absences"), orderBy("date", "desc"));
    const snapAbs = await getDocs(qAbs);
    allAbsences = snapAbs.docs.map(doc => doc.data());

    // Загружаем студентов
    const snapStudents = await getDocs(collection(db, "students"));
    allStudents = snapStudents.docs.map(doc => doc.data().name);
    allStudents.sort((a, b) => a.localeCompare(b, 'ru'));

    updateStats();
    renderListView(getActiveFilter());
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filters button.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

function updateStats() {
    const totalPairs = allAbsences.length;
    const totalHours = totalPairs * 2;
    document.getElementById('totalAbsences').innerText = totalPairs;
    document.getElementById('totalHours').innerText = totalHours;
    const avgHours = totalPairs > 0 ? (totalHours / totalPairs).toFixed(1) : 0;
    document.getElementById('avgHours').innerText = avgHours;
}

function filterAbsencesByPeriod(period) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    if (period === 'today') return allAbsences.filter(a => a.date === today);
    if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return allAbsences.filter(a => new Date(a.date) >= weekAgo);
    }
    if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return allAbsences.filter(a => new Date(a.date) >= monthAgo);
    }
    return allAbsences;
}

function groupByDate(absences) {
    const groups = {};
    absences.forEach(a => {
        if (!groups[a.date]) groups[a.date] = [];
        groups[a.date].push(a);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    return sortedDates.map(date => ({ date, items: groups[date] }));
}

function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderListView(filter) {
    const filtered = filterAbsencesByPeriod(filter);
    const grouped = groupByDate(filtered);
    const container = document.getElementById('listContainer');
    if (grouped.length === 0) {
        container.innerHTML = '<div class="empty-message">Нет пропусков за выбранный период</div>';
        return;
    }
    container.innerHTML = grouped.map(day => `
        <div class="absence-day">
            <div class="absence-day-header">${formatDate(day.date)}</div>
            <ul class="absence-list">
                ${day.items.map(item => `
                    <li class="absence-item">
                        <span class="student-name">${escapeHtml(item.student)}</span>
                        <div class="absence-details">
                            <span class="absence-pair">${item.pair}П (${item.hours} ч.)</span>
                            ${item.reason ? `<span class="absence-reason">${escapeHtml(item.reason)}</span>` : ''}
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// ========== ЖУРНАЛ (только пропуски, формат "1П", "2П") ==========
function renderJournal() {
    // Собираем все уникальные даты из пропусков
    const allDatesSet = new Set();
    allAbsences.forEach(a => allDatesSet.add(a.date));
    const allDates = Array.from(allDatesSet).sort((a,b) => new Date(a) - new Date(b));
    if (allDates.length === 0) {
        document.getElementById('journalContainer').innerHTML = '<div class="empty-message">Нет данных для отображения</div>';
        return;
    }

    // Создаём карту: студент → дата → массив пар (или просто строка)
    const journalData = {};
    allStudents.forEach(student => {
        journalData[student] = {};
    });

    // Группируем пропуски по студенту и дате, собираем номера пар
    allAbsences.forEach(absence => {
        const student = absence.student;
        const date = absence.date;
        const pair = absence.pair;
        if (journalData[student]) {
            if (!journalData[student][date]) {
                journalData[student][date] = [];
            }
            journalData[student][date].push(pair);
        }
    });

    // Формируем HTML таблицы
    let html = '<div class="journal-container"><table class="journal-table"><thead><tr><th class="student-col">Студент</th>';
    allDates.forEach(date => {
        html += `<th>${formatDate(date)}</th>`;
    });
    html += '</tr></thead><tbody>';

    allStudents.forEach(student => {
        html += `<tr><td class="student-col">${escapeHtml(student)}</td>`;
        allDates.forEach(date => {
            const pairs = journalData[student][date];
            let content = '';
            if (pairs && pairs.length > 0) {
                // Сортируем пары по возрастанию
                pairs.sort((a,b) => a - b);
                // Формируем строку вида "1П, 2П"
                content = pairs.map(p => `${p}П`).join(', ');
                content = `<span class="absence-mark">${content}</span>`;
            } else {
                content = '<span class="empty-mark">—</span>';
            }
            html += `<td>${content}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    document.getElementById('journalContainer').innerHTML = html;
}

// Переключение видов
document.getElementById('listViewBtn').addEventListener('click', () => {
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('journalViewBtn').classList.remove('active');
    document.getElementById('listContainer').style.display = 'block';
    document.getElementById('journalContainer').style.display = 'none';
    renderListView(getActiveFilter());
});

document.getElementById('journalViewBtn').addEventListener('click', () => {
    document.getElementById('journalViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    document.getElementById('listContainer').style.display = 'none';
    document.getElementById('journalContainer').style.display = 'block';
    renderJournal();
});

// Фильтры для списка
document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (document.getElementById('listViewBtn').classList.contains('active')) {
            renderListView(btn.dataset.filter);
        }
    });
});

loadData();