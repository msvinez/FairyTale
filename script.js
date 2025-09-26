// Отримуємо посилання на елементи DOM
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const book = document.getElementById('book');
const pages = document.querySelectorAll('.page');

// Змінні для відстеження стану книги
const numPages = pages.length;
let currentPage = 1;

// Лічильник для z-index
let zIndexCounter = numPages;

// --- ОНОВЛЕНА ФУНКЦІЯ для керування станом книги ---
function updateBookState() {
    // Керування тінню
    if (currentPage === 1 || currentPage > numPages) {
        book.classList.add('closed');
    } else {
        book.classList.remove('closed');
    }

    // --- НОВИЙ КОД: Керування кнопкою "Назад" ---
    if (currentPage === 1) {
        prevBtn.classList.add('hidden');
    } else {
        prevBtn.classList.remove('hidden');
    }

    // --- НОВИЙ КОД: Керування кнопкою "Вперед" ---
    if (currentPage > numPages) {
        nextBtn.classList.add('hidden');
    } else {
        nextBtn.classList.remove('hidden');
    }
}

// Встановлюємо початкові z-index для сторінок
pages.forEach((page, index) => {
    page.style.zIndex = numPages - index;
});

// Обробники подій для кнопок
nextBtn.addEventListener('click', goNextPage);
prevBtn.addEventListener('click', goPrevPage);

// Викликаємо функцію при завантаженні для налаштування початкового стану
updateBookState();


function goNextPage() {
    if (currentPage > numPages) {
        return;
    }

    const pageToFlip = document.getElementById(`p${currentPage}`);
    zIndexCounter++;
    pageToFlip.style.zIndex = zIndexCounter;
    pageToFlip.classList.add('flipped');
    currentPage++;
    
    updateBookState();
}

function goPrevPage() {
    if (currentPage <= 1) {
        return;
    }

    currentPage--;
    const pageToUnflip = document.getElementById(`p${currentPage}`);
    zIndexCounter++;
    pageToUnflip.style.zIndex = zIndexCounter;
    pageToUnflip.classList.remove('flipped');

    updateBookState();
}
