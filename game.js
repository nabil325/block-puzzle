// Game Configuration
const GRID_SIZE = 8;
const CELL_SIZE = 40; // Will be calculated based on canvas size
const PIECE_TYPES = [
    // Single block
    [[1]],
    // 2 blocks
    [[1, 1]],
    [[1], [1]],
    // 3 blocks
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1], [1]],
    [[1, 1], [0, 1]],
    [[1], [1, 1]],
    [[0, 1], [1, 1]],
    // 4 blocks
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [1]],
    [[1, 1, 1], [0, 0, 1]],
];

const COLORS = [
    '#00d4ff', '#00f0ff', '#ffd700', '#ffaa00',
    '#ff6b6b', '#ff4757', '#667eea', '#764ba2',
    '#f093fb', '#4facfe', '#00d2fc', '#ffd700'
];

// Game State
let gameState = {
    grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)),
    nextPieces: [],
    currentScore: 0,
    bestScore: localStorage.getItem('blockPuzzleHighScore') || 0,
    gameMode: 'classic',
    gameActive: true,
    monaImage: null,
    undoboard: [],
};

let dragState = {
    isDragging: false,
    dragPieceIndex: -1,
    offsetX: 0,
    offsetY: 0,
    dragStartX: 0,
    dragStartY: 0,
};

// Canvas Setup
let canvas, ctx, canvasSize;

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Calculate canvas size based on viewport
    const maxSize = Math.min(window.innerWidth - 20, window.innerHeight - 300);
    canvasSize = Math.min(maxSize, 400);

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    return canvasSize / GRID_SIZE;
}

// Initialize Game
function initGame() {
    gameState.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    gameState.currentScore = 0;
    gameState.gameActive = true;
    gameState.undoboard = [];
    gameState.nextPieces = [];

    // Generate initial pieces
    for (let i = 0; i < 3; i++) {
        gameState.nextPieces.push(generateRandomPiece());
    }

    if (gameState.gameMode === 'mona') {
        loadMonaLisaImage();
    }

    setupCanvasEvents();
    updateDisplay();
    draw();
}

// Generate Random Piece
function generateRandomPiece() {
    const type = Math.floor(Math.random() * PIECE_TYPES.length);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rotations = Math.floor(Math.random() * 4);

    return {
        type: type,
        color: color,
        rotation: rotations,
        pattern: rotatePattern(PIECE_TYPES[type], rotations)
    };
}

// Rotate Pattern
function rotatePattern(pattern, times) {
    let result = pattern.map(row => [...row]);
    for (let i = 0; i < times % 4; i++) {
        result = rotateMatrix(result);
    }
    return result;
}

function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = matrix[r][c];
        }
    }

    return rotated;
}

// Setup Canvas Events
function setupCanvasEvents() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

// Mouse Events
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < 3; i++) {
        const pieceRect = getNextPieceRect(i);
        if (x >= pieceRect.x && x < pieceRect.x + pieceRect.size &&
            y >= pieceRect.y && y < pieceRect.y + pieceRect.size) {
            dragState.isDragging = true;
            dragState.dragPieceIndex = i;
            dragState.dragStartX = x;
            dragState.dragStartY = y;
            dragState.offsetX = 0;
            dragState.offsetY = 0;
            break;
        }
    }
}

function handleMouseMove(e) {
    if (!dragState.isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragState.offsetX = x - dragState.dragStartX;
    dragState.offsetY = y - dragState.dragStartY;

    draw();
}

function handleMouseUp(e) {
    if (!dragState.isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    tryPlacePiece(x, y);

    dragState.isDragging = false;
    dragState.dragPieceIndex = -1;
    dragState.offsetX = 0;
    dragState.offsetY = 0;
}

// Touch Events
function handleTouchStart(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    for (let i = 0; i < 3; i++) {
        const pieceRect = getNextPieceRect(i);
        if (x >= pieceRect.x && x < pieceRect.x + pieceRect.size &&
            y >= pieceRect.y && y < pieceRect.y + pieceRect.size) {
            dragState.isDragging = true;
            dragState.dragPieceIndex = i;
            dragState.dragStartX = x;
            dragState.dragStartY = y;
            dragState.offsetX = 0;
            dragState.offsetY = 0;
            break;
        }
    }
}

function handleTouchMove(e) {
    if (!dragState.isDragging) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    dragState.offsetX = x - dragState.dragStartX;
    dragState.offsetY = y - dragState.dragStartY;

    draw();
}

function handleTouchEnd(e) {
    if (!dragState.isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    tryPlacePiece(x, y);

    dragState.isDragging = false;
    dragState.dragPieceIndex = -1;
    dragState.offsetX = 0;
    dragState.offsetY = 0;
}

// Try Place Piece
function tryPlacePiece(x, y) {
    if (dragState.dragPieceIndex === -1) return;

    const cellSize = canvasSize / GRID_SIZE;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    const piece = gameState.nextPieces[dragState.dragPieceIndex];

    if (canPlacePiece(gridX, gridY, piece.pattern)) {
        // Save board state for undo
        gameState.undoboard.push(gameState.grid.map(row => [...row]));

        placePiece(gridX, gridY, piece);
        gameState.nextPieces.splice(dragState.dragPieceIndex, 1);
        gameState.nextPieces.push(generateRandomPiece());

        checkAndClearLines();
        updateDisplay();
        draw();

        if (!hasValidMove()) {
            endGame();
        }
    }
}

// Check if Piece Can Be Placed
function canPlacePiece(startX, startY, pattern) {
    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === 0) continue;

            const gridX = startX + col;
            const gridY = startY + row;

            if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
                return false;
            }

            if (gameState.grid[gridY][gridX] !== 0) {
                return false;
            }
        }
    }
    return true;
}

