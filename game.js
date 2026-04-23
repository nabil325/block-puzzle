// ... (أبقِ المتغيرات والإعدادات بالأعلى كما هي)

function placePiece(p, row, col) {
    p.matrix.forEach((rMat, r) => {
        rMat.forEach((cell, c) => {
            if (cell) grid[row + r][col + c] = p.color;
        });
    });
    p.active = false;
    addScore(p.matrix.flat().filter(x => x).length * 10);
    checkLines();

    if (availablePieces.every(pc => !pc.active)) {
        spawnPieces();
    }

    // فحص هل خسر اللاعب بعد وضع القطعة وتوليد قطع جديدة
    checkGameOver();
}

// --- دالة فحص الخسارة ---
function checkGameOver() {
    // نمر على كل القطع المتاحة حالياً
    const activePieces = availablePieces.filter(p => p.active);
    
    // إذا وجدنا قطعة واحدة على الأقل يمكن وضعها، فاللاعب لم يخسر
    let canPlaceAny = false;

    activePieces.forEach(piece => {
        for (let r = 0; r <= ROWS - piece.matrix.length; r++) {
            for (let c = 0; c <= COLS - piece.matrix[0].length; c++) {
                if (canPlace(piece, r, c)) {
                    canPlaceAny = true;
                    return;
                }
            }
        }
    });

    if (!canPlaceAny && activePieces.length > 0) {
        gameOver();
    }
}

function gameOver() {
    playSfx(200, 'sawtooth', 0.5); // صوت الخسارة
    setTimeout(() => {
        alert("انتهت اللعبة! مجموع نقاطك: " + score);
        initGame(); // إعادة تشغيل اللعبة تلقائياً
    }, 100);
}

// ... (بقية الكود الخاص بالرسم والسحب كما هو)
