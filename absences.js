import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allAbsences = [];
let allStudents = [];
let observer;

async function loadData() {
    const qAbs = query(collection(db, "absences"), orderBy("date", "desc"));
    const snapAbs = await getDocs(qAbs);
    allAbsences = snapAbs.docs.map(doc => doc.data());

    const snapStudents = await getDocs(collection(db, "students"));
    allStudents = snapStudents.docs.map(doc => doc.data().name);
    allStudents.sort((a, b) => a.localeCompare(b, 'ru'));

    updateStats();
    renderListView(getActiveFilter());
    setupScrollObserver();
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filters button.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// ========== ПЛАВНЫЙ СЧЁТЧИК ==========
function animateNumber(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.innerText) || 0;
    if (start === newValue) return;
    const duration = 600;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (newValue - start) / steps;
    let current = start;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
            el.innerText = newValue;
            clearInterval(timer);
        } else {
            el.innerText = Math.round(current);
        }
    }, stepTime);
}

function updateStats() {
    const totalPairs = allAbsences.length;
    const totalHours = allAbsences.reduce((sum, a) => sum + (a.hours || 0), 0);
    const avgHours = totalPairs > 0 ? (totalHours / totalPairs).toFixed(1) : 0;
    animateNumber('totalAbsences', totalPairs);
    animateNumber('totalHours', totalHours);
    animateNumber('avgHours', parseFloat(avgHours));
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

function groupByDateAndStudent(absences) {
    const groups = {};
    absences.forEach(a => {
        const date = a.date;
        const student = a.student;
        const pair = a.pair;
        const hours = a.hours || pair * 2;
        if (!groups[date]) groups[date] = {};
        if (!groups[date][student]) groups[date][student] = [];
        groups[date][student].push({ pair, hours });
    });
    const result = [];
    Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
        const studentsList = [];
        Object.keys(groups[date]).forEach(student => {
            const items = groups[date][student];
            items.sort((x, y) => x.pair - y.pair);
            const pairs = items.map(i => i.pair);
            const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
            studentsList.push({ student, pairs, totalHours });
        });
        studentsList.sort((a, b) => a.student.localeCompare(b.student, 'ru'));
        result.push({ date, students: studentsList });
    });
    return result;
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
    const grouped = groupByDateAndStudent(filtered);
    const container = document.getElementById('listContainer');
    if (grouped.length === 0) {
        container.innerHTML = '<div class="empty-message">Нет пропусков за выбранный период</div>';
        return;
    }
    container.innerHTML = grouped.map(day => `
        <div class="absence-day fade-on-scroll">
            <div class="absence-day-header">${formatDate(day.date)}</div>
            <ul class="absence-list">
                ${day.students.map(student => {
                    const pairsText = student.pairs.map(p => `${p}п`).join(', ');
                    return `
                        <li class="absence-item">
                            <span class="student-name">${escapeHtml(student.student)}</span>
                            <div class="absence-details">
                                <span class="absence-pair">${pairsText} (${student.totalHours} ч.)</span>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `).join('');
    observeNewElements();
}

function renderJournal() {
    const allDatesSet = new Set();
    allAbsences.forEach(a => allDatesSet.add(a.date));
    const allDates = Array.from(allDatesSet).sort((a,b) => new Date(a) - new Date(b));
    if (allDates.length === 0) {
        document.getElementById('journalContainer').innerHTML = '<div class="empty-message">Нет данных для отображения</div>';
        return;
    }

    const journalData = {};
    allStudents.forEach(student => { journalData[student] = {}; });
    allAbsences.forEach(absence => {
        const student = absence.student;
        const date = absence.date;
        const pair = absence.pair;
        if (journalData[student]) {
            if (!journalData[student][date]) journalData[student][date] = [];
            journalData[student][date].push(pair);
        }
    });

    let html = '<div class="journal-container"><table class="journal-table"><thead><tr><th class="student-col">Студент</th>';
    allDates.forEach(date => html += `<th>${formatDate(date)}</th>`);
    html += '</table></thead><tbody>';
    allStudents.forEach(student => {
        html += `<tr><td class="student-col">${escapeHtml(student)}</td>`;
        allDates.forEach(date => {
            const pairs = journalData[student]?.[date];
            if (pairs && pairs.length) {
                pairs.sort((a,b) => a - b);
                const pairsText = pairs.map(p => `${p}п`).join(', ');
                html += `<td><span class="absence-mark">${pairsText}</span></td>`;
            } else {
                html += `<td><span class="empty-mark">—</span></td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    document.getElementById('journalContainer').innerHTML = html;
    observeNewElements();
}

// ========== НАБЛЮДАТЕЛЬ ЗА ПОЯВЛЕНИЕМ БЛОКОВ ==========
function setupScrollObserver() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    observeNewElements();
}

function observeNewElements() {
    if (!observer) return;
    document.querySelectorAll('.fade-on-scroll:not(.observed)').forEach(el => {
        observer.observe(el);
        el.classList.add('observed');
    });
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