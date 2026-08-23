// =======================================================================
//  Гортання книжки + перемикач між книжками
// =======================================================================

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const book = document.getElementById('book');
const switcher = document.getElementById('book-switcher');

// --- Стан ---
let currentBookIndex = 0;
let pages = [];          // DOM-елементи сторінок поточної книги
let numPages = 0;
let currentPage = 1;
let zIndexCounter = 0;

// =======================================================================
//  ПОБУДОВА СТОРІНОК З ДАНИХ
// =======================================================================

// Двозначний номер: 3 -> "03"
function pad2(n) {
    return String(n).padStart(2, '0');
}

// Шлях до ілюстрації: книга 2, ілюстрація 7 -> img/02_07.png
function imagePath(bookNum, imgId) {
    const name = (imgId === 'Cover') ? 'Cover' : pad2(imgId);
    return `img/${pad2(bookNum)}_${name}.png`;
}

// Створює вміст одного боку сторінки
function buildSide(side, bookNum) {
    if (!side) return '';

    if (side.img !== undefined) {
        const src = imagePath(bookNum, side.img);
        const label = src.split('/').pop();
        // Якщо ілюстрації ще немає — показуємо охайну заглушку
        return `<img src="${src}" alt="" data-file="${label}"
                     onerror="showPlaceholder(this)">`;
    }

    if (side.text) {
        let html = `<p><b>${side.text.join('<br>\n')}</b></p>`;
        if (side.note) {
            html += `<p class="note">${side.note}</p>`;
        }
        return html;
    }

    if (side.plain) {
        return `<p>${side.plain}</p>`;
    }

    if (side.heading) {
        return `<h2>${side.heading}</h2>`;
    }

    return '';
}

// Заглушка замість відсутньої ілюстрації
function showPlaceholder(img) {
    const box = document.createElement('div');
    box.className = 'img-placeholder';
    box.innerHTML = `<i class="fas fa-image"></i><span>${img.dataset.file}</span>`;
    img.replaceWith(box);
}

// Малює всю книгу
function renderBook(bookIndex) {
    const data = BOOKS[bookIndex];
    currentBookIndex = bookIndex;

    book.innerHTML = data.pages.map((page, i) => {
        let cls = 'page';
        if (i === 0) cls += ' cover';
        if (i === data.pages.length - 1) cls += ' cover-back';

        return `
            <div class="${cls}" id="p${i + 1}">
                <div class="front">${buildSide(page.front, data.num)}</div>
                <div class="back">${buildSide(page.back, data.num)}</div>
            </div>`;
    }).join('');

    document.title = data.title;

    // Скидаємо стан гортання
    pages = book.querySelectorAll('.page');
    numPages = pages.length;
    currentPage = 1;
    zIndexCounter = numPages;

    pages.forEach((page, index) => {
        page.style.zIndex = numPages - index;
    });

    updateSwitcherState();
    updateBookState();
}

// =======================================================================
//  ПЕРЕМИКАЧ КНИЖОК
// =======================================================================

function renderSwitcher() {
    switcher.innerHTML = BOOKS.map((b, i) =>
        `<button class="book-tab" data-index="${i}">${b.title}</button>`
    ).join('');

    switcher.querySelectorAll('.book-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.index);
            if (index !== currentBookIndex) {
                renderBook(index);
            }
        });
    });
}

function updateSwitcherState() {
    switcher.querySelectorAll('.book-tab').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.index) === currentBookIndex);
    });
}

// =======================================================================
//  ГОРТАННЯ
// =======================================================================

function updateBookState() {
    // Керування тінню
    if (currentPage === 1 || currentPage > numPages) {
        book.classList.add('closed');
    } else {
        book.classList.remove('closed');
    }

    // Керування кнопкою "Назад"
    if (currentPage === 1) {
        prevBtn.classList.add('hidden');
    } else {
        prevBtn.classList.remove('hidden');
    }

    // Керування кнопкою "Вперед"
    if (currentPage > numPages) {
        nextBtn.classList.add('hidden');
    } else {
        nextBtn.classList.remove('hidden');
    }
}

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

// =======================================================================
//  СТАРТ
// =======================================================================

nextBtn.addEventListener('click', goNextPage);
prevBtn.addEventListener('click', goPrevPage);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNextPage();
    if (e.key === 'ArrowLeft') goPrevPage();
});

renderSwitcher();
renderBook(0);