// Place Piece
function placePiece(startX, startY, piece) {
    for (let row = 0; row < piece.pattern.length; row++) {
        for (let col = 0; col < piece.pattern[row].length; col++) {
            if (piece.pattern[row][col] === 0) continue;

            const gridX = startX + col;
            const gridY = startY + row;

            if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                gameState.grid[gridY][gridX] = piece.color;
            }
        }
    }
}

// Check and Clear Lines
function checkAndClearLines() {
    let clearedLines = 0;

    // Check horizontal lines
    for (let row = 0; row < GRID_SIZE; row++) {
        if (gameState.grid[row].every(cell => cell !== 0)) {
            gameState.grid[row].fill(0);
            clearedLines++;
        }
    }

    // Check vertical lines
    for (let col = 0; col < GRID_SIZE; col++) {
        let isFull = true;
        for (let row = 0; row < GRID_SIZE; row++) {
            if (gameState.grid[row][col] === 0) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            for (let row = 0; row < GRID_SIZE; row++) {
                gameState.grid[row][col] = 0;
            }
            clearedLines++;
        }
    }

    // Calculate score
    if (clearedLines > 0) {
        const baseScore = 100;
        const bonusMultiplier = clearedLines > 1 ? 1.5 : 1;
        const score = Math.floor(baseScore * clearedLines * bonusMultiplier);
        gameState.currentScore += score;
    }
}

// Check if Valid Move Exists
function hasValidMove() {
    for (let piece of gameState.nextPieces) {
        for (let gridY = 0; gridY < GRID_SIZE; gridY++) {
            for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
                if (canPlacePiece(gridX, gridY, piece.pattern)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// End Game
function endGame() {
    gameState.gameActive = false;

    if (gameState.currentScore > gameState.bestScore) {
        gameState.bestScore = gameState.currentScore;
        localStorage.setItem('blockPuzzleHighScore', gameState.bestScore);
    }

    showGameOverModal();
}

// Draw Game
function draw() {
    ctx.fillStyle = 'rgba(15, 52, 96, 0.8)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const cellSize = canvasSize / GRID_SIZE;

    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvasSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvasSize, pos);
        ctx.stroke();
    }

    // Draw placed blocks
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (gameState.grid[row][col] !== 0) {
                drawCell(col * cellSize, row * cellSize, cellSize, gameState.grid[row][col], false);
            }
        }
    }

    // Draw Mona Lisa if applicable
    if (gameState.gameMode === 'mona' && gameState.monaImage) {
        drawMonaLisaOverlay();
    }

    // Draw next pieces
    for (let i = 0; i < 3; i++) {
        drawNextPiece(i);
    }

    // Draw dragging piece
    if (dragState.isDragging && dragState.dragPieceIndex !== -1) {
        const piece = gameState.nextPieces[dragState.dragPieceIndex];
        drawDraggingPiece(piece);
    }
}

// Draw Cell
function drawCell(x, y, size, color, isGhost = false) {
    const borderRadius = 6;
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, adjustBrightness(color, -20));

    ctx.fillStyle = isGhost ? adjustAlpha(gradient, 0.3) : gradient;
    ctx.shadowColor = isGhost ? 'transparent' : adjustAlpha(color, 0.5);
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    roundRect(ctx, x + 2, y + 2, size - 4, size - 4, borderRadius);
    ctx.fill();

    // Border
    ctx.strokeStyle = isGhost ? adjustAlpha(color, 0.4) : adjustBrightness(color, 30);
    ctx.lineWidth = 2;
    roundRect(ctx, x + 2, y + 2, size - 4, size - 4, borderRadius);
    ctx.stroke();

    ctx.shadowColor = 'transparent';
}

// Round Rectangle
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Adjust Color Brightness
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// Adjust Alpha
function adjustAlpha(color, alpha) {
    return color; // Simplified for canvas
}

