import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allAbsences = [];

async function loadAbsences() {
    const q = query(collection(db, "absences"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    allAbsences = snapshot.docs.map(doc => doc.data());
    updateStats();
    renderByFilter(getActiveFilter());
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filters button.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

function updateStats() {
    const totalPairs = allAbsences.length;
    const totalHours = allAbsences.reduce((sum, a) => sum + (a.hours || 0), 0);
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

function renderByFilter(filter) {
    const filtered = filterAbsencesByPeriod(filter);
    const grouped = groupByDate(filtered);
    const container = document.getElementById('daysContainer');
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
                            <span class="absence-pair">${item.pair} пара (${item.hours} ч.)</span>
                            ${item.reason ? `<span class="absence-reason">${escapeHtml(item.reason)}</span>` : ''}
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderByFilter(btn.dataset.filter);
    });
});

loadAbsences();