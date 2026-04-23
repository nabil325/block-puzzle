// ... المتغيرات والإعدادات بالأعلى كما هي ...

// تحديث لوحة النقاط في دالة updateScoreUI
function updateScoreUI() {
    scoreElement.innerText = score;
    const isNewHighScore = score > highScore;
    highScore = Math.max(score, highScore);
    localStorage.setItem('blockBlastHighScore', highScore);
    
    highScoreElement.innerText = highScore;
    // التأكد من تحديث رقم المستوى في الـ HTML
    if(document.getElementById('levelVal')) {
        document.getElementById('levelVal').innerText = currentLevel;
    }
}

// دالة إعادة التشغيل التي سيستدعيها الزر الجديد
function restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    initGame();
}

// تعديل منطق نهاية اللعبة في دالة endDrag
// بدلاً من الـ alert القديم:
if (!canMovePossible()) {
    setTimeout(() => {
        const modal = document.getElementById('gameOverModal');
        // ترتيب وتحديث المعلومات في النافذة
        document.getElementById('finalLevel').innerText = "المستوى الذي وصلت إليه: " + currentLevel;
        document.getElementById('finalScore').innerText = score + " 👑";
        modal.style.display = 'flex'; // إظهار النافذة
        playSfx(200, 'sawtooth', 0.5); // صوت الخسارة
    }, 500);
}

// تحديث منطق المستوى في دالة checkLines
function checkLines() {
    // ... الكود السابق للمسح ...
    
    if (tr.length > 0 || tc.length > 0) {
        // ... كود حذف الصفوف وزيادة النقاط ...
        
        // المنطق الجديد: إذا تجاوزت النقاط الحالية أفضل نتيجة سابقة، يرتفع المستوى
        if (score > highScore && currentLevel < 5000) {
            currentLevel++;
            playSfx(1000, 'sine', 0.2); // صوت التميز
        }
        
        updateScoreUI();
    }
}
