const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// 1. الإعدادات والشبكة (تصغير الإطار قليلاً)
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#00d2ff' },
    { matrix: [[1, 1], [1, 1]], color: '#ffea00' },
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#9d50bb' },
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#ff9966' },
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#00f260' },
    { matrix: [[1, 1, 1]], color: '#4facfe' }
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// نظام صوتي بسيط
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(f, t, d) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
}

function initGame() {
    // جعل الإطار أصغر بنسبة بسيطة ليعطي طابع اللعبة الأصلية
    const containerWidth = Math.min(window.innerWidth - 60, 400); 
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
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        availablePieces.push({
            ...shape,
            x: (canvas.width / 3) * i + 10,
            y: canvas.width + 40,
            originalX: (canvas.width / 3) * i + 10,
            originalY: canvas.width + 40,
            scale: 0.5, // حجم صغير بالأسفل
            active: true
        });
    }
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // رسم مربعات الشبكة الفارغة (مثل اللعبة الأصلية)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            ctx.fillStyle = "#1e293b"; // لون المربع الفارغ
            ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 5);
            ctx.fill();

            // رسم القطع المستقرة مع توهج
            if (grid[r][c] !== 0) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = grid[r][c];
                ctx.fillStyle = grid[r][c];
                ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 5);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
}

// دالة مساعدة لرسم المربعات المنحنية (لجمالية التصميم)
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // رسم "خيال" القطعة (Ghost) تحت مكان السحب لإظهار أين ستسقط
    if (draggingPiece) {
        const gCol = Math.round(draggingPiece.x / cellSize);
        const gRow = Math.round(draggingPiece.y / cellSize);
        if (canPlace(draggingPiece, gRow, gCol)) {
            ctx.globalAlpha = 0.3;
            draggingPiece.matrix.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        ctx.fillStyle = draggingPiece.color;
                        ctx.fillRect((gCol + c) * cellSize + 4, (gRow + r) * cellSize + 4, cellSize - 8, cellSize - 8);
                    }
                });
            });
            ctx.globalAlpha = 1.0;
        }
    }

    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const s = piece.scale * cellSize;
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    ctx.fillStyle = piece.color;
                    ctx.roundRect(piece.x + c * s, piece.y + r * s, s - 2, s - 2, 4);
                    ctx.fill();
                }
            });
        });
    });
}

function startDrag(e) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
            draggingPiece = p;
            p.scale = 1.0; // تكبير القطعة لتناسب الشبكة
            dragOffsetX = (p.matrix[0].length * cellSize) / 2;
            dragOffsetY = (p.matrix.length * cellSize) / 2;
            playSfx(400, 'sine', 0.05);
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = ((e.clientX || e.touches[0].clientX) - rect.left) - dragOffsetX;
    draggingPiece.y = ((e.clientY || e.touches[0].clientY) - rect.top) - dragOffsetY - 60; // رفعها لتظهر فوق الإصبع
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    
    const gridCol = Math.round(draggingPiece.x / cellSize);
    const gridRow = Math.round(draggingPiece.y / cellSize);

    if (canPlace(draggingPiece, gridRow, gridCol)) {
        placePiece(draggingPiece, gridRow, gridCol);
        playSfx(600, 'triangle', 0.1); // صوت الالتصاق
    } else {
        draggingPiece.x = draggingPiece.originalX;
        draggingPiece.y = draggingPiece.originalY;
        draggingPiece.scale = 0.5;
    }
    draggingPiece = null;
    render();
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

function placePiece(p, row, col) {
    p.matrix.forEach((rMat, r) => {
        rMat.forEach((cell, c) => {
            if (cell) grid[row + r][col + c] = p.color;
        });
    });
    p.active = false;
    addScore(p.matrix.flat().filter(x => x).length * 10);
    checkLines();
    if (availablePieces.every(pc => !pc.active)) spawnPieces();
}

function checkLines() {
    let tr = [], tc = [];
    for (let r = 0; r < ROWS; r++) if (grid[r].every(v => v !== 0)) tr.push(r);
    for (let c = 0; c < COLS; c++) {
        let f = true;
        for (let r = 0; r < ROWS; r++) if (grid[r][c] === 0) f = false;
        if (f) tc.push(c);
    }

    if (tr.length > 0 || tc.length > 0) {
        tr.forEach(r => grid[r].fill(0));
        tc.forEach(c => { for (let r = 0; r < ROWS; r++) grid[r][c] = 0; });
        addScore((tr.length + tc.length) * 100);
        playSfx(800, 'square', 0.2); // صوت حذف الصفوف
    }
}

function addScore(pts) { score += pts; if(score > highScore) { highScore = score; localStorage.setItem('blockBlastHighScore', highScore); } updateScoreUI(); }
function updateScoreUI() { scoreElement.innerText = score; highScoreElement.innerText = highScore; }

canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);
restartBtn.addEventListener('click', initGame);
window.onload = initGame;
