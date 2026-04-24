const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const splash = document.getElementById('splashScreen');
const modeMenu = document.getElementById('modeSelection');

// --- إعدادات اللعبة ---
let gameMode = 'classic'; // 'classic' أو 'puzzle'
const ROWS = 8;
const COLS = 8;
let cellSize = 0;
let grid = [];
let score = 0;
let highScore = localStorage.getItem('blockPuzzleHighScore') || 0;

// صور الأصول (Assets) - تأكد من توفر الملفات في مجلد assets
const puzzleImg = new Image();
puzzleImg.src = 'assets/puzzle_image.jpg'; // صورة اللغز الافتراضية
const crownImg = new Image();
crownImg.src = 'assets/gold_crown.png'; // صورة التاج الذهبي

// مصفوفة الأشكال بألوان جديدة (أكثر لمعاناً)
const SHAPES = [
    { matrix: [[1, 1, 1, 1]], color: 'linear-gradient(135deg, #4ef9df 0%, #15b09a 100%)' }, // فيروزي لامع
    { matrix: [[1, 1], [1, 1]], color: 'linear-gradient(135deg, #ffe57a 0%, #ffc300 100%)' }, // ذهبي
    { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'linear-gradient(135deg, #ff85c6 0%, #e0217c 100%)' }, // وردي غني
    { matrix: [[0, 1, 0], [1, 1, 1]], color: 'linear-gradient(135deg, #c785ff 0%, #8c21e0 100%)' }, // بنفسجي غني
    { matrix: [[1, 1, 1], [1, 0, 0]], color: 'linear-gradient(135deg, #ff9999 0%, #ee4444 100%)' }, // أحمر مرجاني
    { matrix: [[1, 1, 0], [0, 1, 1]], color: 'linear-gradient(135deg, #aaffaa 0%, #44cc44 100%)' }, // أخضر زمردي
    { matrix: [[1]], color: 'linear-gradient(135deg, #cccccc 0%, #888888 100%)' } // فضي
];

let availablePieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// --- نظام الصوت المتقدم ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playComplexSfx(sfxType) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.connect(audioCtx.destination);

        if (sfxType === 'place') {
            const o = audioCtx.createOscillator();
            o.type = 'triangle';
            o.frequency.setValueAtTime(400, audioCtx.currentTime);
            o.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1);
            o.connect(g);
            o.start(); o.stop(audioCtx.currentTime + 0.1);
        } else if (sfxType === 'clear') {
            const o = audioCtx.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(800, audioCtx.currentTime);
            o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
            o.connect(g);
            o.start(); o.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {}
}

// --- إدارة الشاشات الاحترافية ---
splash.onclick = () => {
    fadeTransition(splash, modeMenu);
    playComplexSfx('place');
};

function startMode(mode) {
    fadeTransition(modeMenu, null, () => {
        gameMode = mode;
        initGame();
    });
}

function fadeTransition(fromEl, toEl, onComplete) {
    fromEl.style.opacity = '0';
    setTimeout(() => {
        fromEl.style.display = 'none';
        if (toEl) {
            toEl.style.display = 'flex';
            setTimeout(() => toEl.style.opacity = '1', 50);
        }
        if (onComplete) onComplete();
    }, 500); // مدة التلاشي
}

// --- منطق اللعبة الأساسي ---
function initGame() {
    const containerWidth = Math.min(window.innerWidth - 20, 440); // تكبير قليلاً
    canvas.width = containerWidth;
    canvas.height = containerWidth + 260; // مساحة أكبر للقطع
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
            x: (canvas.width / 3) * i + (canvas.width / 24), // توسيع المسافة
            y: canvas.width + 90, // رفع القطع قليلاً
            originalX: (canvas.width / 3) * i + (canvas.width / 24),
            originalY: canvas.width + 90,
            scale: 0.55, // تكبير القطع قليلاً
            active: true
        });
    }
}

