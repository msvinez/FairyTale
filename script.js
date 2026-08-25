// =======================================================================
//  Гортання книжки + перемикач між книжками
// =======================================================================

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const book = document.getElementById('book');
const switcher = document.getElementById('book-switcher');

// --- Стан ---
let BOOKS = [];          // Заповнюється асинхронно з books/<id>/book.txt
let currentBookIndex = 0;
let pages = [];          // DOM-елементи сторінок поточної книги
let numPages = 0;
let currentPage = 1;
let zIndexCounter = 0;

// =======================================================================
//  ЧИТАННЯ book.txt
// =======================================================================

// Двозначний номер: 3 -> "03"
function pad2(n) {
    return String(n).padStart(2, '0');
}

// Розбирає текстовий файл книги у структуру:
// { title, groups: [{ stanzas: [[рядок,...], ...], note? }], end, interludeFront, interludeBack, teaser }
//
// Формат book.txt:
//   TITLE: Назва книги
//
//   Куплет (4 рядки)
//
//   Наступний куплет — окрема сторінка за замовчуванням.
//   Рядок "&" між куплетами об'єднує їх на одній сторінці.
//   Рядок, що починається з "*" одразу під куплетом — виноска.
//
//   END: Кінець               (необов'язково — текст на звороті останньої сторінки)
//   INTERLUDE: Але... / Ще сцени після титрів!   (необов'язково)
//   TEASER: Далі буде!        (необов'язково — напис під останньою бонус-ілюстрацією)
//
//   Ілюстрації до куплетів: img/01.png, img/02.png, ... (по порядку тексту)
//   Бонус-ілюстрації після титрів: окрема нумерація в img/extra/01.png, 02.png, ...
//   Бонус-теку можна поповнювати незалежно — вона не залежить від кількості
//   сторінок з віршем.
function parseBookText(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');

    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    const titleMatch = (lines[i] || '').match(/^TITLE:\s*(.*)$/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    i++;

    const groups = [];
    let pendingMerge = false;
    let end = null, interludeFront = null, interludeBack = null, teaser = null;
    let currentLines = [];

    // Завершує накопичений куплет: віддає його як нову сторінку,
    // або долучає до попередньої, якщо перед ним був рядок "&"
    function flushStanza() {
        if (currentLines.length === 0) return;
        let stanzaLines = currentLines;
        currentLines = [];

        let note = null;
        if (stanzaLines[stanzaLines.length - 1].startsWith('*')) {
            note = stanzaLines[stanzaLines.length - 1];
            stanzaLines = stanzaLines.slice(0, -1);
        }

        if (pendingMerge && groups.length > 0) {
            groups[groups.length - 1].stanzas.push(stanzaLines);
            if (note) groups[groups.length - 1].note = note;
        } else {
            groups.push({ stanzas: [stanzaLines], note: note || undefined });
        }
        pendingMerge = false;
    }

    for (let li = i; li < lines.length; li++) {
        const line = lines[li].trim();

        if (line === '') { flushStanza(); continue; }
        if (line === '&') { flushStanza(); pendingMerge = true; continue; }

        const endMatch = line.match(/^END:\s*(.*)$/);
        if (endMatch) { flushStanza(); end = endMatch[1].trim(); continue; }

        const interludeMatch = line.match(/^INTERLUDE:\s*(.*)$/);
        if (interludeMatch) {
            flushStanza();
            const parts = interludeMatch[1].split('/').map(s => s.trim());
            interludeFront = parts[0] || '';
            interludeBack = parts[1] || '';
            continue;
        }

        const teaserMatch = line.match(/^TEASER:\s*(.*)$/);
        if (teaserMatch) { flushStanza(); teaser = teaserMatch[1].trim(); continue; }

        currentLines.push(line);
    }
    flushStanza();

    return { title, groups, end, interludeFront, interludeBack, teaser };
}

// Перевіряє, чи існує ілюстрація за шляхом
function probeImageExists(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
}

// Рахує, скільки послідовних ілюстрацій existує за шаблоном шляху,
// починаючи з startNum (зупиняється на першій відсутній)
async function probeSequential(pathFn, startNum, maxProbe = 60) {
    let count = 0;
    for (let n = startNum; n < startNum + maxProbe; n++) {
        const exists = await probeImageExists(pathFn(n));
        if (!exists) break;
        count++;
    }
    return count;
}

// Перетворює розібраний текст книги (+ кількість основних та бонус-
// ілюстрацій) у масив сторінок, як раніше вручну писався в books.js
//
// ВАЖЛИВО про розкладку: лицьова й зворотна сторони одного аркуша
// ніколи не видно одночасно (фізика перегортання) — видно завжди
// ЗВОРОТ попереднього аркуша поруч із ЛИЦЕМ поточного. Тож щоб
// ілюстрація N реально стояла в одному розвороті з куплетом N, вона
// лежить на звороті ПОПЕРЕДНЬОГО аркуша (аркуш куплету N-1), а не
// свого власного. Обкладинка бере на звороті ілюстрацію 1 (вона стоїть
// поруч із куплетом 1, щойно розгорнеш книгу).
function buildPages(parsed, extraCount, mainImageCount) {
    const groups = parsed.groups;
    const P = groups.length;
    const M = mainImageCount;
    const N = Math.max(P, M);
    const pages = [];

    pages.push({ front: { img: 'Cover' }, back: { img: 1 } });

    for (let j = 1; j <= N; j++) {
        let front;
        if (j <= P) {
            const g = groups[j - 1];
            const textArr = [];
            g.stanzas.forEach((stanzaLines, si) => {
                if (si > 0) textArr.push('');
                textArr.push(...stanzaLines);
            });
            front = { text: textArr };
            if (g.note) front.note = g.note;
        } else {
            front = { plain: '(очікує на текст)' };
        }

        // Ілюстрація завжди "очікується" на звороті — якщо файла ще
        // немає, <img onerror> сам покаже охайну заглушку з назвою
        // файлу. Виняток лише для останньої сторінки: там натомість
        // "Кінець", а не заглушка під ілюстрацію, якої свідомо не буде.
        const back = (j === N && parsed.end)
            ? { heading: parsed.end }
            : { img: j + 1 };

        pages.push({ front, back });
    }

    if (parsed.interludeFront !== null || parsed.interludeBack !== null) {
        pages.push({
            front: { plain: parsed.interludeFront || '' },
            back: { plain: parsed.interludeBack || '' }
        });
    }

    // Бонус-ілюстрації з img/extra/ — власна нумерація, по 2 на сторінку
    let n = 1;
    let teaserPlaced = false;
    while (n <= extraCount) {
        if (n + 1 > extraCount) {
            pages.push({
                front: { img: { extra: true, n } },
                back: parsed.teaser ? { plain: parsed.teaser } : {}
            });
            teaserPlaced = teaserPlaced || !!parsed.teaser;
            n++;
        } else {
            pages.push({
                front: { img: { extra: true, n } },
                back: { img: { extra: true, n: n + 1 } }
            });
            n += 2;
        }
    }

    // Якщо ілюстрацій парна кількість (усі розбились на пари без залишку) —
    // тізер не вмістився на жодну зі сторінок, додаємо для нього окрему останню
    if (parsed.teaser && !teaserPlaced) {
        pages.push({ front: { plain: parsed.teaser }, back: {} });
    }

    return pages;
}

// Завантажує та розбирає одну книгу
async function loadBook(id) {
    const res = await fetch(`books/${id}/book.txt`);
    const raw = await res.text();
    const parsed = parseBookText(raw);

    // M — скільки основних ілюстрацій підряд є у теці (01.png, 02.png, ...)
    const mainImageCount = await probeSequential(
        n => `books/${id}/img/${pad2(n)}.png`, 1
    );
    const extraCount = await probeSequential(
        n => `books/${id}/img/extra/${pad2(n)}.png`, 1
    );

    return {
        id,
        title: parsed.title || id,
        pages: buildPages(parsed, extraCount, mainImageCount)
    };
}

// =======================================================================
//  ПОБУДОВА СТОРІНОК З ДАНИХ
// =======================================================================

// Шлях до ілюстрації: книга '02', ілюстрація 7 -> books/02/img/07.png
// Бонус-ілюстрація: книга '02', extra 3 -> books/02/img/extra/03.png
function imagePath(bookId, imgId) {
    if (imgId === 'Cover') return `books/${bookId}/img/Cover.png`;
    if (typeof imgId === 'object' && imgId.extra) return `books/${bookId}/img/extra/${pad2(imgId.n)}.png`;
    return `books/${bookId}/img/${pad2(imgId)}.png`;
}

// Створює вміст одного боку сторінки
function buildSide(side, bookId) {
    if (!side) return '';

    if (side.img !== undefined) {
        const src = imagePath(bookId, side.img);
        const label = src.split('/').slice(-2).join('/');
        // Якщо ілюстрації ще немає — показуємо охайну заглушку
        return `<img src="${src}" alt="" data-file="${label}"
                     onerror="showPlaceholder(this)">`;
    }

    if (side.text) {
        // Порожній рядок розділяє куплети на окремі <p> —
        // так кожен куплет отримує свою заголовну літеру.
        // Куплети загорнуті в один div, щоб вони лишались
        // єдиним блоком і не розʼїжджались по центруванню.
        const stanzas = side.text.join('\n').split('\n\n');
        let html = '<div>' + stanzas
            .map(stanza => `<p><b>${stanza.split('\n').join('<br>\n')}</b></p>`)
            .join('') + '</div>';
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
                <div class="front">${buildSide(page.front, data.id)}</div>
                <div class="back">${buildSide(page.back, data.id)}</div>
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

async function init() {
    BOOKS = await Promise.all(BOOK_IDS.map(loadBook));
    renderSwitcher();
    renderBook(0);
}

init();
