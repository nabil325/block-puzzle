const Game = {
    state: {
        grid: [],
        score: 0,
        highScore: localStorage.getItem('blockBlastHighScore') || 0,
        pieces: [],
        dragging: null,
        mode: 'classic',
        cellSize: 0
    },

    // الألوان المستوحاة من صورك
    colors: {
        cyan: '#2dd4bf', gold: '#fbbf24', purple: '#a855f7', 
        red: '#f87171', green: '#4ade80', pink: '#ec4899', gray: '#94a3b8'
    },

    shapes: [
        { matrix: [[1, 1, 1, 1]], color: '#2dd4bf' },
        { matrix: [[1, 1], [1, 1]], color: '#fbbf24' },
        { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
        { matrix: [[1, 1, 1], [1, 0, 0]], color: '#f87171' },
        { matrix: [[1, 1, 0], [0, 1, 1]], color: '#4ade80' },
        { matrix: [[1]], color: '#94a3b8' }
    ],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.puzzleImg = new Image();
        this.puzzleImg.src = 'https://picsum.photos/400/400';
        this.setupEvents();
        document.getElementById('highScoreVal').innerText = this.state.highScore;
    },

    start(mode) {
        this.state.mode = mode;
        this.state.score = 0;
        this.state.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.resize();
        this.spawnPieces();
        this.render();
    },

    resize() {
        const size = Math.min(window.innerWidth - 40, 380);
        this.canvas.width = size;
        this.canvas.height = size + 160;
        this.state.cellSize = size / 8;
    },

    spawnPieces() {
        this.state.pieces = [];
        for (let i = 0; i < 3; i++) {
            const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
            this.state.pieces.push({
                ...shape,
                x: (this.canvas.width / 3) * i + 15,
                y: this.canvas.width + 40,
                ox: (this.canvas.width / 3) * i + 15,
                oy: this.canvas.width + 40,
                active: true,
                scale: 0.5
            });
        }
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawPieces();
        requestAnimationFrame(() => this.render());
    },

    drawGrid() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = c * this.state.cellSize, y = r * this.state.cellSize;
                this.ctx.fillStyle = "#1e293b";
                this.ctx.beginPath();
                this.ctx.roundRect(x+2, y+2, this.state.cellSize-4, this.state.cellSize-4, 8);
                this.ctx.fill();

                if (this.state.grid[r][c]) {
                    this.drawBlock(x, y, this.state.grid[r][c]);
                }
            }
        }
    },

    drawBlock(x, y, color) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x+3, y+3, this.state.cellSize-6, this.state.cellSize-6, 6);
        this.ctx.clip();
        if(this.state.mode === 'puzzle') {
            this.ctx.drawImage(this.puzzleImg, 0, 0, 400, 400, 0, 0, this.canvas.width, this.canvas.width);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.restore();
    },

    drawPieces() {
        this.state.pieces.forEach(p => {
            if (!p.active) return;
            const s = (this.state.dragging === p ? 1 : 0.5) * this.state.cellSize;
            p.matrix.forEach((row, r) => row.forEach((cell, c) => {
                if (cell) {
                    this.ctx.fillStyle = p.color;
                    this.ctx.beginPath();
                    this.ctx.roundRect(p.x + c*s, p.y + r*s, s-2, s-2, 4);
                    this.ctx.fill();
                }
            }));
        });
    },

    checkLines() {
        let tr = [], tc = [];
        for (let i = 0; i < 8; i++) {
            if (this.state.grid[i].every(v => v !== 0)) tr.push(i);
            if (this.state.grid.every(row => row[i] !== 0)) tc.push(i);
        }
        tr.forEach(r => this.state.grid[r].fill(0));
        tc.forEach(c => this.state.grid.forEach(row => row[c] = 0));
        if (tr.length || tc.length) {
            this.state.score += (tr.length + tc.length) * 100;
            this.updateUI();
        }
    },

    updateUI() {
        document.getElementById('scoreVal').innerText = this.state.score;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('blockBlastHighScore', this.state.highScore);
            document.getElementById('highScoreVal').innerText = this.state.highScore;
        }
    },

    setupEvents() {
        const getPos = e => {
            const rect = this.canvas.getBoundingClientRect();
            const t = e.touches ? e.touches[0] : e;
            return { x: t.clientX - rect.left, y: t.clientY - rect.top };
        };
        const start = e => {
            const pos = getPos(e);
            this.state.pieces.forEach(p => {
                if (p.active && pos.y > p.y && pos.y < p.y + 100) this.state.dragging = p;
            });
        };
        const move = e => {
            if (!this.state.dragging) return;
            const pos = getPos(e);
            this.state.dragging.x = pos.x - 40;
            this.state.dragging.y = pos.y - 120;
        };
        const end = () => {
            if (!this.state.dragging) return;
            const p = this.state.dragging;
            const c = Math.round(p.x / this.state.cellSize), r = Math.round(p.y / this.state.cellSize);
            
            let canPlace = r >= 0 && r + p.matrix.length <= 8 && c >= 0 && c + p.matrix[0].length <= 8;
            if(canPlace) {
                p.matrix.forEach((row, pr) => row.forEach((cell, pc) => {
                    if(cell && this.state.grid[r+pr][c+pc] !== 0) canPlace = false;
                }));
            }

            if (canPlace) {
                p.matrix.forEach((row, pr) => row.forEach((cell, pc) => {
                    if (cell) this.state.grid[r+pr][c+pc] = p.color;
                }));
                p.active = false;
                this.checkLines();
                if (this.state.pieces.every(pc => !pc.active)) this.spawnPieces();
            } else {
                p.x = p.ox; p.y = p.oy;
            }
            this.state.dragging = null;
        };

        this.canvas.addEventListener('touchstart', start);
        window.addEventListener('touchmove', move, {passive: false});
        window.addEventListener('touchend', end);
        this.canvas.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
    }
};

window.onload = () => Game.init();
