const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let ROWS = 8, COLS = 8, cellSize, grid, score = 0;
let highScore = 1950, availablePieces = [], draggingPiece = null;

// نظام الصوت الاحترافي
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(freq, type, dur) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function startGame(mode) {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    if (audioCtx.state === 'suspended') audioCtx.resume();
    initGame();
}

function initGame() {
    const w = Math.min(window.innerWidth - 60, 360);
    canvas.width = w; canvas.height = w + 160;
    cellSize = w / COLS;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    spawnPieces();
    render();
}

function spawnPieces() {
    const shapes = [
        {m: [[1,1,1,1]], c: '#2dd4bf'}, {m: [[1,1],[1,1]], c: '#fbbf24'},
        {m: [[0,1,0],[1,1,1]], c: '#a855f7'}, {m: [[1,1,1],[1,0,0]], c: '#f87171'}
    ];
    availablePieces = [];
    for(let i=0; i<3; i++){
        const s = shapes[Math.floor(Math.random()*shapes.length)];
        availablePieces.push({...s, x:(canvas.width/3)*i+10, y:canvas.width+40, ox:(canvas.width/3)*i+10, oy:canvas.width+40, active:true});
    }
}

function drawBlock(x, y, color, size, isGhost = false) {
    ctx.save();
    ctx.globalAlpha = isGhost ? 0.3 : 1.0;
    ctx.fillStyle = color;
    if(!isGhost) { ctx.shadowBlur = 10; ctx.shadowColor = color; }
    ctx.beginPath();
    ctx.roundRect(x+2, y+2, size-4, size-4, 8); // حواف دائرية احترافية
    ctx.fill();
    if(!isGhost) { ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // رسم الشبكة والقطع المستقرة
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            ctx.fillStyle = "#1e293b";
            ctx.beginPath(); ctx.roundRect(c*cellSize+2, r*cellSize+2, cellSize-4, cellSize-4, 8); ctx.fill();
            if(grid[r][c]) drawBlock(c*cellSize, r*cellSize, grid[r][c], cellSize);
        }
    }

    // تأثير الالتصاق (Snap Ghost)
    if(draggingPiece) {
        const sc = Math.round(draggingPiece.x/cellSize), sr = Math.round(draggingPiece.y/cellSize);
        if(canPlace(draggingPiece, sr, sc)) {
            draggingPiece.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) drawBlock((sc+c)*cellSize, (sr+r)*cellSize, draggingPiece.c, cellSize, true);
            }));
        }
    }

    // القطع في الأسفل
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1.0 : 0.5) * cellSize;
        p.m.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawBlock(p.x + c*s, p.y + r*s, p.c, s);
        }));
    });
    requestAnimationFrame(render);
}

function canPlace(p, r, c) {
    return p.m.every((row, pr) => row.every((cell, pc) => {
        if(!cell) return true;
        let nr = r + pr, nc = c + pc;
        return nr>=0 && nr<ROWS && nc>=0 && nc<COLS && grid[nr][nc] === 0;
    }));
}

// التحكم باللمس
canvas.addEventListener('touchstart', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left, y = e.touches[0].clientY - rect.top;
    availablePieces.forEach(p => {
        if(p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
            draggingPiece = p;
            playSfx(200, 'triangle', 0.1);
        }
    });
});

window.addEventListener('touchmove', e => {
    if(!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    draggingPiece.x = e.touches[0].clientX - rect.left - cellSize;
    draggingPiece.y = e.touches[0].clientY - rect.top - cellSize - 60;
});

window.addEventListener('touchend', () => {
    if(!draggingPiece) return;
    const c = Math.round(draggingPiece.x/cellSize), r = Math.round(draggingPiece.y/cellSize);
    if(canPlace(draggingPiece, r, c)) {
        draggingPiece.m.forEach((row, pr) => row.forEach((cell, pc) => { if(cell) grid[r+pr][c+pc] = draggingPiece.c; }));
        draggingPiece.active = false;
        playSfx(400, 'sine', 0.1); // صوت الالتصاق
        if(availablePieces.every(p => !p.active)) spawnPieces();
    } else {
        draggingPiece.x = draggingPiece.ox; draggingPiece.y = draggingPiece.oy;
    }
    draggingPiece = null;
});
