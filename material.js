// materials.js
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function loadMaterials() {
    // Запрашиваем все документы из коллекции "materials", сортируем по дате создания (новые сверху)
    const materialsQuery = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(materialsQuery);

    // Очищаем все списки файлов перед заполнением (чтобы не было дублей)
    document.querySelectorAll('.file-list').forEach(ul => ul.innerHTML = '');

    snapshot.forEach(doc => {
        const material = doc.data();
        const subject = material.subject; // Например "Программирование"

        // Ищем папку, заголовок которой совпадает с названием предмета
        const folder = Array.from(document.querySelectorAll('.subject-folder')).find(f => {
            const h4 = f.querySelector('h4');
            return h4 && h4.textContent.trim() === subject;
        });

        if (folder) {
            const fileList = folder.querySelector('.file-list');
            if (fileList) {
                // Создаём элемент списка с ссылкой на файл
                const li = document.createElement('li');
                li.innerHTML = `<a href="${material.fileUrl}" target="_blank" class="file-item"><span class="file-icon">📄</span> ${material.name}</a>`;
                fileList.appendChild(li);
            }
        } else {
            console.warn(`Папка для предмета "${subject}" не найдена на странице.`);
        }
    });
}

loadMaterials();