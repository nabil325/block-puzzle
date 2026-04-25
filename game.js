const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// إعدادات اللعب
const ROWS = 8, COLS = 8;
let cellSize, grid, score = 0, highScore = 1950;
let availablePieces = [], draggingPiece = null;

// نظام الصوت (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function initGame() {
    const size = Math.min(window.innerWidth - 40, 380);
    canvas.width = size;
    canvas.height = size + 160;
    cellSize = size / COLS;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    spawnPieces();
    render();
}

function spawnPieces() {
    const SHAPES = [
        {m: [[1,1,1,1]], c: '#2dd4bf'}, {m: [[1,1],[1,1]], c: '#fbbf24'},
        {m: [[0,1,0],[1,1,1]], c: '#a855f7'}, {m: [[1]], c: '#3b82f6'}
    ];
    availablePieces = [];
    for(let i=0; i<3; i++) {
        const s = SHAPES[Math.floor(Math.random()*SHAPES.length)];
        availablePieces.push({
            ...s, x: (canvas.width/3)*i + 15, y: canvas.width + 40,
            ox: (canvas.width/3)*i + 15, oy: canvas.width + 40,
            active: true, scale: 0.5
        });
    }
}

// رسم المربعات باحترافية (Bevel & Glow Effect)
function drawBlock(x, y, color, size, isGhost = false) {
    ctx.save();
    ctx.globalAlpha = isGhost ? 0.3 : 1;
    
    // الظل الخارجي (Glow)
    if(!isGhost) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
    }

    // جسم المربع
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x+2, y+2, size-4, size-4, 10);
    ctx.fill();

    // تأثير اللمعان (Highlights) لجعلها تبدو احترافية
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الشبكة الخلفية
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            ctx.fillStyle = "#161b2a";
            ctx.beginPath();
            ctx.roundRect(c*cellSize+2, r*cellSize+2, cellSize-4, cellSize-4, 10);
            ctx.fill();
            if(grid[r][c]) drawBlock(c*cellSize, r*cellSize, grid[r][c], cellSize);
        }
    }

    // تأثير الالتصاق (Snap Ghost)
    if(draggingPiece) {
        const snapC = Math.round(draggingPiece.x / cellSize);
        const snapR = Math.round(draggingPiece.y / cellSize);
        if(canPlace(draggingPiece, snapR, snapC)) {
            draggingPiece.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) drawBlock((snapC+c)*cellSize, (snapR+r)*cellSize, draggingPiece.c, cellSize, true);
            }));
        }
    }

    // رسم القطع السفلية
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1 : 0.5) * cellSize;
        p.m.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawBlock(p.x + c*s, p.y + r*s, p.c, s);
        }));
    });
    requestAnimationFrame(render);
}

// الالتصاق عند الإفلات
function handleEnd() {
    if(!draggingPiece) return;
    const snapC = Math.round(draggingPiece.x / cellSize);
    const snapR = Math.round(draggingPiece.y / cellSize);

    if(canPlace(draggingPiece, snapR, snapC)) {
        draggingPiece.m.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) grid[snapR+r][snapC+c] = draggingPiece.c;
        }));
        draggingPiece.active = false;
        playSound(440, 'sine', 0.1); // صوت الالتصاق
        checkLines();
        if(availablePieces.every(p => !p.active)) spawnPieces();
    } else {
        draggingPiece.x = draggingPiece.ox;
        draggingPiece.y = draggingPiece.oy;
    }
    draggingPiece = null;
}

function canPlace(p, r, c) {
    return p.m.every((row, pr) => row.every((cell, pc) => {
        if(!cell) return true;
        let nr = r + pr, nc = c + pc;
        return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 0;
    }));
}

function checkLines() {
    let lines = 0;
    // منطق حذف الصفوف والأعمدة
    // ... (نفس منطق الكود السابق)
    if(lines > 0) playSound(880, 'square', 0.2); // صوت المسح
}

// تشغيل اللعبة
function startGame(mode) {
    document.getElementById('mainMenu').classList.add('hidden');
    if (audioCtx.state === 'suspended') audioCtx.resume();
    initGame();
}

// إضافات التحكم باللمس والسحب
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    availablePieces.forEach(p => {
        if(p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
            draggingPiece = p;
            playSound(220, 'triangle', 0.05); // صوت السحب
        }
    });
});

window.addEventListener('touchmove', (e) => {
    if(!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = e.touches[0].clientX - rect.left - cellSize;
    draggingPiece.y = e.touches[0].clientY - rect.top - cellSize - 60;
});

window.addEventListener('touchend', handleEnd);
