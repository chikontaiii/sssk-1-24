// animations.js

// 1. Плавный счётчик для всех элементов с атрибутом data-count
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.ceil(target / 50); // шаг / плавность
        const updateCounter = () => {
            current += step;
            if (current >= target) {
                counter.innerText = target;
                return;
            }
            counter.innerText = current;
            requestAnimationFrame(updateCounter);
        };
        updateCounter();
    });
}

// 2. Наблюдатель за появлением элементов (для анимации цифр и блоков)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Добавляем класс visible для fade-on-scroll
            if (entry.target.classList.contains('fade-on-scroll')) {
                entry.target.classList.add('visible');
            }
            // Если внутри блока есть элементы с data-count, запускаем счетчики
            const counters = entry.target.querySelectorAll('[data-count]');
            if (counters.length) {
                counters.forEach(counter => {
                    // Убедимся, что счетчик ещё не запускался
                    if (!counter.classList.contains('counted')) {
                        counter.classList.add('counted');
                        const target = parseInt(counter.getAttribute('data-count'));
                        let current = 0;
                        const step = Math.ceil(target / 50);
                        const update = () => {
                            current += step;
                            if (current >= target) {
                                counter.innerText = target;
                                return;
                            }
                            counter.innerText = current;
                            requestAnimationFrame(update);
                        };
                        update();
                    }
                });
            }
            // Отключаем наблюдение после появления (не обязательно)
            // observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

// Запускаем наблюдение за всеми элементами с классом fade-on-scroll и за блоками со статистикой
document.querySelectorAll('.fade-on-scroll, .stat-card, .rating-card, .absence-day, .nb-day').forEach(el => {
    observer.observe(el);
});

// Для цифр, которые уже видны сразу при загрузке (например, статистика наверху)
document.querySelectorAll('[data-count]').forEach(counter => {
    const parent = counter.closest('.stat-card, .rating-card');
    if (parent && !parent.classList.contains('fade-on-scroll')) {
        // Если родитель не анимируется по скроллу, запускаем счетчик сразу
        const target = parseInt(counter.getAttribute('data-count'));
        if (!isNaN(target) && !counter.classList.contains('counted')) {
            counter.classList.add('counted');
            let current = 0;
            const step = Math.ceil(target / 50);
            const update = () => {
                current += step;
                if (current >= target) {
                    counter.innerText = target;
                    return;
                }
                counter.innerText = current;
                requestAnimationFrame(update);
            };
            update();
        }
    }
});

// 3. Плавная прокрутка для якорных ссылок (если есть)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 4. Для переходов между страницами можно добавить fade-out при клике на ссылку (необязательно)
document.querySelectorAll('a').forEach(link => {
    // Исключаем ссылки с атрибутом target="_blank" и якоря
    if (link.target === '_blank' || link.getAttribute('href')?.startsWith('#')) return;
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && href !== '#' && href !== '') {
            e.preventDefault();
            document.body.style.animation = 'pageFadeOut 0.3s ease forwards';
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        }
    });
});

// Добавляем обратный эффект при загрузке (уже есть в CSS)
window.addEventListener('pageshow', () => {
    document.body.style.animation = 'pageFadeIn 0.6s ease-out';
});

// Дополнительная анимация для fade-out (в CSS нужно добавить)
const style = document.createElement('style');
style.textContent = `
    @keyframes pageFadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);