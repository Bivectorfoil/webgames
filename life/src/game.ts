class GameOfLife {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: boolean[][];
    private isRunning: boolean = false;
    private cellSize: number = 10;
    private rows: number;
    private cols: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.rows = Math.floor(canvas.height / this.cellSize);
        this.cols = Math.floor(canvas.width / this.cellSize);
        this.grid = this.createGrid();

        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.setupControls();
    }

    private createGrid(): boolean[][] {
        return Array(this.rows).fill(false).map(() => Array(this.cols).fill(false));
    }

    private setupControls(): void {
        document.getElementById('startBtn')?.addEventListener('click', () => {
            if (!this.isRunning) {
                this.isRunning = true;
                this.run();
            }
        });

        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.isRunning = false;
        });

        document.getElementById('clearBtn')?.addEventListener('click', () => {
            this.isRunning = false;
            this.grid = this.createGrid();
            this.draw();
        });

        document.getElementById('randomBtn')?.addEventListener('click', () => {
            this.grid = Array(this.rows).fill(false).map(() =>
                Array(this.cols).fill(false).map(() => Math.random() > 0.7)
            );
            this.draw();
        });
    }

    private handleClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const row = Math.floor(y / this.cellSize);
        const col = Math.floor(x / this.cellSize);

        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = !this.grid[row][col];
            this.draw();
        }
    }

    private countNeighbors(row: number, col: number): number {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = (row + i + this.rows) % this.rows;
                const newCol = (col + j + this.cols) % this.cols;
                if (this.grid[newRow][newCol]) count++;
            }
        }
        return count;
    }

    private nextGeneration(): void {
        const newGrid = this.createGrid();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                if (this.grid[row][col]) {
                    newGrid[row][col] = neighbors === 2 || neighbors === 3;
                } else {
                    newGrid[row][col] = neighbors === 3;
                }
            }
        }

        this.grid = newGrid;
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(
                        col * this.cellSize,
                        row * this.cellSize,
                        this.cellSize - 1,
                        this.cellSize - 1
                    );
                }
            }
        }
    }

    private run(): void {
        if (!this.isRunning) return;
        
        this.nextGeneration();
        this.draw();
        requestAnimationFrame(() => this.run());
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    new GameOfLife(canvas);
});