// Draw Next Piece
function drawNextPiece(index) {
    const pieceRect = getNextPieceRect(index);
    const piece = gameState.nextPieces[index];

    // Draw small preview
    const smallCellSize = pieceRect.size / 4;
    for (let row = 0; row < piece.pattern.length; row++) {
        for (let col = 0; col < piece.pattern[row].length; col++) {
            if (piece.pattern[row][col] === 0) continue;

            const x = pieceRect.x + col * smallCellSize + smallCellSize / 2;
            const y = pieceRect.y + row * smallCellSize + smallCellSize / 2;

            drawCell(x, y, smallCellSize - 2, piece.color, false);
        }
    }
}

// Get Next Piece Rectangle
function getNextPieceRect(index) {
    const cellSize = canvasSize / GRID_SIZE;
    const yStart = cellSize * (GRID_SIZE - 3) + 10;
    const spacing = (canvasSize - 10) / 3;

    return {
        x: spacing * index + 5,
        y: yStart,
        size: spacing - 10
    };
}

// Draw Dragging Piece
function drawDraggingPiece(piece) {
    const cellSize = canvasSize / GRID_SIZE;
    const x = dragState.dragStartX + dragState.offsetX;
    const y = dragState.dragStartY + dragState.offsetY;

    // Draw scaled up piece following mouse
    for (let row = 0; row < piece.pattern.length; row++) {
        for (let col = 0; col < piece.pattern[row].length; col++) {
            if (piece.pattern[row][col] === 0) continue;

            const blockX = x + col * cellSize * 0.8;
            const blockY = y + row * cellSize * 0.8;

            drawCell(blockX, blockY, cellSize * 0.8 - 2, piece.color, false);
        }
    }

    // Draw ghost piece on grid
    const gridX = Math.floor((dragState.dragStartX + dragState.offsetX) / cellSize);
    const gridY = Math.floor((dragState.dragStartY + dragState.offsetY) / cellSize);

    if (canPlacePiece(gridX, gridY, piece.pattern)) {
        for (let row = 0; row < piece.pattern.length; row++) {
            for (let col = 0; col < piece.pattern[row].length; col++) {
                if (piece.pattern[row][col] === 0) continue;

                const x = (gridX + col) * cellSize;
                const y = (gridY + row) * cellSize;

                drawCell(x, y, cellSize - 2, piece.color, true);
            }
        }
    }
}

// Load Mona Lisa Image
function loadMonaLisaImage() {
    // Using a placeholder color pattern that represents Mona Lisa
    gameState.monaImage = true; // Simplified implementation
}

// Draw Mona Lisa Overlay
function drawMonaLisaOverlay() {
    const cellSize = canvasSize / GRID_SIZE;

    // Draw a subtle pattern to represent revealed image
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (gameState.grid[row][col] !== 0) {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
}

// Update Display
function updateDisplay() {
    document.getElementById('currentScore').textContent = gameState.currentScore;
    document.getElementById('bestScore').textContent = gameState.bestScore;
    document.getElementById('menuHighScore').textContent = gameState.bestScore;
}

// Rotate Next Piece
function rotateNextPiece() {
    if (gameState.nextPieces.length === 0) return;

    const piece = gameState.nextPieces[0];
    piece.rotation = (piece.rotation + 1) % 4;
    piece.pattern = rotatePattern(PIECE_TYPES[piece.type], piece.rotation);

    draw();
}

// Undo Move
function undoMove() {
    if (gameState.undoboard.length === 0) return;

    gameState.grid = gameState.undoboard.pop();
    gameState.currentScore = Math.max(0, gameState.currentScore - 100);
    updateDisplay();
    draw();
}

// Show Game Over Modal
function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    document.getElementById('finalScore').textContent = gameState.currentScore;

    const info = document.getElementById('bestScoreInfo');
    if (gameState.currentScore > gameState.bestScore) {
        info.textContent = '🎉 تحطمت الرقم القياسي!';
        info.style.color = '#ffed4e';
    } else {
        info.textContent = `أفضل نتيجة: ${gameState.bestScore}`;
    }

    modal.classList.add('active');
}

// Start Game
function startGame(mode) {
    gameState.gameMode = mode;
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    initCanvas();
    initGame();
}

// Back to Menu
function backToMenu() {
    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('mainMenu').classList.add('active');
    gameState.gameActive = false;
}

// Restart Game
function restartGame() {
    document.getElementById('gameOverModal').classList.remove('active');
    gameState.gameMode = gameState.gameMode; // Keep same mode
    initGame();
    draw();
}

// Initialize on Load
window.addEventListener('load', () => {
    gameState.bestScore = localStorage.getItem('blockPuzzleHighScore') || 0;
    document.getElementById('menuHighScore').textContent = gameState.bestScore;
});

// Handle Resize
window.addEventListener('resize', () => {
    if (document.getElementById('gameScreen').classList.contains('active')) {
        initCanvas();
        draw();
    }
});

// Prevent Default Touch Behavior
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });
