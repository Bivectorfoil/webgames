class Game2048 {
    constructor(size = 4) {
        this.size = size;
        this.board = Array(size).fill().map(() => Array(size).fill(0));
        this.score = 0;
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.touchStartX = null;
        this.touchStartY = null;
        this.isAutoPlaying = false;
        this.autoPlayDelay = 200; // Delay between moves in milliseconds
        this.magicButton = document.getElementById('magic');
        this.setupEventListeners();
        this.init();
    }

    init() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.gameOverScreen.classList.remove('show');
        this.isAutoPlaying = false;
        this.magicButton.textContent = 'Magic';
        this.generateTile();
        this.generateTile();
        this.renderBoard();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isAutoPlaying && e.key.startsWith('Arrow')) {
                e.preventDefault();
                const direction = e.key.replace('Arrow', '').toLowerCase();
                this.handleMove(direction);
            }
        });

        // Touch controls
        this.gameBoard.addEventListener('touchstart', (e) => {
            if (!this.isAutoPlaying) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }
        });

        this.gameBoard.addEventListener('touchend', (e) => {
            if (!this.isAutoPlaying && this.touchStartX && this.touchStartY) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;

                const deltaX = touchEndX - this.touchStartX;
                const deltaY = touchEndY - this.touchStartY;

                const minSwipeDistance = 50;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        this.handleMove(deltaX > 0 ? 'right' : 'left');
                    }
                } else {
                    if (Math.abs(deltaY) > minSwipeDistance) {
                        this.handleMove(deltaY > 0 ? 'down' : 'up');
                    }
                }

                this.touchStartX = null;
                this.touchStartY = null;
            }
        });

        // New game button
        document.getElementById('new-game').addEventListener('click', () => {
            this.isAutoPlaying = false;
            this.init();
        });
        document.getElementById('restart').addEventListener('click', () => {
            this.isAutoPlaying = false;
            this.init();
        });

        // Magic button
        document.getElementById('magic').addEventListener('click', () => {
            if (!this.isAutoPlaying) {
                this.startAutoPlay();
            } else {
                this.stopAutoPlay();
            }
        });
    }

    handleMove(direction) {
        const prevBoard = JSON.stringify(this.board);
        this.move(direction);
        
        if (prevBoard !== JSON.stringify(this.board)) {
            this.generateTile();
            this.renderBoard();
            
            if (this.isGameOver()) {
                this.showGameOver();
            }
        }
    }

    generateTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
            return {row: r, col: c};
        }
        return null;
    }

    move(direction) {
        const rotatedBoard = this.rotateBoard(direction);
        let moved = false;
        
        for (let r = 0; r < this.size; r++) {
            const row = rotatedBoard[r].filter(cell => cell !== 0);
            let newRow = [];
            
            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    const merged = row[i] * 2;
                    newRow.push(merged);
                    this.score += merged;
                    i++;
                    moved = true;
                } else {
                    newRow.push(row[i]);
                }
            }
            
            while (newRow.length < this.size) {
                newRow.push(0);
            }
            
            if (JSON.stringify(rotatedBoard[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            
            rotatedBoard[r] = newRow;
        }
        
        if (moved) {
            this.board = this.unrotateBoard(rotatedBoard, direction);
            this.scoreDisplay.textContent = this.score;
        }
        
        return moved;
    }

    rotateBoard(direction) {
        let board = JSON.parse(JSON.stringify(this.board));
        
        switch(direction) {
            case 'left':
                return board;
            case 'right':
                return board.map(row => row.reverse());
            case 'up':
                return this.transpose(board);
            case 'down':
                return this.transpose(board).map(row => row.reverse());
        }
    }

    unrotateBoard(board, direction) {
        switch(direction) {
            case 'left':
                return board;
            case 'right':
                return board.map(row => row.reverse());
            case 'up':
                return this.transpose(board);
            case 'down':
                return this.transpose(board.map(row => row.reverse()));
        }
    }

    transpose(board) {
        return board[0].map((_, colIndex) => board.map(row => row[colIndex]));
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const tile = document.createElement('div');
                const value = this.board[r][c];
                tile.className = 'tile' + (value ? ' tile-' + value : '');
                tile.textContent = value || '';
                this.gameBoard.appendChild(tile);
            }
        }
    }

    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) return false;
            }
        }

        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const current = this.board[r][c];
                // Check right
                if (c < this.size - 1 && current === this.board[r][c + 1]) return false;
                // Check down
                if (r < this.size - 1 && current === this.board[r + 1][c]) return false;
            }
        }

        return true;
    }

    showGameOver() {
        this.finalScoreDisplay.textContent = this.score;
        this.gameOverScreen.classList.add('show');
        this.stopAutoPlay(); // Ensure auto-play is stopped when game is over
    }

    startAutoPlay() {
        if (this.isAutoPlaying) return;
        
        this.isAutoPlaying = true;
        this.magicButton.textContent = 'Stop Magic';
        
        // Start a new auto-play sequence
        if (!this.isGameOver()) {
            this.autoPlay();
        }
    }

    stopAutoPlay() {
        this.isAutoPlaying = false;
        this.magicButton.textContent = 'Magic';
    }

    autoPlay() {
        if (!this.isAutoPlaying || this.isGameOver()) {
            this.stopAutoPlay();
            return;
        }

        // Look ahead multiple moves
        const directions = ['left', 'down', 'right', 'up'];
        let bestMove = null;
        let bestScore = -Infinity;
        let bestMaxValue = 0;

        // Try each move
        for (const direction of directions) {
            const boardCopy = JSON.parse(JSON.stringify(this.board));
            const moved = this.simulateMove(direction, boardCopy);
            
            if (moved) {
                // Look ahead one more move
                let minSecondMoveScore = Infinity;
                let maxValue = 0;
                
                // Find current max value
                for (let r = 0; r < this.size; r++) {
                    for (let c = 0; c < this.size; c++) {
                        if (boardCopy[r][c] > maxValue) {
                            maxValue = boardCopy[r][c];
                        }
                    }
                }

                // Try each possible second move
                for (const secondDirection of directions) {
                    const secondBoardCopy = JSON.parse(JSON.stringify(boardCopy));
                    const secondMoved = this.simulateMove(secondDirection, secondBoardCopy);
                    
                    if (secondMoved) {
                        const score = this.evaluatePosition(secondBoardCopy);
                        minSecondMoveScore = Math.min(minSecondMoveScore, score);
                    }
                }

                // Use the worst possible outcome for this move
                if (minSecondMoveScore > bestScore || 
                    (minSecondMoveScore === bestScore && maxValue > bestMaxValue)) {
                    bestScore = minSecondMoveScore;
                    bestMove = direction;
                    bestMaxValue = maxValue;
                }
            }
        }

        if (bestMove) {
            this.handleMove(bestMove);
            
            if (this.isAutoPlaying && !this.isGameOver()) {
                setTimeout(() => {
                    if (this.isAutoPlaying) {
                        this.autoPlay();
                    }
                }, this.autoPlayDelay);
            }
        } else {
            this.stopAutoPlay();
        }
    }

    simulateMove(direction, board) {
        const size = board.length;
        const rotated = this.simulateRotateBoard(direction, board);
        let moved = false;
        
        for (let r = 0; r < size; r++) {
            const row = rotated[r].filter(cell => cell !== 0);
            let newRow = [];
            
            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    newRow.push(row[i] * 2);
                    i++;
                    moved = true;
                } else {
                    newRow.push(row[i]);
                }
            }
            
            while (newRow.length < size) {
                newRow.push(0);
            }
            
            if (JSON.stringify(rotated[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            
            rotated[r] = newRow;
        }
        
        return moved;
    }

    simulateRotateBoard(direction, board) {
        const size = board.length;
        let rotated = JSON.parse(JSON.stringify(board));
        
        switch(direction) {
            case 'left':
                return rotated;
            case 'right':
                return rotated.map(row => row.reverse());
            case 'up':
                return this.transpose(rotated);
            case 'down':
                return this.transpose(rotated).map(row => row.reverse());
        }
    }

    evaluatePosition(board) {
        let score = 0;
        const size = board.length;

        // 1. Weight for maintaining largest values in corners
        const corners = [
            [0, 0], [0, size-1],
            [size-1, 0], [size-1, size-1]
        ];
        
        let maxValue = 0;
        let maxCornerValue = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] > maxValue) {
                    maxValue = board[r][c];
                }
            }
        }

        // Check if max value is in a corner
        for (const [r, c] of corners) {
            if (board[r][c] > maxCornerValue) {
                maxCornerValue = board[r][c];
            }
        }

        // Heavily reward having the maximum value in a corner
        if (maxCornerValue === maxValue) {
            score += maxValue * 10;
        }

        // 2. Reward monotonic patterns (snake pattern)
        // Check rows for monotonic decrease from left or right
        for (let r = 0; r < size; r++) {
            let leftToRight = 0;
            let rightToLeft = 0;
            
            for (let c = 0; c < size - 1; c++) {
                if (board[r][c] >= board[r][c + 1]) {
                    leftToRight += board[r][c];
                }
                if (board[r][size - 1 - c] >= board[r][size - 2 - c]) {
                    rightToLeft += board[r][size - 1 - c];
                }
            }
            
            score += Math.max(leftToRight, rightToLeft) * 2;
        }

        // Check columns for monotonic decrease from top or bottom
        for (let c = 0; c < size; c++) {
            let topToBottom = 0;
            let bottomToTop = 0;
            
            for (let r = 0; r < size - 1; r++) {
                if (board[r][c] >= board[r + 1][c]) {
                    topToBottom += board[r][c];
                }
                if (board[size - 1 - r][c] >= board[size - 2 - r][c]) {
                    bottomToTop += board[size - 1 - r][c];
                }
            }
            
            score += Math.max(topToBottom, bottomToTop) * 2;
        }

        // 3. Reward having similar values adjacent to each other
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (board[r][c] === board[r][c + 1] && board[r][c] !== 0) {
                    score += board[r][c] * 4;
                }
            }
        }
        
        for (let c = 0; c < size; c++) {
            for (let r = 0; r < size - 1; r++) {
                if (board[r][c] === board[r + 1][c] && board[r][c] !== 0) {
                    score += board[r][c] * 4;
                }
            }
        }

        // 4. Reward empty cells (more empty cells = more flexibility)
        const emptyCells = board.flat().filter(cell => cell === 0).length;
        score += emptyCells * maxValue; // Scale empty cell bonus with current max value

        // 5. Penalty for scattered small values when we have large values
        let smallValuePenalty = 0;
        const smallThreshold = maxValue / 8;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] !== 0 && board[r][c] < smallThreshold) {
                    smallValuePenalty += smallThreshold - board[r][c];
                }
            }
        }
        score -= smallValuePenalty;

        return score;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
