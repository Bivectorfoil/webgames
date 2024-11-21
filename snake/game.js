class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.body = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.growing = false;
    }

    move() {
        this.direction = this.nextDirection;
        const head = {...this.body[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.body.unshift(head);
        if (!this.growing) {
            this.body.pop();
        }
        this.growing = false;
    }

    grow() {
        this.growing = true;
    }

    checkCollision(width, height) {
        const head = this.body[0];
        if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
            return true;
        }

        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.width = this.canvas.width / this.gridSize;
        this.height = this.canvas.height / this.gridSize;
        
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.gameSpeed = 300;
        this.isAutoPlaying = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('magicButton').addEventListener('click', () => this.toggleAutoPlay());
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const magicButton = document.getElementById('magicButton');
        magicButton.textContent = this.isAutoPlaying ? 'Stop Magic' : 'Magic';
        
        if (this.isAutoPlaying && !this.gameLoop) {
            this.startGame();
        }
    }

    findPath() {
        const head = this.snake.body[0];
        const food = this.food;
        
        // Calculate direct distances
        const directUp = { dir: 'up', x: head.x, y: head.y - 1 };
        const directDown = { dir: 'down', x: head.x, y: head.y + 1 };
        const directLeft = { dir: 'left', x: head.x - 1, y: head.y };
        const directRight = { dir: 'right', x: head.x + 1, y: head.y };
        
        // Get all possible moves
        const possibleMoves = [directUp, directDown, directLeft, directRight]
            .filter(move => {
                // Check if move would cause collision
                if (move.x < 0 || move.x >= this.width || move.y < 0 || move.y >= this.height) {
                    return false;
                }
                
                // Check if move would hit snake body
                return !this.snake.body.some(segment => 
                    segment.x === move.x && segment.y === move.y
                );
            });

        // If we're right next to the food, prioritize eating it
        const moveToFood = possibleMoves.find(move => 
            move.x === food.x && move.y === food.y
        );
        if (moveToFood) return moveToFood.dir;

        // Simple direct path check first
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        const directMove = possibleMoves.find(move => {
            if (dx > 0 && move.dir === 'right') return true;
            if (dx < 0 && move.dir === 'left') return true;
            if (dy > 0 && move.dir === 'down') return true;
            if (dy < 0 && move.dir === 'up') return true;
            return false;
        });
        
        if (directMove && Math.random() < 0.8) return directMove.dir;

        // If direct path not possible or randomly skipped, try A*
        const path = this.findPathToFood();
        if (path && path.length > 0) {
            const nextMove = possibleMoves.find(move => 
                move.x === path[0].x && move.y === path[0].y
            );
            if (nextMove) return nextMove.dir;
        }

        // Fallback to space-maximizing strategy
        const scoredMoves = possibleMoves.map(move => ({
            ...move,
            score: this.calculateSpaceScore(move) * 2 - this.calculateDangerScore(move) * 3
        }));

        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves.length > 0 ? scoredMoves[0].dir : null;
    }

    findPathToFood() {
        const start = this.snake.body[0];
        const end = this.food;
        
        // Quick check for direct path possibility
        if (Math.abs(start.x - end.x) + Math.abs(start.y - end.y) > this.width * this.height / 2) {
            return null; // If too far, don't try expensive pathfinding
        }

        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startStr = JSON.stringify(start);
        openSet.push(startStr);
        gScore.set(startStr, 0);
        fScore.set(startStr, this.heuristic(start, end));
        
        let iterations = 0;
        const maxIterations = 200; // Limit pathfinding iterations
        
        while (openSet.length > 0) {
            iterations++;
            if (iterations > maxIterations) return null;

            // Find node with lowest fScore
            let currentStr = openSet[0];
            let lowestFScore = fScore.get(currentStr);
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                const score = fScore.get(openSet[i]);
                if (score < lowestFScore) {
                    lowestFScore = score;
                    currentStr = openSet[i];
                    currentIndex = i;
                }
            }
            
            const current = JSON.parse(currentStr);
            
            // Check if we reached the food
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Remove current from openSet
            openSet.splice(currentIndex, 1);
            closedSet.add(currentStr);
            
            // Check immediate neighbors only
            const neighbors = [
                {x: current.x + 1, y: current.y},
                {x: current.x - 1, y: current.y},
                {x: current.x, y: current.y + 1},
                {x: current.x, y: current.y - 1}
            ];
            
            for (let neighbor of neighbors) {
                const neighborStr = JSON.stringify(neighbor);
                
                if (closedSet.has(neighborStr)) continue;
                
                // Basic bounds and collision checking
                if (neighbor.x < 0 || neighbor.x >= this.width || 
                    neighbor.y < 0 || neighbor.y >= this.height ||
                    this.isSnakeBody(neighbor)) continue;
                
                const tentativeGScore = gScore.get(currentStr) + 1;
                
                if (!openSet.includes(neighborStr)) {
                    openSet.push(neighborStr);
                } else if (tentativeGScore >= (gScore.get(neighborStr) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(neighborStr, current);
                gScore.set(neighborStr, tentativeGScore);
                fScore.set(neighborStr, tentativeGScore + this.heuristic(neighbor, end));
            }
        }
        
        return null;
    }

    isSnakeBody(pos, current) {
        // Don't count the tail if the snake isn't growing
        const bodyToCheck = this.snake.growing ? 
            this.snake.body : 
            this.snake.body.slice(0, -1);
            
        return bodyToCheck.some(segment => 
            segment.x === pos.x && segment.y === pos.y
        );
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentStr = JSON.stringify(current);
        
        while (cameFrom.has(currentStr)) {
            current = cameFrom.get(currentStr);
            currentStr = JSON.stringify(current);
            path.unshift(current);
        }
        
        return path.slice(1); // Remove start position
    }

    calculateSpaceScore(move) {
        let space = 0;
        const visited = new Set();
        const queue = [[move.x, move.y]];
        
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
            if (this.snake.body.some(segment => segment.x === x && segment.y === y)) continue;
            
            visited.add(key);
            space++;
            
            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        
        return space;
    }

    calculateDangerScore(move) {
        let score = 0;
        
        // Check proximity to walls
        if (move.x <= 1 || move.x >= this.width - 2) score += 2;
        if (move.y <= 1 || move.y >= this.height - 2) score += 2;
        
        // Check proximity to snake body
        this.snake.body.forEach(segment => {
            const distance = Math.abs(segment.x - move.x) + Math.abs(segment.y - move.y);
            if (distance < 2) score += 1;
        });

        // Additional penalty for moves that might trap the snake
        if (this.isNearCorner(move)) score += 3;
        
        return score;
    }

    isNearCorner(move) {
        const isNearWallX = move.x <= 1 || move.x >= this.width - 2;
        const isNearWallY = move.y <= 1 || move.y >= this.height - 2;
        return isNearWallX && isNearWallY;
    }

    handleKeyPress(e) {
        const key = e.key;
        const directions = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        if (directions[key]) {
            const newDirection = directions[key];
            const currentDirection = this.snake.direction;
            
            // Prevent 180-degree turns
            if (
                !(currentDirection === 'up' && newDirection === 'down') &&
                !(currentDirection === 'down' && newDirection === 'up') &&
                !(currentDirection === 'left' && newDirection === 'right') &&
                !(currentDirection === 'right' && newDirection === 'left')
            ) {
                this.snake.nextDirection = newDirection;
            }
        }
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.width),
                y: Math.floor(Math.random() * this.height)
            };
        } while (this.snake.body.some(segment => 
            segment.x === food.x && segment.y === food.y));
        return food;
    }

    update() {
        if (this.isAutoPlaying) {
            const nextMove = this.findPath();
            if (nextMove && nextMove !== this.snake.direction) {
                this.snake.nextDirection = nextMove;
            }
        }

        this.snake.move();

        // Check for food collision
        if (this.snake.body[0].x === this.food.x && this.snake.body[0].y === this.food.y) {
            this.snake.grow();
            this.food = this.generateFood();
            this.score += 10;
            document.getElementById('score').textContent = this.score;
        }

        // Check for game over
        if (this.snake.checkCollision(this.width, this.height)) {
            this.gameOver();
            return;
        }

        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#f0f0f0';
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.ctx.strokeRect(
                    i * this.gridSize,
                    j * this.gridSize,
                    this.gridSize,
                    this.gridSize
                );
                // Add subtle background for each cell
                if ((i + j) % 2 === 0) {
                    this.ctx.fillStyle = '#fafafa';
                    this.ctx.fillRect(
                        i * this.gridSize,
                        j * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }

        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        this.snake.body.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Draw food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        );
    }

    startGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.snake.reset();
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        this.food = this.generateFood();
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        document.getElementById('startButton').textContent = 'Restart Game';
        
        // Reset auto-play when starting a new game
        this.isAutoPlaying = false;
        document.getElementById('magicButton').textContent = 'Magic';
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};
