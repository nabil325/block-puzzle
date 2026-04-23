const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');

// إعدادات الشبكة والمستويات
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

function initGame() {
    // تحديد الأبعاد بناءً على حجم الشاشة لضمان الظهور
    const containerWidth = Math.min(window.innerWidth - 60, 380); 
    canvas.width = containerWidth;
    canvas.height = containerWidth + 160; 
    cellSize = containerWidth / COLS;

    // تصفير الشبكة
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    
    // إخفاء زر الإعادة فقط إذا كان موجوداً لتجنب الأخطاء
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.style.visibility = 'hidden';

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

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // رسم خلفية الشبكة
            ctx.fillStyle = "#1e293b"; 
            drawRoundedRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
            
            if (grid[r][c] !== 0) {
                ctx.fillStyle = grid[r][c];
                ctx.shadowBlur = 10;
                ctx.shadowColor = grid[r][c];
                drawRoundedRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 5);
                ctx.shadowBlur = 0;
            }
        }
    }
}

function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const s = piece.scale * cellSize;
        ctx.fillStyle = piece.color;
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    drawRoundedRect(piece.x + c * s, piece.y + r * s, s - 2, s - 2, 4);
                }
            });
        });
    });
}

// منطق الخسارة والمستويات
function placePiece(p, row, col) {
    p.matrix.forEach((rMat, r) => {
        rMat.forEach((cell, c) => {
            if (cell) grid[row + r][col + c] = p.color;
        });
    });
    p.active = false;
    score += p.matrix.flat().filter(x => x).length * 10;
    
    checkLines();

    if (availablePieces.every(pc => !pc.active)) {
        spawnPieces();
    }

    if (!canMovePossible()) {
        setTimeout(() => {
            alert("انتهت اللعبة! المستوى: " + level + "\nالنقاط: " + score);
            initGame();
        }, 200);
    }

    let nextLvl = Math.floor(score / 1000) + 1;
    if (nextLvl > level) level = nextLvl;

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
    if (tr.length > 0 || tc.length > 0) score += (tr.length + tc.length) * 100;
}

function updateScoreUI() {
    scoreElement.innerText = score;
    highScore = Math.max(score, highScore);
    localStorage.setItem('blockBlastHighScore', highScore);
    highScoreElement.innerText = highScore;
}

// التحكم بالسحب
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);

function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
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

window.onload = initGame;
