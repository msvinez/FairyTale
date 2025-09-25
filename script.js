// Отримуємо посилання на елементи DOM

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const book = document.getElementById('book');
const pages = document.querySelectorAll('.page');

// Змінні для відстеження стану книги

const numPages = pages.length;
let currentPage = 1;

// Лічильник для z-index, щоб кожна наступна дія була поверх попередньої

let zIndexCounter = numPages; 

// Встановлюємо початкові z-index для сторінок

pages.forEach((page, index) => {
    page.style.zIndex = numPages - index;
});

// Обробники подій для кнопок

nextBtn.addEventListener('click', goNextPage);
prevBtn.addEventListener('click', goPrevPage);



function goNextPage() {

// Перевіряємо, чи не остання це сторінка (саму задню обкладинку гортати не можна)

if (currentPage > numPages) {
    return;
}



 // Знаходимо поточну сторінку

 const pageToFlip = document.getElementById(`p${currentPage}`);

 // Робимо сторінку, що гортається, найвищою

 zIndexCounter++;

 pageToFlip.style.zIndex = zIndexCounter;

 // "Перегортаємо" її

 pageToFlip.classList.add('flipped');

 // Переходимо до наступної сторінки

 currentPage++;

}



function goPrevPage() {

// Перевіряємо, чи не перша це сторінка

if (currentPage <= 1) {
    return;
}



// Переходимо до попередньої сторінки

currentPage--;

// Знаходимо сторінку, яку треба "повернути"

const pageToUnflip = document.getElementById(`p${currentPage}`);

// Робимо сторінку, що повертається, найвищою

zIndexCounter++;
pageToUnflip.style.zIndex = zIndexCounter;

// "Повертаємо" її

pageToUnflip.classList.remove('flipped');
}