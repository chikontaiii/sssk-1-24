// students.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const tbody = document.getElementById('homework-body');

async function loadHomework() {
    const snapshot = await getDocs(collection(db, "homework"));
    tbody.innerHTML = ''; // очищаем

    snapshot.forEach(doc => {
        const hw = doc.data();
        const deadlineClass = hw.deadline < new Date().toISOString().split('T')[0] ? 'urgent' : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Предмет" class="homework-subject">${hw.subject || ''}</td>
            <td data-label="Задание">${hw.task || ''}</td>
            <td data-label="Дедлайн" class="homework-deadline ${deadlineClass}">${hw.deadline || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

loadHomework();