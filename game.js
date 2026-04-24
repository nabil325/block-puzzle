const Game = {
    state: {
        mode: 'classic',
        score: 0,
        grid: Array.from({length: 8}, () => Array(8).fill(0)),
        pieces: [],
        cellSize: 0,
        dragging: null
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.puzzleImg = new Image();
        this.puzzleImg.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500';
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
    },

    start(mode) {
        this.state.mode = mode;
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        this.resize();
        this.spawnPieces();
        this.render();
    },

    resize() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.state.cellSize = this.canvas.width / 8;
    },

    spawnPieces() {
        const shapes = [
            {m: [[1,1,1,1]], c: '#2dd4bf'},
            {m: [[1,1],[1,1]], c: '#facc15'},
            {m: [[0,1,0],[1,1,1]], c: '#a855f7'}
        ];
        this.state.pieces = shapes.map((s, i) => ({
            ...s, x: (this.canvas.width/3)*i + 20, y: this.canvas.width + 40,
            active: true, scale: 0.5
        }));
    },

    drawGrid() {
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const x = c*this.state.cellSize, y = r*this.state.cellSize;
                this.ctx.fillStyle = "#161e31";
                this.ctx.beginPath();
                this.ctx.roundRect(x+2, y+2, this.state.cellSize-4, this.state.cellSize-4, 8);
                this.ctx.fill();
                
                if(this.state.grid[r][c]) {
                    this.drawBlock(x, y, this.state.grid[r][c], r, c);
                }
            }
        }
    },

    drawBlock(x, y, color, r, c) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x+3, y+3, this.state.cellSize-6, this.state.cellSize-6, 6);
        this.ctx.clip();
        if(this.state.mode === 'puzzle') {
            this.ctx.drawImage(this.puzzleImg, 0, 0, 500, 500, 0, 0, this.canvas.width, this.canvas.width);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.restore();
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawPieces();
        requestAnimationFrame(() => this.render());
    },

    drawPieces() {
        this.state.pieces.forEach(p => {
            if(!p.active) return;
            const s = (this.state.dragging === p ? 1 : p.scale) * this.state.cellSize;
            p.m.forEach((row, r) => row.forEach((cell, c) => {
                if(cell) {
                    this.ctx.fillStyle = p.c;
                    this.ctx.beginPath();
                    this.ctx.roundRect(p.x + c*s, p.y + r*s, s-2, s-2, 5);
                    this.ctx.fill();
                }
            }));
        });
    },

    setupInput() {
        const handleStart = (e) => {
            const pos = this.getPos(e);
            this.state.pieces.forEach(p => {
                if(p.active && pos.x > p.x && pos.x < p.x + 80) {
                    this.state.dragging = p;
                }
            });
        };
        const handleMove = (e) => {
            if(!this.state.dragging) return;
            const pos = this.getPos(e);
            this.state.dragging.x = pos.x - 40;
            this.state.dragging.y = pos.y - 120;
        };
        const handleEnd = () => { this.state.dragging = null; };

        this.canvas.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('touchstart', handleStart, {passive: false});
        window.addEventListener('touchmove', handleMove, {passive: false});
        window.addEventListener('touchend', handleEnd);
    },

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
};

window.onload = () => Game.init();
