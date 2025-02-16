//Get a random integer between two values
function getRandomIntRange(max, min){
    return Math.floor(Math.random() * (max - min) + min)
}

function trimArray(arr) {
    return arr.reduce((acc, item) => {
        if (Array.isArray(item)) {
            acc.push(...trimArray(item)); // Recursively flatten nested arrays
        } else if (item !== undefined && item !== null) {
            acc.push(item); // Include non-empty values
        }
        return acc;
    }, []);
}

const combatLog = {
    log: [],
    shownLog: [],
    maxEntries: 100,

    addEntry(type, payLoad = {}) {
        this.log.unshift({
            type,
            payLoad,
            timeStamp: Date.now(),
        })

        if(type == "move"){
            this.moveEntry(payLoad);
        }
        
        if (this.log.length > this.maxEntries) {
            this.removeOldestEntry();
        }
    },

    moveEntry(payLoad) {
        this.shownLog.unshift(`${payLoad.piece} moved to ${payLoad.index}`);
    },

    removeOldestEntry() {
        this.log.pop();
        this.shownLog.pop();
    },

    clearLog() {
        this.log = [];
    },

}

function calculateLosLines(boardSize = 64) {
    const losLines = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (i !== j) {
                losLines[i][j] = calculateLosLine(i, j, boardSize);
            }
        }
    }
    return losLines;
}

function calculateLosLine(index, target, boardSize = 64) {
    const startX = CoordinateMap[index].x;
    const startY = CoordinateMap[index].y;
    const endX = CoordinateMap[target].x;
    const endY = CoordinateMap[target].y;

    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = (startX < endX) ? 1 : -1;
    const sy = (startY < endY) ? 1 : -1;
    let err = dx - dy;

    let x = startX;
    let y = startY;
    const losPath = [];
    while (x !== endX || y !== endY) {
        if (x !== startX || y !== startY) {
            const square = x + (y * Math.sqrt(boardSize));
            losPath.push(square);
        }
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
    // Include the target square
    const targetSquare = endX + (endY * Math.sqrt(boardSize));
    losPath.push(targetSquare);
    return losPath;
}

function calculateCoordinateMap(boardSize = 64) {
    const dimensions = Math.sqrt(boardSize);
    const coordinateMap = new Array(boardSize);
    for (let i = 0; i < boardSize; i++) {
        const x = i % dimensions;
        const y = Math.floor(i / dimensions);
        coordinateMap[i] = { x, y };
    }
    return coordinateMap;
}

function calculateNeighbors(size = 64, directions = [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
    const neighborMap = new Array(size);
    for (let i = 0; i < size; i++) {
        const neighbors = [];
        const x = CoordinateMap[i].x;
        const y = CoordinateMap[i].y;
        directions.forEach(([dx, dy]) => {
            const newRow = y + dy;
            const newCol = x + dx;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                neighbors.push(newRow * 8 + newCol);
            }
        });
        neighborMap[i] = neighbors;
    }
    return neighborMap;
}