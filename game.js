// ==========================================
// 1. إعدادات المتغيرات الأساسية والـ Canvas
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// إعدادات الشبكة
const ROWS = 8;
const COLS = 8;
let cellSize = 0; // سيتم حسابه بناءً على حجم الشاشة
let grid = []; // المصفوفة التي ستحفظ حالة اللعبة

let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
highScoreElement.innerText = highScore;

// ==========================================
// 2. تهيئة اللعبة (Initialization)
// ==========================================
function initGame() {
    // ضبط حجم الـ Canvas ليكون متجاوباً (Responsive)
    const containerWidth = Math.min(window.innerWidth - 40, 500);
    canvas.width = containerWidth;
    // الارتفاع سيكون عبارة عن الشبكة + مساحة سفلية للقطع الـ 3
    canvas.height = containerWidth + 150; 
    
    cellSize = containerWidth / COLS;

    // تصفير الشبكة (0 يعني المربع فارغ)
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    
    score = 0;
    updateScoreUI();
    drawGame();
}

// ==========================================
// 3. الرسم على الشاشة (Rendering)
// ==========================================
function drawGame() {
    // مسح الشاشة بالكامل قبل إعادة الرسم
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    // لاحقاً سنضيف دالة رسم القطع (Blocks) هنا
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // رسم المربع
            ctx.fillStyle = grid[r][c] === 0 ? '#334155' : '#10b981'; // رمادي للفارغ، أخضر للممتلئ
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4); // إضافة هامش بسيط (Gap)
            
            // رسم حدود خفيفة (تأثير بصري)
            ctx.strokeStyle = '#0f172a';
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
    }
}

// ==========================================
// 4. نظام النقاط
// ==========================================
function addScore(points) {
    score += points;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('blockBlastHighScore', highScore);
    }
    updateScoreUI();
}

function updateScoreUI() {
    scoreElement.innerText = score;
    highScoreElement.innerText = highScore;
}

// ==========================================
// 5. الأحداث (Events)
// ==========================================
restartBtn.addEventListener('click', initGame);

// تشغيل اللعبة عند تحميل الصفحة
window.onload = initGame;
window.addEventListener('resize', initGame);
