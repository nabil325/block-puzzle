const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let ROWS = 8, COLS = 8, cellSize, grid, score = 0, highScore = 1950;
let availablePieces = [], draggingPiece = null;

const COLORS = {
    cyan: '#2dd4bf', gold: '#fbbf24', purple: '#a855f7',
    red: '#f87171', green: '#4ade80', blue: '#3b82f6', empty: '#1a2333'
};

// الأشكال المحدثة والموسعة
const SHAPES = [
    { matrix: [[1,1,1,1]], color: COLORS.cyan },
    { matrix: [[1,1],[1,1]], color: COLORS.gold },
    { matrix: [[0,1,0],[1,1,1]], color: COLORS.purple },
    { matrix: [[1,1,0],[0,1,1]], color: COLORS.green },
    { matrix: [[1,1,1],[1,1,1],[1,1,1]], color: COLORS.blue }, // مربع كبير جديد
    { matrix: [[1,1,1],[1,0,0]], color: COLORS.red }, // حرف L جديد
    { matrix: [[1]], color: COLORS.red } // نقطة جديدة للتحدي
];

function initGame() {
    const w = Math.min(window.innerWidth - 60, 360);
    canvas.width = w; canvas.height = w + 160;
    cellSize = w / COLS;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    spawnPieces();
    render();
}

function spawnPieces() {
    availablePieces = [];
    for(let i=0; i<3; i++){
        const s = SHAPES[Math.floor(Math.random()*SHAPES.length)];
        availablePieces.push({...s, x:(canvas.width/3)*i+10, y:canvas.width+40, ox:(canvas.width/3)*i+10, oy:canvas.width+40, active:true});
    }
}

// رسم المربعات بجودة كريستالية مضيئة (HQ Glossy Effect)
function drawHQBlock(x, y, color, size, isGhost = false) {
    ctx.save();
    ctx.globalAlpha = isGhost ? 0.3 : 1.0;
    
    // تأثير توهج ثلاثي الأبعاد لجودة فائقة
    if(!isGhost) {
        ctx.shadowBlur = 12; ctx.shadowColor = color;
    }

    // جسم المربع بزوايا دائرية مثالية
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 2.5, y + 2.5, size - 5, size - 5, 9); // حواف ناعمة جداً
    ctx.fill();

    // إضافة تدرج زجاجي داخلي (Glassmorphism Effect)
    if(color !== COLORS.empty) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // لمعة علوية
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x+5, y+5, size-10, size/3);
    }
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            // خلفية الشبكة تبدو الآن كزجاج داكن
            ctx.fillStyle = '#121827';
            ctx.beginPath(); ctx.roundRect(c*cellSize+2.5, r*cellSize+2.5, cellSize-5, cellSize-5, 9); ctx.fill();
            if(grid[r][c]) drawHQBlock(c*cellSize, r*cellSize, grid[r][c], cellSize);
        }
    }
    // ... رسم الخيال والقطع المتاحة باستخدام drawHQBlock ...
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1.0 : 0.5) * cellSize;
        p.matrix.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawHQBlock(p.x + c*s, p.y + r*s, p.color, s);
        }));
    });
    requestAnimationFrame(render);
}
// ... بقية منطق اللعب (السحب والالتصاق) كما في النسخة السابقة ...
