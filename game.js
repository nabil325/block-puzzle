const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const gridSize = 8;
let cellSize;

function init() {
    const w = Math.min(window.innerWidth - 60, 340);
    canvas.width = w; canvas.height = w;
    cellSize = w / gridSize;
    drawGrid();
}

// رسم المربعات بجودة عالية (Crystal HQ)
function drawBlock(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowBlur = 12; ctx.shadowColor = color;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 8);
    ctx.fill();
    // إضافة لمعة زجاجية للتأثير الاحترافي
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize / 3);
    ctx.restore();
}

function drawGrid() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(c * cellSize + 2, r * cellSize + 2, cellSize - 4, cellSize - 4, 8);
            ctx.fill();
        }
    }
}

window.onload = init;
