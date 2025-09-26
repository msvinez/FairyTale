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

// --- НОВА ФУНКЦІЯ для керування тінню ---
function updateBookState() {
    if (currentPage === 1 || currentPage > numPages) {
        book.classList.add('closed');
    } else {
        book.classList.remove('closed');
    }
}

// Встановлюємо початкові z-index для сторінок
pages.forEach((page, index) => {
    page.style.zIndex = numPages - index;
});

// Обробники подій для кнопок
nextBtn.addEventListener('click', goNextPage);
prevBtn.addEventListener('click', goPrevPage);

// --- ВИКЛИКАЄМО ФУНКЦІЮ ПРИ ЗАВАНТАЖЕННІ ---
updateBookState();


function goNextPage() {
    // Перевіряємо, чи не остання це сторінка
    if (currentPage > numPages) {
        return;
    }

    const pageToFlip = document.getElementById(`p${currentPage}`);
    zIndexCounter++;
    pageToFlip.style.zIndex = zIndexCounter;
    pageToFlip.classList.add('flipped');
    currentPage++;
    
    // --- ОНОВЛЮЄМО СТАН КНИГИ ---
    updateBookState();
}

function goPrevPage() {
    // Перевіряємо, чи не перша це сторінка
    if (currentPage <= 1) {
        return;
    }

    currentPage--;
    const pageToUnflip = document.getElementById(`p${currentPage}`);
    zIndexCounter++;
    pageToUnflip.style.zIndex = zIndexCounter;
    pageToUnflip.classList.remove('flipped');

    // --- ОНОВЛЮЄМО СТАН КНИГИ ---
    updateBookState();
}
