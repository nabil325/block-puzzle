const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// 1. الإعدادات (تصغير الإطار ليصبح مثل اللعبة الأصلية)
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#2dd4bf' }, // خط
    { matrix: [[1, 1], [1, 1]], color: '#fbbf24' }, // مربع
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' }, // حرف T
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#f87171' }, // حرف L
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#4ade80' }  // شكل Z
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// نظام صوتي (Web Audio)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(freq, type, dur) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
}

function initGame() {
    // تصغير العرض ليكون الإطار أنيقاً
    const containerWidth = Math.min(window.innerWidth - 80, 380); 
    canvas.width = containerWidth;
    canvas.height = containerWidth + 160; 
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
            x: (canvas.width / 3) * i + 15,
            y: canvas.width + 40,
            originalX: (canvas.width / 3) * i + 15,
            originalY: canvas.width + 40,
            scale: 0.5,
            active: true
        });
    }
}

// --- أهم دالة: رسم الشبكة والمربعات الخلفية ---
function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // 1. رسم خلفية المربع (الشبكة)
            ctx.fillStyle = "#1e293b"; // لون المربعات الفارغة
            drawRoundedRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6, true);
            
            // 2. رسم حدود المربع ليعطي شكل الشبكة
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
            ctx.stroke();

            // 3. إذا كان المربع يحتوي على قطعة مستقرة
            if (grid[r][c] !== 0) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = grid[r][c];
                ctx.fillStyle = grid[r][c];
                drawRoundedRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 6, true);
                ctx.shadowBlur = 0;
            }
        }
    }
}

function drawRoundedRect(x, y, w, h, r, fill = true) {
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
    if (fill) ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // رسم "خيال" القطعة (Ghost) عند السحب
    if (draggingPiece) {
        const gCol = Math.round(draggingPiece.x / cellSize);
        const gRow = Math.round(draggingPiece.y / cellSize);
        if (canPlace(draggingPiece, gRow, gCol)) {
            ctx.globalAlpha = 0.2;
            draggingPiece.matrix.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        ctx.fillStyle = draggingPiece.color;
                        drawRoundedRect((gCol+c)*cellSize+4, (gRow+r)*cellSize+4, cellSize-8, cellSize-8, 4, true);
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
                    drawRoundedRect(piece.x + c * s, piece.y + r * s, s - 2, s - 2, 4, true);
                }
            });
        });
    });
}

// --- منطق السحب والالتصاق (Snapping) ---
function startDrag(e) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
            draggingPiece = p;
            p.scale = 1.0; 
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
    draggingPiece.y = ((e.clientY || e.touches[0].clientY) - rect.top) - dragOffsetY - 50; 
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    const gCol = Math.round(draggingPiece.x / cellSize);
    const gRow = Math.round(draggingPiece.y / cellSize);

    if (canPlace(draggingPiece, gRow, gCol)) {
        // الالتصاق النهائي في المكان
        p_matrix = draggingPiece.matrix;
        p_matrix.forEach((rMat, r) => {
            rMat.forEach((cell, c) => {
                if (cell) grid[gRow + r][gCol + c] = draggingPiece.color;
            });
        });
        draggingPiece.active = false;
        playSfx(600, 'triangle', 0.1);
        checkLines();
        if (availablePieces.every(pc => !pc.active)) spawnPieces();
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
                if (row+r < 0 || row+r >= ROWS || col+c < 0 || col+c >= COLS || grid[row+r][col+c] !== 0) return false;
            }
        }
    }
    return true;
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
        score += (tr.length + tc.length) * 100;
        updateScoreUI();
        playSfx(800, 'square', 0.2);
    }
}

function updateScoreUI() { scoreElement.innerText = score; highScoreElement.innerText = Math.max(score, highScore); }
canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
restartBtn.addEventListener('click', initGame);
window.onload = initGame;
