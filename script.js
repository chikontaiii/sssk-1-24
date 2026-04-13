// script.js – общие функции для модальных окон (без модулей)

function openHomeworkModal() {
    document.getElementById('homeworkModal').classList.add('active');
}

function closeHomeworkModal() {
    document.getElementById('homeworkModal').classList.remove('active');
}

function openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

// Закрытие модального окна при клике вне его содержимого
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
};