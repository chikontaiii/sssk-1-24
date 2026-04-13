import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ========== УПРАВЛЕНИЕ СТУДЕНТАМИ ==========

async function loadStudentsToSelect() {
    const studentSelect = document.getElementById('warn-student');
    if (!studentSelect) return;

    const snapshot = await getDocs(collection(db, "students"));
    const students = [];
    snapshot.forEach(doc => {
        students.push({ id: doc.id, name: doc.data().name });
    });
    // Сортировка по имени (русские буквы корректно)
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
            <span>${student.name}</span>
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
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// ========== ПРОПУСКИ (ОТСУТСТВИЯ) ==========
// Загрузка студентов для выпадающего списка пропусков
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

// Добавление пропуска
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

    const hours = 2;

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

// Вызвать загрузку студентов для пропусков при инициализации
loadStudentsForAbsence();

// ========== ЗАГРУЗКА ФАЙЛОВ ==========
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadStudentsToSelect();
displayStudentList();