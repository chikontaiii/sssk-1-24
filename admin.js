import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ========== УПРАВЛЕНИЕ СТУДЕНТАМИ ==========
async function loadStudentsToSelect() {
    const studentSelect = document.getElementById('warn-student');
    if (!studentSelect) return;

    const snapshot = await getDocs(collection(db, "students"));
    const students = [];
    snapshot.forEach(doc => {
        students.push({ id: doc.id, name: doc.data().name });
    });
    students.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    studentSelect.innerHTML = '<option value="">-- Выберите студента --</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.name;
        option.textContent = student.name;
        studentSelect.appendChild(option);
    });
}

async function displayStudentList() {
    const container = document.getElementById('student-list');
    if (!container) return;

    const snapshot = await getDocs(collection(db, "students"));
    const students = [];
    snapshot.forEach(docSnap => {
        students.push({ id: docSnap.id, name: docSnap.data().name });
    });
    students.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    container.innerHTML = '';
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-list-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '0.5rem 0';
        div.style.borderBottom = '1px solid #F0F0F0';
        div.innerHTML = `
            <span>${escapeHtml(student.name)}</span>
            <button class="btn btn-outline" style="padding: 0.2rem 0.6rem; width: auto;" onclick="deleteStudent('${student.id}')">Удалить</button>
        `;
        container.appendChild(div);
    });
}

