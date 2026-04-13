import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allWarnings = [];

async function loadWarnings() {
    const q = query(collection(db, "warnings"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    allWarnings = snapshot.docs.map(doc => doc.data());
    updateStats();
    renderByFilter(getActiveFilter());
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filters button.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

function updateStats() {
    const total = allWarnings.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = allWarnings.filter(w => w.date === today).length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = allWarnings.filter(w => new Date(w.date) >= weekAgo).length;
    document.getElementById('totalCount').innerText = total;
    document.getElementById('todayCount').innerText = todayCount;
    document.getElementById('weekCount').innerText = weekCount;
}

function filterWarningsByPeriod(period) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    if (period === 'today') return allWarnings.filter(w => w.date === today);
    if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return allWarnings.filter(w => new Date(w.date) >= weekAgo);
    }
    if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return allWarnings.filter(w => new Date(w.date) >= monthAgo);
    }
    return allWarnings;
}

function groupByDate(warnings) {
    const groups = {};
    warnings.forEach(w => {
        if (!groups[w.date]) groups[w.date] = [];
        groups[w.date].push(w);
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
    const filtered = filterWarningsByPeriod(filter);
    const grouped = groupByDate(filtered);
    const container = document.getElementById('daysContainer');
    if (grouped.length === 0) {
        container.innerHTML = '<div class="empty-message">Нет предупреждений за выбранный период</div>';
        return;
    }
    container.innerHTML = grouped.map(day => `
        <div class="nb-day">
            <div class="nb-day-header">${formatDate(day.date)}</div>
            <ul class="nb-list">
                ${day.items.map(item => `
                    <li class="nb-item">
                        <span class="student-name">${escapeHtml(item.student)}</span>
                        <span class="nb-type">${escapeHtml(item.warning)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// Обработчики фильтров
document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderByFilter(btn.dataset.filter);
    });
});

loadWarnings();