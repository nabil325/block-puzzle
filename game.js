const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');

// إعدادات اللعبة الثابتة
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let level = 1; 
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#2dd4bf' },
    { matrix: [[1, 1], [1, 1]], color: '#fbbf24' },
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#f87171' },
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#4ade80' }
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// دالة البدء (لا تحتوي على أي إشارة لزر الإعادة)
function initGame() {
    const containerWidth = Math.min(window.innerWidth - 60, 380); 
    canvas.width = containerWidth;
    canvas.height = containerWidth + 160; 
    cellSize = containerWidth / COLS;

    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    
    updateScoreUI();
    spawnPieces();
    render();
}

function spawnPieces() {
    availablePieces = [];
    for (let i = 0; i < 3; i++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        availablePieces.push({
            ...shape,
            x: (canvas.width / 3) * i + 10,
            y: canvas.width + 40,
            originalX: (canvas.width / 3) * i + 10,
            originalY: canvas.width + 40,
            scale: 0.5,
            active: true
        });
    }
}

// رسم المربعات (الشبكة والقطع المستقرة)
function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // رسم مربعات الخلفية (الشبكة الرمادية)
            ctx.fillStyle = "#1e293b"; 
            drawSquare(x + 2, y + 2, cellSize - 4, 6);
            
            // رسم القطع التي تم وضعها
            if (grid[r][c] !== 0) {
                ctx.fillStyle = grid[r][c];
                drawSquare(x + 4, y + 4, cellSize - 8, 5);
            }
        }
    }
}

function drawSquare(x, y, size, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // رسم القطع الثلاث المتاحة بالأسفل
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const s = piece.scale * cellSize;
        ctx.fillStyle = piece.color;
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    drawSquare(piece.x + (c * s), piece.y + (r * s), s - 2, 4);
                }
            });
        });
    });
}

function placePiece(p, row, col) {
    p.matrix.forEach((rMat, r) => {
        rMat.forEach((cell, c) => {
            if (cell) grid[row + r][col + c] = p.color;
        });
    });
    p.active = false;
    score += 10;
    
    checkLines();

    if (availablePieces.every(pc => !pc.active)) {
        spawnPieces();
    }

    // فحص الخسارة (إذا لم يوجد مكان لأي قطعة)
    if (!canMovePossible()) {
        setTimeout(() => {
            alert("انتهت اللعبة! المستوى: " + level);
            initGame();
        }, 200);
    }

    // زيادة المستوى
    if (score > level * 500) level++;
    updateScoreUI();
}

function canMovePossible() {
    const activePieces = availablePieces.filter(p => p.active);
    if (activePieces.length === 0) return true;

    for (let piece of activePieces) {
        for (let r = 0; r <= ROWS - piece.matrix.length; r++) {
            for (let c = 0; c <= COLS - piece.matrix[0].length; c++) {
                if (canPlace(piece, r, c)) return true;
            }
        }
    }
    return false;
}

function canPlace(piece, row, col) {
    for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c]) {
                if (row + r < 0 || row + r >= ROWS || col + c < 0 || col + c >= COLS || grid[row + r][col + c] !== 0) return false;
            }
        }
    }
    return true;
}

function checkLines() {
    let tr = [], tc = [];
    for (let r = 0; r < ROWS; r++) if (grid[r].every(v => v !== 0)) tr.push(r);
    for (let c = 0; c < COLS; c++) {
        let full = true;
        for (let r = 0; r < ROWS; r++) if (grid[r][c] === 0) full = false;
        if (full) tc.push(c);
    }
    tr.forEach(r => grid[r].fill(0));
    tc.forEach(c => { for (let r = 0; r < ROWS; r++) grid[r][c] = 0; });
    if (tr.length > 0 || tc.length > 0) score += 100;
}

function updateScoreUI() {
    scoreElement.innerText = score;
    highScore = Math.max(score, highScore);
    localStorage.setItem('blockBlastHighScore', highScore);
    highScoreElement.innerText = highScore;
}

// السحب والتحكم
function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + (p.matrix[0].length * p.scale * cellSize) + 20 && 
            y > p.y && y < p.y + (p.matrix.length * p.scale * cellSize) + 20) {
            draggingPiece = p; p.scale = 1.0;
            dragOffsetX = (p.matrix[0].length * cellSize) / 2;
            dragOffsetY = (p.matrix.length * cellSize) / 2;
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = ((e.clientX || e.touches[0].clientX) - rect.left) - dragOffsetX;
    draggingPiece.y = ((e.clientY || e.touches[0].clientY) - rect.top) - dragOffsetY - 60;
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    const gCol = Math.round(draggingPiece.x / cellSize);
    const gRow = Math.round(draggingPiece.y / cellSize);
    if (canPlace(draggingPiece, gRow, gCol)) placePiece(draggingPiece, gRow, gCol);
    else { draggingPiece.x = draggingPiece.originalX; draggingPiece.y = draggingPiece.originalY; draggingPiece.scale = 0.5; }
    draggingPiece = null; render();
}

canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDrag, {passive: false});
window.addEventListener('touchmove', (e) => { if(draggingPiece) { e.preventDefault(); doDrag(e); } }, {passive: false});
window.addEventListener('touchend', endDrag);

window.onload = initGame;
