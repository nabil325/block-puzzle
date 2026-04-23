const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// 1. الإعدادات والشبكة
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

// أشكال احترافية متنوعة
const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: '#00d2ff' },
    { matrix: [[1, 1], [1, 1]], color: '#ffea00' },
    { matrix: [[0, 1, 0], [1, 1, 1]], color: '#9d50bb' },
    { matrix: [[1, 1, 1], [1, 0, 0]], color: '#ff9966' },
    { matrix: [[1, 1, 1], [0, 0, 1]], color: '#ff5e62' },
    { matrix: [[1, 1, 0], [0, 1, 1]], color: '#00f260' },
    { matrix: [[1, 1, 1]], color: '#4facfe' },
    { matrix: [[1, 1], [1, 0]], color: '#ee0979' }
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// --- نظام الصوت البرمجي (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function initGame() {
    const containerWidth = Math.min(window.innerWidth - 40, 450);
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
            scale: 0.6, // تكون صغيرة وهي بالأسفل
            active: true
        });
    }
}

function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // رسم مربعات الشبكة الخلفية
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            // رسم القطع المستقرة
            if (grid[r][c] !== 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = grid[r][c];
                ctx.fillStyle = grid[r][c];
                ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
                ctx.shadowBlur = 0;
            }
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const s = piece.scale * cellSize;
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(piece.x + c * s, piece.y + r * s, s - 2, s - 2);
                }
            });
        });
    });
}

// --- التحكم والسحب ---
function startDrag(e) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    availablePieces.forEach(p => {
        if (p.active && x > p.x && x < p.x + 100 && y > p.y && y < p.y + 100) {
            draggingPiece = p;
            p.scale = 1.0; // تكبير القطعة عند سحبها لتطابق حجم الشبكة
            dragOffsetX = (p.matrix[0].length * cellSize) / 2;
            dragOffsetY = (p.matrix.length * cellSize) / 2;
            playSound(440, 'sine', 0.05); // صوت عند اللمس
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = ((e.clientX || e.touches[0].clientX) - rect.left) - dragOffsetX;
    draggingPiece.y = ((e.clientY || e.touches[0].clientY) - rect.top) - dragOffsetY - 50; // رفعها قليلاً عن الإصبع
    render();
}

function endDrag() {
    if (!draggingPiece) return;
    
    const gridCol = Math.round(draggingPiece.x / cellSize);
    const gridRow = Math.round(draggingPiece.y / cellSize);

    if (canPlace(draggingPiece, gridRow, gridCol)) {
        placePiece(draggingPiece, gridRow, gridCol);
        playSound(660, 'square', 0.1); // صوت عند الوضع
    } else {
        draggingPiece.x = draggingPiece.originalX;
        draggingPiece.y = draggingPiece.originalY;
        draggingPiece.scale = 0.6;
        playSound(150, 'sine', 0.1); // صوت فشل الوضع
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

function placePiece(piece, row, col) {
    piece.matrix.forEach((rMat, r) => {
        rMat.forEach((cell, c) => {
            if (cell) grid[row + r][col + c] = piece.color;
        });
    });
    piece.active = false;
    addScore(10);
    checkLines();
    if (availablePieces.every(p => !p.active)) spawnPieces();
}

function checkLines() {
    let toDeleteR = [], toDeleteC = [];
    for (let r = 0; r < ROWS; r++) if (grid[r].every(v => v !== 0)) toDeleteR.push(r);
    for (let c = 0; c < COLS; c++) {
        let full = true;
        for (let r = 0; r < ROWS; r++) if (grid[r][c] === 0) full = false;
        if (full) toDeleteC.push(c);
    }

    if (toDeleteR.length > 0 || toDeleteC.length > 0) {
        toDeleteR.forEach(r => grid[r].fill(0));
        toDeleteC.forEach(c => { for (let r = 0; r < ROWS; r++) grid[r][c] = 0; });
        addScore((toDeleteR.length + toDeleteC.length) * 100);
        playSound(880, 'triangle', 0.3); // صوت الانفجار عند اكتمال صف
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
