const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 8, COLS = 8;
let cellSize, grid, score = 0, highScore = 1950;
let availablePieces = [], draggingPiece = null;

const COLORS = {
    cyan: '#2dd4bf', gold: '#fbbf24', purple: '#a855f7',
    red: '#f87171', green: '#4ade80', blue: '#3b82f6'
};

const SHAPES = [
    { matrix: [[1,1,1,1]], color: COLORS.cyan },
    { matrix: [[1,1],[1,1]], color: COLORS.gold },
    { matrix: [[0,1,0],[1,1,1]], color: COLORS.purple },
    { matrix: [[1,1,0],[0,1,1]], color: COLORS.green },
    { matrix: [[1]], color: COLORS.blue }
];

function startGame(mode) {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    initGame();
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
    availablePieces = [];
    for(let i=0; i<3; i++) {
        const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        availablePieces.push({
            ...s, x: (canvas.width/3)*i + 10, y: canvas.width + 40,
            ox: (canvas.width/3)*i + 10, oy: canvas.width + 40,
            active: true, scale: 0.5
        });
    }
}

function drawBlock(x, y, color, size, glow = true) {
    ctx.save();
    if(glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 8);
    ctx.fill();
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الشبكة
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            ctx.fillStyle = "#1e293b";
            ctx.beginPath();
            ctx.roundRect(c*cellSize+2, r*cellSize+2, cellSize-4, cellSize-4, 8);
            ctx.fill();
            if(grid[r][c]) drawBlock(c*cellSize, r*cellSize, grid[r][c], cellSize);
        }
    }

    // رسم القطع السفلية
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1 : 0.5) * cellSize;
        p.matrix.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawBlock(p.x + c*s, p.y + r*s, p.color, s, false);
        }));
    });

    requestAnimationFrame(render);
}

// معالجة اللمس والسحب
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left, ty = touch.clientY - rect.top;

    availablePieces.forEach(p => {
        if(p.active && tx > p.x && tx < p.x + 80 && ty > p.y && ty < p.y + 80) {
            draggingPiece = p;
        }
    });
});

window.addEventListener('touchmove', (e) => {
    if(!draggingPiece) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    draggingPiece.x = touch.clientX - rect.left - cellSize;
    draggingPiece.y = touch.clientY - rect.top - cellSize - 50;
});

window.addEventListener('touchend', () => {
    if(!draggingPiece) return;
    // منطق وضع القطعة (التحقق من الإحداثيات والشبكة)
    const gridX = Math.round(draggingPiece.x / cellSize);
    const gridY = Math.round(draggingPiece.y / cellSize);
    
    // هنا يتم استكمال منطق التحقق وحذف الصفوف كما في النسخ السابقة
    draggingPiece.x = draggingPiece.ox;
    draggingPiece.y = draggingPiece.oy;
    draggingPiece = null;
});
