/**
 * Block Blast Clone - Professional Code
 * Powered by Phaser.js
 */

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 700,
    backgroundColor: '#0f172a',
    parent: 'game-container',
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let grid = [];
const gridSize = 8;
const cellSize = 46;
const gridOffset = { x: 16, y: 150 };
let score = 0;
let scoreText;
const colors = [0xff3e3e, 0x3eff3e, 0x3e3eff, 0xffff3e, 0xff3eff, 0x3effff, 0xffa500];

function preload() {
    // لا نحتاج لصور خارجية، سنرسم الأشكال برمجياً لضمان السرعة
}

function create() {
    // 1. عرض النتيجة في الأعلى
    scoreText = this.add.text(200, 70, '0', { 
        fontSize: '70px', 
        fontWeight: 'bold', 
        fill: '#ffffff' 
    }).setOrigin(0.5);

    // 2. بناء الشبكة الفارغة
    createGrid(this);

    // 3. توليد أول 3 قطع
    spawnNewPieces(this);
}

function createGrid(scene) {
    for (let r = 0; r < gridSize; r++) {
        grid[r] = [];
        for (let c = 0; c < gridSize; c++) {
            let x = gridOffset.x + (c * cellSize) + cellSize/2;
            let y = gridOffset.y + (r * cellSize) + cellSize/2;
            
            // مربعات الخلفية (الشبكة الفارغة)
            scene.add.rectangle(x, y, cellSize - 4, cellSize - 4, 0x1e293b)
                 .setStrokeStyle(1, 0x334155);
            
            grid[r][c] = { filled: false, visual: null };
        }
    }
}

function spawnNewPieces(scene) {
    const shapes = [
        [[1,1],[1,1]], // Square
        [[1,1,1,1]],   // I-Line
        [[1,1,1],[0,1,0]], // T-Shape
        [[1,0],[1,0],[1,1]], // L-Shape
        [[1,1,1]],     // Small Line
        [[1]]          // Single Dot
    ];

    for (let i = 0; i < 3; i++) {
        let shape = shapes[Phaser.Math.Between(0, shapes.length - 1)];
        createPiece(scene, shape, 80 + (i * 120), 600);
    }
}

function createPiece(scene, shape, x, y) {
    let container = scene.add.container(x, y);
    let color = colors[Phaser.Math.Between(0, colors.length - 1)];

    shape.forEach((row, rIdx) => {
        row.forEach((value, cIdx) => {
            if (value === 1) {
                let block = scene.add.rectangle(cIdx * cellSize, rIdx * cellSize, cellSize - 4, cellSize - 4, color)
                    .setStrokeStyle(3, 0xffffff, 0.4); // تأثير اللمعة (3D Look)
                container.add(block);
            }
        });
    });

    container.setSize(cellSize * shape[0].length, cellSize * shape.length);
    container.setInteractive({ draggable: true });
    container.setData('shape', shape);
    container.setScale(0.7); // تصغيرها في منطقة الانتظار

    scene.input.setDraggable(container);

    // أحداث السحب
    container.on('dragstart', () => {
        container.setScale(1.0);
        scene.children.bringToTop(container);
    });

    container.on('drag', (pointer, dragX, dragY) => {
        // الإزاحة (Offset) لجعل القطعة تظهر فوق الإصبع بـ 70 بكسل
        container.setPosition(dragX, dragY - 70);
    });

    container.on('dragend', () => {
        handleDrop(scene, container);
    });
}

function handleDrop(scene, container) {
    let shape = container.getData('shape');
    // حساب الموقع النسبي على الشبكة
    let col = Math.round((container.x - gridOffset.x - (cellSize/2)) / cellSize);
    let row = Math.round((container.y - gridOffset.y - (cellSize/2) + 70) / cellSize); // تعديل حسب الإزاحة

    if (canPlace(row, col, shape)) {
        placeShape(scene, row, col, shape, container);
        container.destroy();
        checkAndClear(scene);
        
        // إذا فرغت منطقة الانتظار، ولد قطعاً جديدة
        if (scene.children.list.filter(c => c.type === 'Container').length === 0) {
            spawnNewPieces(scene);
        }
    } else {
        // العودة للمكان الأصلي في حال فشل الوضع
        scene.tweens.add({
            targets: container,
            x: container.input.dragStartX,
            y: container.input.dragStartY,
            scale: 0.7,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
}

function canPlace(row, col, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                let tr = row + r;
                let tc = col + c;
                if (tr < 0 || tr >= gridSize || tc < 0 || tc >= gridSize || grid[tr][tc].filled) return false;
            }
        }
    }
    return true;
}

function placeShape(scene, row, col, shape, container) {
    let color = container.list[0].fillColor;
    shape.forEach((rData, r) => {
        rData.forEach((val, c) => {
            if (val) {
                let tr = row + r;
                let tc = col + c;
                let x = gridOffset.x + (tc * cellSize) + cellSize/2;
                let y = gridOffset.y + (tr * cellSize) + cellSize/2;
                
                let visual = scene.add.rectangle(x, y, cellSize - 4, cellSize - 4, color)
                    .setStrokeStyle(3, 0xffffff, 0.4);
                
                grid[tr][tc].filled = true;
                grid[tr][tc].visual = visual;
            }
        });
    });
    score += 10;
    scoreText.setText(score);
}

function checkAndClear(scene) {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < gridSize; r++) {
        if (grid[r].every(cell => cell.filled)) rowsToClear.push(r);
    }
    for (let c = 0; c < gridSize; c++) {
        let full = true;
        for (let r = 0; r < gridSize; r++) if (!grid[r][c].filled) full = false;
        if (full) colsToClear.push(c);
    }

    rowsToClear.forEach(r => clearRow(scene, r));
    colsToClear.forEach(c => clearCol(scene, c));

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        let bonus = (rowsToClear.length + colsToClear.length) * 100;
        score += bonus;
        scoreText.setText(score);
    }
}

function clearRow(scene, r) {
    for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].visual) {
            animateClear(scene, grid[r][c].visual);
            grid[r][c].filled = false;
            grid[r][c].visual = null;
        }
    }
}

function clearCol(scene, c) {
    for (let r = 0; r < gridSize; r++) {
        if (grid[r][c].visual) {
            animateClear(scene, grid[r][c].visual);
            grid[r][c].filled = false;
            grid[r][c].visual = null;
        }
    }
}

function animateClear(scene, target) {
    scene.tweens.add({
        targets: target,
        scale: 0,
        alpha: 0,
        duration: 300,
        onComplete: () => target.destroy()
    });
}

function update() {}
