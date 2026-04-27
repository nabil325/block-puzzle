window.onload = function() {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 400,
        height: 700,
        backgroundColor: '#0f172a',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
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

    function preload() {}

    function create() {
        scoreText = this.add.text(200, 70, '0', { 
            fontSize: '60px', fontWeight: 'bold', fill: '#ffffff' 
        }).setOrigin(0.5);

        createGrid(this);
        spawnNewPieces(this);
    }

    function createGrid(scene) {
        for (let r = 0; r < gridSize; r++) {
            grid[r] = [];
            for (let c = 0; c < gridSize; c++) {
                let x = gridOffset.x + (c * cellSize) + cellSize/2;
                let y = gridOffset.y + (r * cellSize) + cellSize/2;
                scene.add.rectangle(x, y, cellSize - 4, cellSize - 4, 0x1e293b).setStrokeStyle(1, 0x334155);
                grid[r][c] = { filled: false, visual: null };
            }
        }
    }

    function spawnNewPieces(scene) {
        const shapes = [
            [[1,1],[1,1]], [[1,1,1,1]], [[1,1,1],[0,1,0]], [[1,1],[1,0],[1,0]],
            [[1,1,1]], [[1,1]], [[1]], [[1,1,1],[1,0,0],[1,0,0]] // إضافة أشكال متنوعة
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
                        .setStrokeStyle(3, 0xffffff, 0.4);
                    container.add(block);
                }
            });
        });
        container.setSize(cellSize * shape[0].length, cellSize * shape.length);
        container.setInteractive({ draggable: true });
        container.setData('shape', shape);
        container.setScale(0.6); // تصغير القطع في الأسفل لتناسب المساحة
        scene.input.setDraggable(container);
        
        container.on('dragstart', () => { 
            container.setScale(1.0); 
            scene.children.bringToTop(container); 
        });
        
        container.on('drag', (pointer, dragX, dragY) => { 
            container.setPosition(dragX, dragY - 80); // رفع القطعة فوق الإصبع
        });

        container.on('dragend', () => { 
            handleDrop(scene, container); 
        });
    }

    function handleDrop(scene, container) {
        let shape = container.getData('shape');
        let col = Math.round((container.x - gridOffset.x - (cellSize/2)) / cellSize);
        let row = Math.round((container.y - gridOffset.y - (cellSize/2) + 80) / cellSize);

        if (canPlace(row, col, shape)) {
            placeShape(scene, row, col, shape, container);
            container.destroy();
            checkAndClear(scene);
            
            if (scene.children.list.filter(c => c.type === 'Container').length === 0) {
                spawnNewPieces(scene);
            }
            checkGameOver(scene);
        } else {
            scene.tweens.add({ 
                targets: container, x: container.input.dragStartX, y: container.input.dragStartY, 
                scale: 0.6, duration: 200, ease: 'Back.out' 
            });
        }
    }

    function canPlace(row, col, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    let tr = row + r, tc = col + c;
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
                    let tr = row + r, tc = col + c;
                    let x = gridOffset.x + (tc * cellSize) + cellSize/2;
                    let y = gridOffset.y + (tr * cellSize) + cellSize/2;
                    grid[tr][tc].visual = scene.add.rectangle(x, y, cellSize - 4, cellSize - 4, color).setStrokeStyle(3, 0xffffff, 0.4);
                    grid[tr][tc].filled = true;
                    scene.tweens.add({ targets: grid[tr][tc].visual, scale: {from: 1.2, to: 1}, duration: 100 });
                }
            });
        });
        score += 10;
        scoreText.setText(score);
    }

    function checkAndClear(scene) {
        let rowsToClear = [], colsToClear = [];
        for (let r = 0; r < gridSize; r++) if (grid[r].every(cell => cell.filled)) rowsToClear.push(r);
        for (let c = 0; c < gridSize; c++) {
            let full = true;
            for (let r = 0; r < gridSize; r++) if (!grid[r][c].filled) full = false;
            if (full) colsToClear.push(c);
        }
        
        let combo = rowsToClear.length + colsToClear.length;
        rowsToClear.forEach(r => { for (let c = 0; c < gridSize; c++) clearCell(scene, r, c); });
        colsToClear.forEach(c => { for (let r = 0; r < gridSize; r++) clearCell(scene, r, c); });
        
        if (combo > 0) {
            score += (combo * 100);
            scoreText.setText(score);
            if (window.navigator.vibrate) window.navigator.vibrate(50); // اهتزاز بسيط
        }
    }

    function clearCell(scene, r, c) {
        if (grid[r][c].visual) {
            let v = grid[r][c].visual;
            scene.tweens.add({ targets: v, scale: 0, alpha: 0, duration: 200, onComplete: () => v.destroy() });
            grid[r][c].filled = false;
            grid[r][c].visual = null;
        }
    }

    function checkGameOver(scene) {
        let containers = scene.children.list.filter(c => c.type === 'Container');
        let canPlaceAny = false;

        containers.forEach(container => {
            let shape = container.getData('shape');
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (canPlace(r, c, shape)) canPlaceAny = true;
                }
            }
        });

        if (!canPlaceAny && containers.length > 0) {
            scene.add.rectangle(200, 350, 300, 150, 0x000000, 0.8).setDepth(100);
            scene.add.text(200, 350, 'GAME OVER\nTap to Restart', { 
                fontSize: '32px', fill: '#fff', align: 'center' 
            }).setOrigin(0.5).setDepth(101).setInteractive().on('pointerdown', () => location.reload());
        }
    }

    function update() {}
};