// دالة لرسم خلفية تدرجية للمربعات
function createGradient(colorStr) {
    if (colorStr.startsWith('linear')) {
        const matches = colorStr.match(/#([a-f0-9]{6})/g);
        if (matches && matches.length >= 2) {
            const grd = ctx.createLinearGradient(0, 0, cellSize, cellSize);
            grd.addColorStop(0, matches[0]);
            grd.addColorStop(1, matches[1]);
            return grd;
        }
    }
    return colorStr;
}

function drawGrid() {
    // رسم الشبكة الخلفية المظلمة
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // خلفية الخلايا الداكنة
            ctx.fillStyle = "#111a2e"; 
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 10);
            ctx.fill();

            // رسم حدود الشبكة
            ctx.strokeStyle = "rgba(100, 150, 255, 0.05)"; 
            ctx.lineWidth = 1;
            ctx.stroke();

            if (grid[r][c] !== 0) {
                const grd = createGradient(grid[r][c]);
                if (gameMode === 'puzzle' && puzzleImg.complete) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 10);
                    ctx.clip();
                    ctx.drawImage(puzzleImg, 0, 0, puzzleImg.width, puzzleImg.height, 0, 0, canvas.width, canvas.width);
                    ctx.restore();
                    // إضافة تراكب خفيف للون لجعل القطع بارزة
                    ctx.fillStyle = "rgba(255,255,255,0.05)";
                    ctx.fill();
                } else {
                    // تأثير إضاءة وشفافية للقطع
                    ctx.shadowBlur = 15; ctx.shadowColor = (grid[r][c].match(/#([a-f0-9]{6})/) || ['','#aaaaaa'])[1];
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.roundRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 10);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    // إضافة لمعان علوي
                    ctx.fillStyle = "rgba(255,255,255,0.15)";
                    ctx.beginPath();
                    ctx.roundRect(x + 5, y + 5, cellSize - 10, (cellSize - 10)/2, 8);
                    ctx.fill();
                }
            }
        }
    }
    // الخط الفاصل
    ctx.strokeStyle = "rgba(100, 150, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, canvas.width + 50);
    ctx.lineTo(canvas.width - 30, canvas.width + 50);
    ctx.stroke();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // رسم خيال القطعة (Preview)
    if (draggingPiece) {
        const gCol = Math.round(draggingPiece.x / cellSize);
        const gRow = Math.round(draggingPiece.y / cellSize);
        if (canPlace(draggingPiece, gRow, gCol)) {
            ctx.globalAlpha = 0.15;
            const grd = createGradient(draggingPiece.color);
            draggingPiece.matrix.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        ctx.fillStyle = grd;
                        ctx.beginPath();
                        ctx.roundRect((gCol+c)*cellSize+5, (gRow+r)*cellSize+5, cellSize-10, cellSize-10, 8);
                        ctx.fill();
                    }
                });
            });
            ctx.globalAlpha = 1.0;
        }
    }

    // رسم القطع السفلية
    availablePieces.forEach(piece => {
        if (!piece.active) return;
        const s = piece.scale * cellSize;
        const grd = createGradient(piece.color);
        ctx.shadowBlur = 10; ctx.shadowColor = (piece.color.match(/#([a-f0-9]{6})/) || ['','#aaaaaa'])[1];
        piece.matrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.roundRect(piece.x + c * s, piece.y + r * s, s - 3, s - 3, 7);
                    ctx.fill();
                }
            });
        });
        ctx.shadowBlur = 0;
    });
}

// --- بقية المنطق البرمجي (canPlace, endDrag, checkLines, updateScoreUI, ...) ---
// (تظل هذه الدوال كما هي في الأصل، مع استبدال playSfx بـ playComplexSfx وتنظيف النصوص في الألغاز)

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
        playComplexSfx('place');
        
        if (gameMode === 'classic') checkLines();
        else { score += 50; updateScoreUI(); } // في نمط الألغاز لا توجد خطوط، النقاط ثابتة لكل قطعة

        if (availablePieces.every(pc => !pc.active)) spawnPieces();
        if (!checkAnyMovePossible()) setTimeout(showGameOver, 500);
    } else {
        // تأثير اهتزاز بسيط عند فشل الوضع
        animateShake(draggingPiece);
        draggingPiece.x = draggingPiece.originalX;
        draggingPiece.y = draggingPiece.originalY;
        draggingPiece.scale = 0.55;
    }
    draggingPiece = null;
    render();
}

function animateShake(piece) {
    // منطق اهتزاز بسيط (يمكن تحسينه)
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
        // تأثير جزيئات (بسيط)
        createParticles(tr, tc);
        
        tr.forEach(r => grid[r].fill(0));
        tc.forEach(c => { for (let r = 0; r < ROWS; r++) grid[r][c] = 0; });
        
        // حساب نقاط مضاعفة للخطوط المتعددة
        const linesCleared = tr.length + tc.length;
        score += linesCleared * linesCleared * 100;
        
        updateScoreUI();
        playComplexSfx('clear');
    }
}

function createParticles(rows, cols) {
    // منطق جزيئات (يمكن تحسينه)
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
    // رسم التاج الذهبي في واجهة النقاط بدلاً من مجرد رمز
    if (crownImg.complete) {
        ctx.drawImage(crownImg, canvas.width/2 - 25, -50, 50, 50);
    }
    scoreElement.innerText = score; 
    highScore = Math.max(score, highScore);
    localStorage.setItem('blockPuzzleHighScore', highScore);
    highScoreElement.innerText = highScore;
}

function showGameOver() {
    // تصميم شاشة نهاية أكثر احترافية
    document.getElementById('finalScoreDisplay').innerText = score + " 👑";
    document.getElementById('gameOverModal').style.display = 'flex';
    document.getElementById('gameOverModal').style.opacity = '1';
}

function restartGame() {
    fadeTransition(document.getElementById('gameOverModal'), modeMenu);
}

// --- تحسينات السحب ---
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrag(e) {
    const pos = getPos(e);
    availablePieces.forEach(p => {
        // توسيع منطقة الالتقاط
        if (p.active && pos.x > p.x - 30 && pos.x < p.x + 90 && pos.y > p.y - 30 && pos.y < p.y + 130) {
            draggingPiece = p; p.scale = 1.0;
            dragOffsetX = (p.matrix[0].length * cellSize) / 2;
            dragOffsetY = (p.matrix.length * cellSize) / 2;
            playComplexSfx('place'); // صوت خفيف عند الالتقاط
        }
    });
}

function doDrag(e) {
    if (!draggingPiece) return;
    const pos = getPos(e);
    // رفع القطعة فوق الإصبع قليلاً
    draggingPiece.x = pos.x - dragOffsetX;
    draggingPiece.y = pos.y - dragOffsetY - 90;
    render();
}

canvas.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', (e) => { if(draggingPiece) e.preventDefault(); doDrag(e); }, {passive: false});
window.addEventListener('touchend', endDrag);
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', endDrag);
