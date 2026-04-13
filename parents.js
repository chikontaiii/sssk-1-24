import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const warningsList = document.getElementById('warnings-list');

async function loadGroupedWarnings() {
    // 1. Загружаем всех студентов
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const students = [];
    studentsSnapshot.forEach(doc => {
        students.push({ id: doc.id, name: doc.data().name });
    });
    // Сортируем студентов по имени
    students.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    // 2. Загружаем все предупреждения
    const q = query(collection(db, "warnings"), orderBy("date", "desc"));
    const warningsSnapshot = await getDocs(q);
    const warningsByStudent = {};
    warningsSnapshot.forEach(doc => {
        const w = doc.data();
        const studentName = w.student;
        if (!warningsByStudent[studentName]) {
            warningsByStudent[studentName] = [];
        }
        // Форматируем дату из YYYY-MM-DD в DD.MM.YYYY
        let formattedDate = w.date || '';
        if (formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = formattedDate.split('-');
            formattedDate = `${day}.${month}.${year}`;
        }
        warningsByStudent[studentName].push({
            text: w.warning,
            date: formattedDate,
            rawDate: w.date
        });
    });

    // 3. Формируем HTML
    const container = document.getElementById('warnings-list');
    container.innerHTML = '';

    students.forEach(student => {
        const studentWarnings = warningsByStudent[student.name] || [];
        // Сортируем предупреждения внутри студента по дате (новые сверху)
        studentWarnings.sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));

        const studentBlock = document.createElement('div');
        studentBlock.className = 'student-warnings-block';

        // Заголовок с именем студента
        const studentNameEl = document.createElement('div');
        studentNameEl.className = 'student-name';
        studentNameEl.textContent = student.name;
        studentBlock.appendChild(studentNameEl);

        if (studentWarnings.length === 0) {
            const noWarningsEl = document.createElement('div');
            noWarningsEl.className = 'no-warnings';
            noWarningsEl.textContent = 'Нет предупреждений';
            studentBlock.appendChild(noWarningsEl);
        } else {
            const warningsListEl = document.createElement('ul');
            warningsListEl.className = 'warnings-per-student';
            studentWarnings.forEach(warning => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="warning-date">${warning.date}</span>
                    <span class="warning-text">${warning.text}</span>
                `;
                warningsListEl.appendChild(li);
            });
            studentBlock.appendChild(warningsListEl);
        }
        container.appendChild(studentBlock);
    });
}

loadGroupedWarnings();