const Game = {
    state: {
        grid: Array.from({length: 8}, () => Array(8).fill(0)),
        pieces: [], score: 0, highScore: localStorage.getItem('hs') || 1950,
        mode: 'classic', dragging: null
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.puzzleImg = new Image();
        this.puzzleImg.src = 'https://picsum.photos/400/400'; // صورة عشوائية للألغاز
        this.setupInput();
    },

    start(mode) {
        this.state.mode = mode;
        this.state.score = 0;
        this.state.grid = Array.from({length: 8}, () => Array(8).fill(0));
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        this.resize();
        this.spawnPieces();
        this.loop();
    },

    resize() {
        const size = Math.min(window.innerWidth - 30, 420);
        this.canvas.width = size;
        this.canvas.height = size + 220;
        this.cellSize = size / 8;
    },

    spawnPieces() {
        const shapes = [
            {m: [[1,1,1,1]], c: '#2dd4bf'}, {m: [[1,1],[1,1]], c: '#facc15'},
            {m: [[0,1,0],[1,1,1]], c: '#a855f7'}, {m: [[1,1,0],[0,1,1]], c: '#f87171'}
        ];
        this.state.pieces = [];
        for(let i=0; i<3; i++) {
            const s = shapes[Math.floor(Math.random()*shapes.length)];
            this.state.pieces.push({
                ...s, x: (this.canvas.width/3)*i + 10, y: this.canvas.width + 60,
                ox: (this.canvas.width/3)*i + 10, oy: this.canvas.width + 60,
                active: true, scale: 0.5
            });
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // رسم الشبكة
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                this.ctx.fillStyle = "#1a2234";
                this.ctx.beginPath();
                this.ctx.roundRect(c*this.cellSize+2, r*this.cellSize+2, this.cellSize-4, this.cellSize-4, 8);
                this.ctx.fill();
                if(this.state.grid[r][c]) this.drawBlock(c*this.cellSize, r*this.cellSize, this.state.grid[r][c]);
            }
        }
        // رسم القطع
        this.state.pieces.forEach(p => {
            if(!p.active) return;
            const size = (this.state.dragging === p ? 1 : 0.5) * this.cellSize;
            p.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) this.drawBlock(p.x + c*size, p.y + r*size, p.c, size);
            }));
        });
    },

    drawBlock(x, y, color, size = this.cellSize) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x+3, y+3, size-6, size-6, 6);
        this.ctx.clip();
        if(this.state.mode === 'puzzle') {
            this.ctx.drawImage(this.puzzleImg, 0, 0, 400, 400, 0, 0, this.canvas.width, this.canvas.width);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.restore();
    },

    checkLines() {
        let toRemoveR = [], toRemoveC = [];
        for(let i=0; i<8; i++) {
            if(this.state.grid[i].every(v => v !== 0)) toRemoveR.push(i);
            if(this.state.grid.every(row => row[i] !== 0)) toRemoveC.push(i);
        }
        toRemoveR.forEach(r => this.state.grid[r].fill(0));
        toRemoveC.forEach(c => this.state.grid.forEach(row => row[c] = 0));
        if(toRemoveR.length || toRemoveC.length) {
            this.state.score += (toRemoveR.length + toRemoveC.length) * 100;
            this.updateUI();
        }
    },

    updateUI() {
        document.getElementById('currentScore').innerText = this.state.score;
        if(this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('hs', this.state.highScore);
            document.getElementById('highScore').innerText = this.state.highScore;
        }
    },

    setupInput() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const t = e.touches ? e.touches[0] : e;
            return { x: t.clientX - rect.left, y: t.clientY - rect.top };
        };
        const start = (e) => {
            const pos = getPos(e);
            this.state.pieces.forEach(p => {
                if(p.active && pos.y > p.y && pos.y < p.y + 100) this.state.dragging = p;
            });
        };
        const move = (e) => {
            if(!this.state.dragging) return;
            const pos = getPos(e);
            this.state.dragging.x = pos.x - this.cellSize/2;
            this.state.dragging.y = pos.y - this.cellSize*1.5;
        };
        const end = () => {
            const p = this.state.dragging;
            if(!p) return;
            const c = Math.round(p.x / this.cellSize), r = Math.round(p.y / this.cellSize);
            let canPlace = r >= 0 && r + p.m.length <= 8 && c >= 0 && c + p.m[0].length <= 8;
            if(canPlace) {
                p.m.forEach((row, pr) => row.forEach((cell, pc) => {
                    if(cell && this.state.grid[r+pr][c+pc] !== 0) canPlace = false;
                }));
            }
            if(canPlace) {
                p.m.forEach((row, pr) => row.forEach((cell, pc) => {
                    if(cell) this.state.grid[r+pr][c+pc] = p.c;
                }));
                p.active = false;
                this.checkLines();
                if(this.state.pieces.every(p => !p.active)) this.spawnPieces();
            } else {
                p.x = p.ox; p.y = p.oy;
            }
            this.state.dragging = null;
        };
        this.canvas.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        this.canvas.addEventListener('touchstart', start);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', end);
    },

    loop() { this.draw(); requestAnimationFrame(() => this.loop()); }
};

window.onload = () => Game.init();
