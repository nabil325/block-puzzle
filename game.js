const BOARD_SIZE = 10;
const boardElement = document.getElementById('board');
const piecesContainer = document.getElementById('piecesContainer');
let score = 0;
let grid = [];

function init() {
    createBoard();
    spawnPieces();
}

function createBoard() {
    boardElement.innerHTML = '';
    grid = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        boardElement.appendChild(cell);
    }
}

// أضف بقية الدوال (spawnPieces, canPlace, placePiece) هنا كما في الكود السابق...

init();
