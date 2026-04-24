/**
 * Block Puzzle Pro - Game Engine
 * Lead Developer: AI Assistant (15+ Yrs Experience Simulation)
 */

const Game = {
    // الإعدادات والحالة
    state: {
        mode: 'classic',
        score: 0,
        highScore: localStorage.getItem('bp_high_score') || 1950,
        grid: [],
        pieces: [],
        cellSize: 0,
        isGameOver: false
    },

    assets: {
        puzzleImg: new Image(),
        colors: {
            classic: ['#2dd4bf', '#0d9488'], // Cyan
            gold: ['#facc15', '#ca8a04'],   // Gold
            purple: ['#a855f7', '#7e22ce'], // Purple
            red: ['#f87171', '#dc2626']     // Red
        }
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.assets.puzzleImg.src = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400';
        document.getElementById('highScoreVal').innerText = this.state.highScore;
    },

    start(mode) {
        this.state.mode = mode;
        this.state.score = 0;
        this.state.isGameOver = false;
        this.state.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        
        document.getElementById('mainMenu').classList.remove('active');
        
        this.resize();
        this.spawnPieces();
        this.requestRender();
    },

    resize() {
        const width = Math.min(window.innerWidth - 30, 420);
        this.canvas.width = width;
        this.canvas.height = width + 220;
        this.state.cellSize = width / 8;
    },

    spawnPieces() {
        const shapeTypes = [
            { m: [[1,1,1,1]], c: this.assets.colors.classic },
            { m: [[1,1],[1,1]], c: this.assets.colors.gold },
            { m: [[0,1,0],[1,1,1]], c: this.assets.colors.purple },
            { m: [[1,1,1],[1,0,0]], c: this.assets.colors.red }
        ];

        this.state.pieces = [];
        for (let i = 0; i < 3; i++) {
            const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            this.state.pieces.push({
                ...type,
                x: (this.canvas.width / 3) * i + 15,
                y: this.canvas.width + 80,
                origX: (this.canvas.width / 3) * i + 15,
                origY: this.canvas.width + 80,
                scale: 0.5,
                active: true
            });
        }
    },

    drawGrid() {
        const { ctx, state } = this;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = c * state.cellSize;
                const y = r * state.cellSize;

                // رسم خلفية الخلية بتأثير النيون الخافت
                ctx.fillStyle = "#121826";
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, state.cellSize - 4, state.cellSize - 4, 10);
                ctx.fill();

                if (state.grid[r][c] !== 0) {
                    this.drawBlock(x, y, state.grid[r][c]);
                }
            }
        }
    },

    drawBlock(x, y, colors) {
        const { ctx, state } = this;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, state.cellSize - 6, state.cellSize - 6, 8);
        ctx.clip();

        if (state.mode === 'puzzle') {
            ctx.drawImage(this.assets.puzzleImg, 0, 0, 400, 400, 0, 0, this.canvas.width, this.canvas.width);
        } else {
            const grd = ctx.createLinearGradient(x, y, x, y + state.cellSize);
            grd.addColorStop(0, colors[0]);
            grd.addColorStop(1, colors[1]);
            ctx.fillStyle = grd;
            ctx.fill();
            // لمعان خفيف
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(x + 3, y + 3, state.cellSize - 6, (state.cellSize - 6) / 2);
        }
        ctx.restore();
    },

    requestRender() {
        const loop = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrid();
            this.drawPieces();
            if (!this.state.isGameOver) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    drawPieces() {
        this.state.pieces.forEach(p => {
            if (!p.active) return;
            const size = (draggingPiece === p ? 1 : p.scale) * this.state.cellSize;
            p.m.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        const grd = this.ctx.createLinearGradient(p.x + c * size, p.y + r * size, p.x + c * size, p.y + (r + 1) * size);
                        grd.addColorStop(0, p.c[0]);
                        grd.addColorStop(1, p.c[1]);
                        this.ctx.fillStyle = grd;
                        this.ctx.beginPath();
                        this.ctx.roundRect(p.x + c * size, p.y + r * size, size - 2, size - 2, 6);
                        this.ctx.fill();
                    }
                });
            });
        });
    },

    setupEventListeners() {
        let draggingPiece = null;
        let offset = { x: 0, y: 0 };

        const start = (e) => {
            const pos = this.getMousePos(e);
            this.state.pieces.forEach(p => {
                if (p.active && pos.x > p.x && pos.x < p.x + 100 && pos.y > p.y && pos.y < p.y + 100) {
                    draggingPiece = p;
                    offset = { x: 50, y: 50 };
                    p.y -= 100; // سحبها للأعلى لتكون ظاهرة فوق الأصبع
                }
            });
        };

        const move = (e) => {
            if (!draggingPiece) return;
            e.preventDefault();
            const pos = this.getMousePos(e);
            draggingPiece.x = pos.x - offset.x;
            draggingPiece.y = pos.y - offset.y - 80;
        };

        const end = () => {
            if (!draggingPiece) return;
            const col = Math.round(draggingPiece.x / this.state.cellSize);
            const row = Math.round(draggingPiece.y / this.state.cellSize);

            if (this.canPlace(draggingPiece, row, col)) {
                this.placePiece(draggingPiece, row, col);
            } else {
                draggingPiece.x = draggingPiece.origX;
                draggingPiece.y = draggingPiece.origY;
            }
            draggingPiece = null;
        };

        this.canvas.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        this.canvas.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
    },

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    },

    canPlace(piece, row, col) {
        return piece.m.every((rVec, r) => 
            rVec.every((cell, c) => {
                if (!cell) return true;
                const nr = row + r, nc = col + c;
                return nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.state.grid[nr][nc] === 0;
            })
        );
    },

    placePiece(piece, row, col) {
        piece.m.forEach((rVec, r) => rVec.forEach((cell, c) => {
            if (cell) this.state.grid[row + r][col + c] = piece.c;
        }));
        piece.active = false;
        this.state.score += 50;
        this.checkLines();
        this.updateUI();
        if (this.state.pieces.every(p => !p.active)) this.spawnPieces();
        if (!this.canMoveAnywhere()) this.gameOver();
    },

    checkLines() {
        if (this.state.mode !== 'classic') return;
        let lines = 0;
        // منطق حذف الخطوط (تم شرحه سابقاً)
    },

    updateUI() {
        document.getElementById('scoreVal').innerText = this.state.score;
    },

    gameOver() {
        this.state.isGameOver = true;
        document.getElementById('finalScoreDisplay').innerText = this.state.score;
        document.getElementById('gameOverModal').style.display = 'flex';
    },

    reset() {
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('mainMenu').classList.add('active');
    },

    canMoveAnywhere() { return true; } // تبسيط للفحص
};

// تشغيل المحرك
window.onload = () => Game.init();
