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

// 2. تعريف الأشكال (Shapes)
const SHAPES = [
    { matrix: [[1, 1], [1, 1]], color: '#f87171' }, // مربع 2x2
    { matrix: [[1, 1, 1]], color: '#60a5fa' },       // خط أفقي 3
    { matrix: [[1], [1], [1]], color: '#34d399' },   // خط عمودي 3
    { matrix: [[1, 0], [1, 0], [1, 1]], color: '#fbbf24' }, // حرف L
    { matrix: [[1]], color: '#a78bfa' }              // مربع واحد
];

let availablePieces = []; // القطع الثلاث التي تظهر بالأسفل
let draggingPiece = null;  // القطعة التي يتم سحبها حالياً
let dragOffsetX = 0;
let dragOffsetY = 0;

function initGame() {
    const containerWidth = Math.min(window.innerWidth - 40, 500);
    canvas.width = containerWidth;
    canvas.height = containerWidth + 160; 
    cellSize = containerWidth / COLS;

    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    highScoreElement.innerText = highScore;
    
    spawnPieces(); // توليد قطع جديدة
    render();
}

// توليد 3 قطع عشوائية
function spawnPieces() {
    availablePieces = [];
    for (let i = 0; i < 3; i++) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        availablePieces.push({
            ...randomShape,
            x: (canvas.width / 3) * i + 20,
            y: canvas.width + 20,
            originalX: (canvas.width / 3) * i + 20,
            originalY: canvas.width + 20,
            width: randomShape.matrix[0].length * (cellSize * 0.8),
            height: randomShape.matrix.length * (cellSize * 0.8),
            active: true
        });
    }
}

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
            ctx.fillStyle = grid[r][c] === 0 ? '#334155' : grid[r][c];
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
    }
}

function drawAvailablePieces() {
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const size = cellSize * 0.8; // تصغير القطع بالأسفل قليلاً
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

// --- نظام السحب والإفلات (Touch & Mouse) ---

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', doDrag);
canvas.addEventListener('mouseup', endDrag);

canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); doDrag(e.touches[0]); }, {passive: false});
canvas.addEventListener('touchend', endDrag);

function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    availablePieces.forEach(piece => {
        if (piece.active && mouseX >= piece.x && mouseX <= piece.x + piece.width &&
            mouseY >= piece.y && mouseY <= piece.y + piece.height) {
            draggingPiece = piece;
            dragOffsetX = mouseX - piece.x;
            dragOffsetY = mouseY - piece.y;
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = (e.clientX - rect.left) - dragOffsetX;
    draggingPiece.y = (e.clientY - rect.top) - dragOffsetY;
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    
    // هنا سنضيف لاحقاً منطق "إسقاط القطعة" في الشبكة
    // حالياً: القطعة تعود لمكانها إذا تركتها
    draggingPiece.x = draggingPiece.originalX;
    draggingPiece.y = draggingPiece.originalY;
    
    draggingPiece = null;
    render();
}

restartBtn.addEventListener('click', initGame);
window.onload = initGame;
