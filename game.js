const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// الإعدادات
const ROWS = 8, COLS = 8;
let cellSize, grid, score = 0, highScore = localStorage.getItem('bp_high') || 0;
let availablePieces = [], draggingPiece = null, particles = [];

const COLORS = {
    '#2dd4bf': ['#2dd4bf', '#0d9488'], // Cyan
    '#fbbf24': ['#fbbf24', '#b45309'], // Gold
    '#a855f7': ['#a855f7', '#7e22ce'], // Purple
    '#f87171': ['#f87171', '#b91c1c'], // Red
    '#4ade80': ['#4ade80', '#15803d'], // Green
    '#ec4899': ['#ec4899', '#be185d'], // Pink
    '#94a3b8': ['#94a3b8', '#475569']  // Gray
};

function initGame() {
    const size = Math.min(window.innerWidth - 60, 380);
    canvas.width = size;
    canvas.height = size + 180;
    cellSize = size / COLS;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    score = 0;
    updateUI();
    spawnPieces();
    requestAnimationFrame(gameLoop);
}

function createParticles(x, y, color) {
    for(let i=0; i<8; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
            life: 1, color
        });
    }
}

function spawnPieces() {
    const SHAPES = [
        {m: [[1,1,1,1]], c: '#2dd4bf'}, {m: [[1,1],[1,1]], c: '#fbbf24'},
        {m: [[0,1,0],[1,1,1]], c: '#a855f7'}, {m: [[1,1,1],[1,0,0]], c: '#f87171'},
        {m: [[1,1,0],[0,1,1]], c: '#4ade80'}, {m: [[1]], c: '#94a3b8'}
    ];
    availablePieces = [];
    for(let i=0; i<3; i++) {
        const s = SHAPES[Math.floor(Math.random()*SHAPES.length)];
        availablePieces.push({
            ...s, x: (canvas.width/3)*i + 10, y: canvas.width + 50,
            ox: (canvas.width/3)*i + 10, oy: canvas.width + 50,
            active: true, scale: 0.5
        });
    }
}

function drawBlock(x, y, color, size, isGhost = false) {
    ctx.save();
    ctx.globalAlpha = isGhost ? 0.3 : 1;
    
    // تدرج لوني احترافي للمكعب
    const grd = ctx.createLinearGradient(x, y, x+size, y+size);
    const palette = COLORS[color] || [color, color];
    grd.addColorStop(0, palette[0]);
    grd.addColorStop(1, palette[1]);
    
    ctx.fillStyle = grd;
    ctx.shadowBlur = isGhost ? 0 : 15;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    ctx.roundRect(x+3, y+3, size-6, size-6, 8);
    ctx.fill();
    
    // إضافة لمعة علوية
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x+6, y+6, size-12, size/4);
    
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الشبكة الخلفية
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            ctx.fillStyle = "#1e293b";
            ctx.beginPath();
            ctx.roundRect(c*cellSize+2, r*cellSize+2, cellSize-4, cellSize-4, 8);
            ctx.fill();
            if(grid[r][c]) drawBlock(c*cellSize, r*cellSize, grid[r][c], cellSize);
        }
    }

    // رسم خيال القطعة (Ghost)
    if(draggingPiece) {
        const gc = Math.round(draggingPiece.x/cellSize), gr = Math.round(draggingPiece.y/cellSize);
        if(canPlace(draggingPiece, gr, gc)) {
            draggingPiece.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) drawBlock((gc+c)*cellSize, (gr+r)*cellSize, draggingPiece.c, cellSize, true);
            }));
        }
    }

    // رسم القطع السفلية والجزيئات
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1 : 0.5) * cellSize;
        p.m.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawBlock(p.x + c*s, p.y + r*s, p.c, s);
        }));
    });

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        if(p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    requestAnimationFrame(gameLoop);
}

// ... منطق السحب والتحقق من الخطوط (كما في الكود الأصلي لكن مع إضافة الجزيئات) ...
function checkLines() {
    let rows = [], cols = [];
    for(let i=0; i<8; i++) {
        if(grid[i].every(v => v !== 0)) rows.push(i);
        if(grid.every(r => r[i] !== 0)) cols.push(i);
    }
    
    rows.forEach(r => {
        for(let c=0; c<8; c++) {
            createParticles(c*cellSize + cellSize/2, r*cellSize + cellSize/2, grid[r][c]);
            grid[r][c] = 0;
        }
    });
    cols.forEach(c => {
        for(let r=0; r<8; r++) {
            createParticles(c*cellSize + cellSize/2, r*cellSize + cellSize/2, grid[r][c]);
            grid[r][c] = 0;
        }
    });

    if(rows.length || cols.length) {
        score += (rows.length + cols.length) * 100;
        updateUI();
    }
}

function updateUI() {
    document.getElementById('scoreVal').innerText = score;
    highScore = Math.max(score, highScore);
    localStorage.setItem('bp_high', highScore);
    document.getElementById('highScoreVal').innerText = highScore;
}

function canPlace(p, r, c) {
    return p.m.every((row, pr) => row.every((cell, pc) => {
        if(!cell) return true;
        let nr = r + pr, nc = c + pc;
        return nr>=0 && nr<ROWS && nc>=0 && nc<COLS && grid[nr][nc] === 0;
    }));
}

// الأحداث (Input)
function setupInput() {
    const handleStart = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        availablePieces.forEach(p => {
            if(p.active && x > p.x && x < p.x + 80 && y > p.y && y < p.y + 80) {
                draggingPiece = p;
            }
        });
    };
    const handleMove = (e) => {
        if(!draggingPiece) return;
        const rect = canvas.getBoundingClientRect();
        draggingPiece.x = (e.clientX || e.touches[0].clientX) - rect.left - cellSize;
        draggingPiece.y = (e.clientY || e.touches[0].clientY) - rect.top - cellSize - 60;
    };
    const handleEnd = () => {
        if(!draggingPiece) return;
        const gc = Math.round(draggingPiece.x/cellSize), gr = Math.round(draggingPiece.y/cellSize);
        if(canPlace(draggingPiece, gr, gc)) {
            draggingPiece.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) grid[gr+r][gc+c] = draggingPiece.c;
            }));
            draggingPiece.active = false;
            checkLines();
            if(availablePieces.every(p => !p.active)) spawnPieces();
            if(!checkGameOver()) showGameOver();
        } else {
            draggingPiece.x = draggingPiece.ox; draggingPiece.y = draggingPiece.oy;
        }
        draggingPiece = null;
    };

    canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    window.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e); }, {passive: false});
    window.addEventListener('touchend', handleEnd);
}

function checkGameOver() {
    return availablePieces.filter(p => p.active).some(p => {
        for(let r=0; r<=ROWS-p.m.length; r++) {
            for(let c=0; c<=COLS-p.m[0].length; c++) {
                if(canPlace(p, r, c)) return true;
            }
        }
        return false;
    });
}

function showGameOver() {
    document.getElementById('finalScoreDisplay').innerText = score;
    document.getElementById('gameOverModal').style.display = 'flex';
}

function restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    initGame();
}

window.onload = () => { setupInput(); initGame(); };
