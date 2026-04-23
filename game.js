const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');

// إعدادات الرقعة (8x8)
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

// نظام الصوت المدمج
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(freq, type, dur) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type; 
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
        o.connect(g); 
        g.connect(audioCtx.destination);
        o.start(); 
        o.stop(audioCtx.currentTime + dur);
    } catch (e) { console.log("Audio play blocked"); }
}

// أشكال متنوعة وجديدة
const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#2dd4bf' },
    { matrix: [[1, 1], [1, 1]], color: '#fbbf24' },
    { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ec4899' },
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#f87171' },
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#4ade80' },
    { matrix: [[1]], color: '#94a3b8' },
    { matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#818cf8' }
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initGame() {
    const containerWidth = Math.min(window.innerWidth - 40, 400); 
    canvas.width = containerWidth;
    canvas.height = containerWidth + 220; 
    cellSize = containerWidth / COLS;
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
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
            x: (canvas.width / 3) * i + (canvas.width / 12),
            y: canvas.width + 70,
            originalX: (canvas.width / 3) * i + (canvas.width / 12),
            originalY: canvas.width + 70,
            scale: 0.45,
            active: true
        });
    }
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            ctx.fillStyle = "#1e293b"; 
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 8);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"; 
            ctx.lineWidth = 1;
            ctx.stroke();
            if (grid[r][c] !== 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = grid[r][c];
                ctx.fillStyle = grid[r][c];
                ctx.beginPath();
                ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 8);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, canvas.width + 40);
    ctx.lineTo(canvas.width - 20, canvas.width + 40);
    ctx.stroke();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (draggingPiece) {
        const gCol = Math.round(draggingPiece.x / cellSize);
        const gRow = Math.round(draggingPiece.y / cellSize);
        if (canPlace(draggingPiece, gRow, gCol)) {
            ctx.globalAlpha = 0.2;
            draggingPiece.matrix.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        ctx.fillStyle = draggingPiece.color;
                        ctx.beginPath();
                        ctx.roundRect((gCol+c)*cellSize+4, (gRow+r)*cellSize+4, cellSize-8, cellSize-8, 6);
                        ctx.fill();
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
                    ctx.beginPath();
                    ctx.roundRect(piece.x + c * s, piece.y + r * s, s - 2, s - 2, 5);
                    ctx.fill();
                }
            });
        });
    });
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

function endDrag() {
    if (!draggingPiece) return;
    const gCol = Math.round(draggingPiece.x / cellSize);
    const gRow = Math.round(draggingPiece.y / cellSize);
    if (canPlace(draggingPiece, gRow, gCol)) {
        draggingPiece.matrix.forEach((rMat, r) => {
            rMat.forEach((cell, c) => {
                if (cell) grid[gRow + r][gCol + c] = draggingPiece.color;
            });
        });
        draggingPiece.active = false;
        playSfx(500, 'triangle', 0.1); // صوت عند وضع القطعة
        checkLines();
        if (availablePieces.every(pc => !pc.active)) spawnPieces();
        if (!checkAnyMovePossible()) setTimeout(showGameOver, 500);
    } else {
        draggingPiece.x = draggingPiece.originalX;
        draggingPiece.y = draggingPiece.originalY;
        draggingPiece.scale = 0.45;
    }
    draggingPiece = null;
    render();
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
        playSfx(800, 'sine', 0.3); // صوت عند مسح الخطوط
    }
}

function checkAnyMovePossible() {
    const activePieces = availablePieces.filter(p => p.active);
    for (let piece of activePieces) {
        for (let r = 0; r <= ROWS - piece.matrix.length; r++) {
            for (let c = 0; c <= COLS - piece.matrix[0].length; c++) {
                if (canPlace(piece, r, c)) return true;
            }
        }
    }
    return false;
}

function updateScoreUI() { 
    scoreElement.innerText = score; 
    highScore = Math.max(score, highScore);
    localStorage.setItem('blockBlastHighScore', highScore);
    highScoreElement.innerText = highScore;
}

function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    if (document.getElementById('finalScoreDisplay')) {
        document.getElementById('finalScoreDisplay').innerText = score + " 👑";
    }
    modal.style.display = 'flex';
}

function restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    initGame();
}

function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    availablePieces.forEach(p => {
        if (p.active && x > p.x - 20 && x < p.x + 80 && y > p.y - 20 && y < p.y + 120) {
            draggingPiece = p; 
            p.scale = 1.0;
            dragOffsetX = (p.matrix[0].length * cellSize) / 2;
            dragOffsetY = (p.matrix.length * cellSize) / 2;
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    draggingPiece.x = (clientX - rect.left) - dragOffsetX;
    draggingPiece.y = (clientY - rect.top) - dragOffsetY - 80;
    render();
}

canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);

window.onload = initGame;
