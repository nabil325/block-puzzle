const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const splash = document.getElementById('mainMenu');
const gameUI = document.getElementById('gameUI');
const scoreElement = document.getElementById('scoreVal');
const highScoreElement = document.getElementById('highScoreVal');

// إعدادات اللعبة
let gameMode = 'classic'; // 'classic' أو 'puzzle'
const ROWS = 8, COLS = 8;
let cellSize = 0, grid = [], score = 0;
let highScore = localStorage.getItem('blockPuzzleBest') || 1950;

// تحميل صورة الألغاز (اختياري)
const puzzleImg = new Image();
puzzleImg.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg';

// نظام الصوت المدمج
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(f, t, d) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
}

const SHAPES = [
    { matrix: [[1,1,1,1]], color: ['#2dd4bf', '#0d9488'] }, // فيروزي متدرج
    { matrix: [[1,1],[1,1]], color: ['#facc15', '#ca8a04'] }, // ذهبي متدرج
    { matrix: [[0,1,0],[1,1,1]], color: ['#a855f7', '#7e22ce'] }, // بنفسجي متدرج
    { matrix: [[1,1,0],[0,1,1]], color: ['#f87171', '#dc2626'] }  // أحمر مرجاني
];

let availablePieces = [], draggingPiece = null, dragOffsetX = 0, dragOffsetY = 0;

function startMode(mode) {
    gameMode = mode;
    splash.classList.remove('active');
    gameUI.classList.remove('hidden');
    playSfx(500, 'sine', 0.1);
    initGame();
}

function initGame() {
    const parent = canvas.parentNode;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    cellSize = canvas.width / COLS;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    score = 0;
    updateScoreUI();
    spawnPieces();
    render();
}

function spawnPieces() {
    availablePieces = [];
    for(let i=0; i<3; i++) {
        const s = SHAPES[Math.floor(Math.random()*SHAPES.length)];
        availablePieces.push({
            ...s, x: (canvas.width/3)*i + (canvas.width/12), y: canvas.width + 60,
            origX: (canvas.width/3)*i + (canvas.width/12), origY: canvas.width + 60,
            active: true, scale: 0.5
        });
    }
}

function drawBlock(x, y, colors, size, r, c) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x+3, y+3, size-6, size-6, 10); // حواف منحنية احترافية
    ctx.clip();
    if(gameMode === 'puzzle' && puzzleImg.complete) {
        ctx.drawImage(puzzleImg, 0, 0, puzzleImg.width, puzzleImg.height, 0, 0, canvas.width, canvas.width);
    } else {
        const grd = ctx.createLinearGradient(x, y, x, y+size);
        grd.addColorStop(0, colors[0]);
        grd.addColorStop(1, colors[1]);
        ctx.fillStyle = grd;
        ctx.fill();
        // تأثير لمعان
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x+3, y+3, size-6, (size-6)/2);
    }
    ctx.restore();
}

function drawGrid() {
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const x = c*cellSize, y = r*cellSize;
            ctx.fillStyle = "#111a2e"; // خلفية المربعات الداكنة
            ctx.beginPath();
            ctx.roundRect(x+3, y+3, cellSize-6, cellSize-6, 12);
            ctx.fill();
            if(grid[r][c]) drawBlock(x, y, grid[r][c], cellSize, r, c);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // رسم خيال القطعة أثناء السحب
    if(draggingPiece) {
        const gCol = Math.round(draggingPiece.x/cellSize);
        const gRow = Math.round(draggingPiece.y/cellSize);
        if(canPlace(draggingPiece, gRow, gCol)) {
            ctx.globalAlpha = 0.2;
            draggingPiece.matrix.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) drawBlock((gCol+c)*cellSize, (gRow+r)*cellSize, draggingPiece.color, cellSize);
            }));
            ctx.globalAlpha = 1.0;
        }
    }

    // رسم القطع السفلية
    availablePieces.forEach(p => {
        if(!p.active) return;
        const s = (draggingPiece === p ? 1 : 0.6) * cellSize; // تكبير القطع قليلاً
        p.matrix.forEach((row, r) => row.forEach((cell, c) => {
            if(cell) drawBlock(p.x + c*s, p.y + r*s, p.color, s);
        }));
    });
    requestAnimationFrame(render);
}

// ... بقية منطق السحب، الوضع، وحذف الخطوط (نفس المنطق من الصورة 1) ...

function canPlace(piece, row, col) {
    for(let r=0; r<piece.matrix.length; r++) {
        for(let c=0; c<piece.matrix[r].length; c++) {
            if(piece.matrix[r][c]) {
                if(row+r<0 || row+r>=ROWS || col+c<0 || col+c>=COLS || grid[row+r][col+c]!==0) return false;
            }
        }
    }
    return true;
}

function endDrag() {
    if(!draggingPiece) return;
    const gCol = Math.round(draggingPiece.x/cellSize), gRow = Math.round(draggingPiece.y/cellSize);
    if(canPlace(draggingPiece, gRow, gCol)) {
        draggingPiece.matrix.forEach((rMat, r) => rMat.forEach((cell, c) => {
            if(cell) grid[gRow+r][gCol+c] = draggingPiece.color;
        }));
        draggingPiece.active = false;
        playSfx(400, 'triangle', 0.1);
        if(gameMode === 'classic') checkLines();
        else { score += 50; updateScoreUI(); }
        if(availablePieces.every(p => !p.active)) spawnPieces();
    } else {
        draggingPiece.x = draggingPiece.origX; draggingPiece.y = draggingPiece.origY;
    }
    draggingPiece = null;
}

function checkLines() {
    let toRemoveR = [], toRemoveC = [];
    for(let i=0; i<8; i++) {
        if(grid[i].every(v => v !== 0)) toRemoveR.push(i);
        if(grid.every(row => row[i] !== 0)) toRemoveC.push(i);
    }
    toRemoveR.forEach(r => grid[r].fill(0));
    toRemoveC.forEach(c => grid.forEach(row => row[c] = 0));
    if(toRemoveR.length || toRemoveC.length) {
        score += (toRemoveR.length + toRemoveC.length) * 100;
        updateScoreUI(); playSfx(800, 'sine', 0.3);
    }
}

function updateScoreUI() { scoreElement.innerText = score; highScoreElement.innerText = Math.max(score, highScore); }

// معالجة اللمس والسحب الاحترافية
function setupInput() {
    const getPos = e => {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    const start = e => {
        const pos = getPos(e);
        availablePieces.forEach(p => {
            if(p.active && pos.x > p.x-20 && pos.x < p.x+80) {
                draggingPiece = p; dragOffsetX = cellSize/2; dragOffsetY = cellSize*1.5;
            }
        });
    };
    const move = e => {
        if(!draggingPiece) return; e.preventDefault(); const pos = getPos(e);
        draggingPiece.x = pos.x - dragOffsetX; draggingPiece.y = pos.y - dragOffsetY;
    };
    const end = () => endDrag();
    canvas.addEventListener('touchstart', start); window.addEventListener('touchmove', move, {passive:false}); window.addEventListener('touchend', end);
    canvas.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}

window.onload = () => { setupInput(); initGame(); Game = { start: startMode }; }; // ربط دالة startMode