window.addStudent = async function() {
    const nameInput = document.getElementById('new-student-name');
    const name = nameInput.value.trim();
    if (!name) {
        alert('Введите имя студента');
        return;
    }
    try {
        await addDoc(collection(db, "students"), { name });
        alert('Студент добавлен');
        nameInput.value = '';
        loadStudentsToSelect();
        displayStudentList();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

window.deleteStudent = async function(studentId) {
    if (!confirm('Удалить студента?')) return;
    try {
        await deleteDoc(doc(db, "students", studentId));
        loadStudentsToSelect();
        displayStudentList();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// ========== ДОМАШНЕЕ ЗАДАНИЕ ==========
window.addHomework = async function() {
    const subject = document.getElementById('hw-subject').value.trim();
    const task = document.getElementById('hw-task').value.trim();
    const deadline = document.getElementById('hw-deadline').value;

    if (!subject || !task || !deadline) {
        alert('Заполните все поля');
        return;
    }

    try {
        await addDoc(collection(db, "homework"), {
            subject,
            task,
            deadline,
            createdAt: new Date().toISOString()
        });
        alert('Домашнее задание добавлено!');
        document.getElementById('hw-subject').value = '';
        document.getElementById('hw-task').value = '';
        document.getElementById('hw-deadline').value = '';
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// ========== ПРЕДУПРЕЖДЕНИЯ ==========
window.addWarning = async function() {
    const studentSelect = document.getElementById('warn-student');
    const student = studentSelect.value;
    const warning = document.getElementById('warn-text').value.trim();

    if (!student || !warning) {
        alert('Заполните все поля');
        return;
    }

    try {
        await addDoc(collection(db, "warnings"), {
            student,
            warning,
            date: new Date().toISOString().split('T')[0]
        });
        alert('Предупреждение добавлено!');
        document.getElementById('warn-text').value = '';
        loadWarningsForManagement(); // обновляем список предупреждений после добавления
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// ========== УПРАВЛЕНИЕ ПРЕДУПРЕЖДЕНИЯМИ (список + удаление) ==========
async function loadWarningsForManagement() {
    const container = document.getElementById('warnings-manage-list');
    if (!container) return;

    const q = query(collection(db, "warnings"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const warnings = [];
    snapshot.forEach(doc => warnings.push({ id: doc.id, ...doc.data() }));

    if (warnings.length === 0) {
        container.innerHTML = '<p>Нет предупреждений</p>';
        return;
    }

    let html = '<table style="width:100%; border-collapse: collapse;">';
    html += '<thead><tr><th>Дата</th><th>Студент</th><th>Предупреждение</th><th>Действие</th></tr></thead><tbody>';
    warnings.forEach(w => {
        html += `
            <tr style="border-bottom:1px solid #F0F0F0;">
                <td style="padding:0.5rem;">${w.date || ''}</td>
                <td style="padding:0.5rem;">${escapeHtml(w.student)}</td>
                <td style="padding:0.5rem;">${escapeHtml(w.warning)}</td>
                <td style="padding:0.5rem;">
                    <button class="btn btn-outline" onclick="deleteWarning('${w.id}')" style="padding:0.2rem 0.6rem;">Удалить</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

window.deleteWarning = async function(warningId) {
    if (!confirm('Удалить предупреждение?')) return;
    try {
        await deleteDoc(doc(db, "warnings", warningId));
        alert('Предупреждение удалено');
        loadWarningsForManagement(); // обновляем список
        // Если нужно, можно также обновить статистику на главной, но она обновится при следующей загрузке
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// ========== ПРОПУСКИ (ОТСУТСТВИЯ) ==========
async function loadStudentsForAbsence() {
    const select = document.getElementById('absence-student');
    if (!select) return;
    const snapshot = await getDocs(collection(db, "students"));
    const students = [];
    snapshot.forEach(doc => students.push({ id: doc.id, name: doc.data().name }));
    students.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    select.innerHTML = '<option value="">-- Выберите студента --</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.name;
        option.textContent = student.name;
        select.appendChild(option);
    });
}

window.addAbsence = async function() {
    const studentSelect = document.getElementById('absence-student');
    const student = studentSelect.value;
    const date = document.getElementById('absence-date').value;
    const pair = parseInt(document.getElementById('absence-pair').value);
    const reason = document.getElementById('absence-reason').value.trim();

    if (!student || !date || !pair) {
        alert('Выберите студента, дату и пару');
        return;
    }

    const hours = 2; // 1 пара = 2 часа

    try {
        await addDoc(collection(db, "absences"), {
            student: student,
            date: date,
            pair: pair,
            hours: hours,
            reason: reason || '',
            createdAt: new Date().toISOString()
        });
        alert('Пропуск добавлен!');
        document.getElementById('absence-reason').value = '';
    } catch (error) {
        console.error(error);
        alert('Ошибка: ' + error.message);
    }
};

// ========== ЗАГРУЗКА ФАЙЛОВ (прокси) ==========
const PROXY_URL = 'https://pks-upload-proxy-qear.vercel.app/api/upload';

window.uploadMaterial = async function() {
    const subject = document.getElementById('material-subject').value;
    const type = document.getElementById('material-type').value;
    const displayName = document.getElementById('material-name').value.trim();
    const fileInput = document.getElementById('material-file');
    const file = fileInput.files[0];

    if (!subject || !type || !displayName || !file) {
        alert('Заполните все поля и выберите файл');
        return;
    }

    const progressDiv = document.getElementById('upload-progress');
    progressDiv.style.display = 'block';
    progressDiv.textContent = 'Загрузка на сервер...';

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('displayName', displayName);
    formData.append('type', type);
    formData.append('file', file);

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Ошибка сервера: ${response.status}`);
        }
        await addDoc(collection(db, "materials"), {
            subject: subject,
            name: displayName,
            fileUrl: result.fileUrl,
            fileName: file.name,
            type: type,
            createdAt: new Date().toISOString()
        });
        progressDiv.style.display = 'none';
        alert('✅ Материал успешно загружен!');
        document.getElementById('material-name').value = '';
        document.getElementById('material-file').value = '';
    } catch (error) {
        console.error(error);
        progressDiv.style.display = 'none';
        alert('Ошибка: ' + error.message);
    }
};

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadStudentsToSelect();
displayStudentList();
loadStudentsForAbsence();
loadWarningsForManagement(); // ← загружаем список предупреждений в админке