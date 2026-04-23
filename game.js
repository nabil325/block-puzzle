const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// 1. الإعدادات الأساسية
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

// 2. تعريف الأشكال (نفس أشكال Block Blast)
const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#38bdf8' }, // خط طويل 4
    { matrix: [[1, 1], [1, 1]], color: '#fbbf24' }, // مربع 2x2
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a78bfa' }, // حرف T
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#f87171' }, // شكل Z
    { matrix: [[1, 0], [1, 0], [1, 1]], color: '#fb923c' }, // حرف L
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#34d399' }, // حرف L مقلوب
    { matrix: [[1, 1, 1], [0, 1, 0], [0, 1, 0]], color: '#60a5fa' }, // حرف T كبير
    { matrix: [[1]], color: '#94a3b8' } // مربع صغير 1x1
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initGame() {
    const containerWidth = Math.min(window.innerWidth - 40, 500);
    canvas.width = containerWidth;
    canvas.height = containerWidth + 180; 
    cellSize = containerWidth / COLS;

    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    updateScoreUI();
    spawnPieces();
    render();
}

function spawnPieces() {
    availablePieces = [];
    for (let i = 0; i < 3; i++) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        availablePieces.push({
            ...randomShape,
            x: (canvas.width / 3) * i + 10,
            y: canvas.width + 30,
            originalX: (canvas.width / 3) * i + 10,
            originalY: canvas.width + 30,
            active: true
        });
    }
}

// --- منطق اللعبة (Game Logic) ---

function canPlace(piece, gridRow, gridCol) {
    for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c]) {
                let targetR = gridRow + r;
                let targetC = gridCol + c;
                if (targetR >= ROWS || targetC >= COLS || targetR < 0 || targetC < 0 || grid[targetR][targetC] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(piece, gridRow, gridCol) {
    piece.matrix.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell) grid[gridRow + r][gridCol + c] = piece.color;
        });
    });
    piece.active = false;
    addScore(10); 
    checkLines();
    
    // إذا انتهت القطع الـ 3، نولد قطعاً جديدة
    if (availablePieces.every(p => !p.active)) spawnPieces();
}

function checkLines() {
    let rowsToDelete = [];
    let colsToDelete = [];

    // فحص الصفوف
    for (let r = 0; r < ROWS; r++) {
        if (grid[r].every(cell => cell !== 0)) rowsToDelete.push(r);
    }
    // فحص الأعمدة
    for (let c = 0; c < COLS; c++) {
        let colFull = true;
        for (let r = 0; r < ROWS; r++) {
            if (grid[r][c] === 0) colFull = false;
        }
        if (colFull) colsToDelete.push(c);
    }

    // حذف الصفوف والأعمدة وإضافة نقاط
    rowsToDelete.forEach(r => grid[r].fill(0));
    colsToDelete.forEach(c => {
        for (let r = 0; r < ROWS; r++) grid[r][c] = 0;
    });

    if (rowsToDelete.length > 0 || colsToDelete.length > 0) {
        addScore((rowsToDelete.length + colsToDelete.length) * 100);
    }
}

// --- الرسم (Rendering) ---

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawAvailablePieces();
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            ctx.fillStyle = grid[r][c] === 0 ? '#1e293b' : grid[r][c];
            ctx.shadowBlur = grid[r][c] === 0 ? 0 : 10;
            ctx.shadowColor = grid[r][c];
            ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
            ctx.shadowBlur = 0; // إعادة تعيين التوهج
        }
    }
}

function drawAvailablePieces() {
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const size = cellSize * 0.7;
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(piece.x + c * size, piece.y + r * size, size - 2, size - 2);
                }
            });
        });
    });
}

// --- التحكم (Controls) ---

function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + 100 && y > p.y && y < p.y + 100) {
            draggingPiece = p;
            dragOffsetX = x - p.x;
            dragOffsetY = y - p.y;
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = ((e.clientX || e.touches[0].clientX) - rect.left) - dragOffsetX;
    draggingPiece.y = ((e.clientY || e.touches[0].clientY) - rect.top) - dragOffsetY;
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    
    // حساب أقرب مربع في الشبكة
    const gridCol = Math.round(draggingPiece.x / cellSize);
    const gridRow = Math.round(draggingPiece.y / cellSize);

    if (canPlace(draggingPiece, gridRow, gridCol)) {
        placePiece(draggingPiece, gridRow, gridCol);
    } else {
        // العودة لمكانه الأصلي
        draggingPiece.x = draggingPiece.originalX;
        draggingPiece.y = draggingPiece.originalY;
    }
    
    draggingPiece = null;
    render();
}

canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);

function addScore(pts) { score += pts; if(score > highScore) { highScore = score; localStorage.setItem('blockBlastHighScore', highScore); } updateScoreUI(); }
function updateScoreUI() { scoreElement.innerText = score; highScoreElement.innerText = highScore; }
restartBtn.addEventListener('click', initGame);
window.onload = initGame;
