// 空間網格系統 - 優化碰撞檢測
// 使用網格分區來減少碰撞檢測的計算量

class SpatialGrid {
    constructor(width, height, cellSize = GameConstants ? GameConstants.SPATIAL_GRID.CELL_SIZE : 50) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        
        // 計算網格尺寸
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        
        // 初始化網格
        this.clear();
    }
    
    // 清空網格
    clear() {
        this.grid = new Array(this.rows);
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = new Array(this.cols);
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = [];
            }
        }
    }
    
    // 獲取物體所在的網格位置
    getGridPosition(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // 確保在邊界內
        return {
            col: Math.max(0, Math.min(this.cols - 1, col)),
            row: Math.max(0, Math.min(this.rows - 1, row))
        };
    }
    
    // 插入物體到網格
    insert(object, x, y) {
        const { col, row } = this.getGridPosition(x, y);
        this.grid[row][col].push(object);
    }
    
    // 獲取範圍內的潛在碰撞對象
    getNearby(x, y, radius) {
        const nearby = [];
        
        // 計算需要檢查的網格範圍
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
        
        // 收集範圍內的所有對象
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                nearby.push(...this.grid[row][col]);
            }
        }
        
        return nearby;
    }
    
    // 獲取線段穿過的所有網格（用於射線檢測）
    getGridsAlongLine(x1, y1, x2, y2) {
        const grids = [];
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        
        let x = x1;
        let y = y1;
        let err = dx - dy;
        
        while (true) {
            const { col, row } = this.getGridPosition(x, y);
            const key = `${row},${col}`;
            
            // 避免重複添加相同的網格
            if (!grids.some(g => g.key === key)) {
                grids.push({
                    row,
                    col,
                    key,
                    objects: this.grid[row][col]
                });
            }
            
            if (Math.abs(x - x2) < this.cellSize && Math.abs(y - y2) < this.cellSize) {
                break;
            }
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx * this.cellSize;
            }
            if (e2 < dx) {
                err += dx;
                y += sy * this.cellSize;
            }
        }
        
        return grids;
    }
    
    // 調試渲染（可選）
    debugRender(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        
        // 繪製網格線
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        // 顯示每個網格中的對象數量
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const count = this.grid[row][col].length;
                if (count > 0) {
                    const x = col * this.cellSize + 5;
                    const y = row * this.cellSize + 15;
                    ctx.fillText(count, x, y);
                }
            }
        }
        
        ctx.restore();
    }
}

// 導出類
window.SpatialGrid = SpatialGrid;