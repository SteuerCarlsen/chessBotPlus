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

const CoordinateMap = calculateCoordinateMap()
const LOSLineMap = calculateLosLines()
const NeighborMap = calculateNeighbors()

class BoardPrototype {
    constructor() {
        this.boardArray = new Array(64);
        this.simpleBoard = new Uint8Array(64);
        this.neighborMap = new Array(64);
        this.coordinateMap = CoordinateMap;
        this.losLineMap = LOSLineMap;
        this.losLineMap = new Array(64).fill(null).map(() => new Array(64).fill(null));
        this.calculatedSquares = new Array(64).fill(0);
        this.rangeMap = new Array(64).fill(false);
        this.playerPieces = [];
        this.enemyPieces = [];
        this.distance = null;
    }

    switchPieces(index1, index2, updateVisual = true) {
        const tempValue1 = this.boardArray[index1];
        const tempValue2 = this.boardArray[index2];
        this.updateSquare(index1, tempValue2, updateVisual);
        this.updateSquare(index2, tempValue1, updateVisual);
        this.hideRange();
    }

    updateSquare(index, value, updateVisual = true) {
        if (value !== undefined && value !== null) {
            this.simpleBoard[index] = true;
            this.boardArray[index] = value;
        } else {
            this.simpleBoard[index] = false;
            this.boardArray[index] = null;
        }
        if (updateVisual) {
            VisualBoard.updateSquare(index, value);
        }
    }

    init(board = [], updateVisual = true) {
        const size = board.length;
        this.boardArray = new Array(size);
        this.simpleBoard = new Uint8Array(size);
        VisualBoard.initiate();
        for (let i = 0; i < size; i++) {
            this.updateSquare(i, board[i], updateVisual);
        }
        this.boardArray.forEach((value, index) => {
            if (value) {
                //console.log(value);
                value.temp.index = index;
                if (value.shortType === 'Player') {
                    this.playerPieces.push(value);
                } else if (value.shortType === 'Enemy') {
                    this.enemyPieces.push(value);
                }
            }
        })
    }

    calculateLos(index, target) {
        //console.log(index + " " + target)
        if(index != target){
            for (const value of LOSLineMap[index][target]) {
                if (this.simpleBoard[value]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    calculateRangeWrapper(index, range, checkLos = false) {
        //console.log(`Calculating ${index} for range ${range}`)
        //console.log(index)
        this.rangeMap = new Array();
        this.calculatedSquares = new Array(64).fill(0);
        this.calculateRange(index, index, ++range, ++range, checkLos);
        //console.log(this.rangeMap)
        return this.rangeMap;
    }

    calculateRange(index, orgIndex, range, orgRange, checkLos = false) {
        //console.log(index)
        if (range < 1) {
            //console.log(`range is less than 1`)
            return;
        }
        this.calculatedSquares[index] = range;
        if (checkLos) {
            NeighborMap[index].forEach((neighbor) => {
                const newRange = range - 1;
                if (!this.simpleBoard[neighbor] && newRange > this.calculatedSquares[neighbor] && this.calculateLos(orgIndex, neighbor)) {
                    //console.log(neighbor)
                    this.rangeMap.push(neighbor)
                    this.calculateRange(neighbor, orgIndex, newRange, orgRange, true);
                }
            });
        } else {
            NeighborMap[index].forEach((neighbor) => {
                const newRange = range - 1;
                if (!this.simpleBoard[neighbor] && newRange > this.calculatedSquares[neighbor]) {
                    //console.log(neighbor + ` is free`)
                    this.rangeMap.push(neighbor)
                    this.calculateRange(neighbor, orgIndex, newRange, orgRange);
                }
            });
        }
    }

    calculateMoveDistanceWrapper(index, targetIndex, maxDistance = 14){
        this.rangeMap = new Array();
        this.calculatedSquares = new Array(64).fill(0);
        this.distance = maxDistance;
        this.calculateMoveDistance(index, targetIndex, maxDistance, maxDistance);
        return this.distance
    }

    calculateMoveDistance(index, targetIndex, countDown, orgCountDown){
        if(countDown == 0){
            return
        }
        this.calculatedSquares[index] = countDown;
        NeighborMap[index].forEach((neighbor) => {
            if(neighbor == targetIndex){
                let distance = orgCountDown - countDown
                if(distance < this.distance){
                    this.distance = distance;
                }
            }
            const newCountDown = countDown - 1;
            if(!this.simpleBoard[neighbor] && newCountDown > this.calculatedSquares[neighbor]){
                this.calculateMoveDistance(neighbor, targetIndex, newCountDown, orgCountDown)
            }
        })
    }

    getRangeMap(index, maxRange = 14, checkLos = false) {
        //console.log(index)
        return this.calculateRangeWrapper(index, maxRange, checkLos)
    }

    showRange(index, range, checkLos = false) {
        this.calculateRangeWrapper(index, range, checkLos).forEach((value) => {
            if (value !== false) {
                this.updateSquare(value, 'RG');
            }
        });
    }

    hideRange() {
        this.boardArray.forEach((value, index) => {
            //console.log(value)
            if (value === 'RG') {
                this.updateSquare(index, undefined);
            }
        });
        this.calculatedSquares = new Array(64).fill(0);
    }

    selectSquare(index) {
        const entity = this.boardArray[index];
        //console.log(`Selecting square at index ${index}`);
        //console.log(entity);
        if(entity === "RG"){
            CurrentCombat.selectedPiece.move(index);
            CurrentCombat.endTurn();
            //console.log(`Selected square at index ${index} is within range`);
        } else if(entity){
            CurrentCombat.selectPiece(entity);
        } else {
            //console.log('No entity here');
            return false
        }
    }

    exportBoard() {
        let exportResult = new Array(64)
        this.boardArray.forEach((value, key) =>{
            if(value != null && value != undefined){
                if(value instanceof Terrain){
                    exportResult[key] = new Terrain()
                } else if (value instanceof Piece){
                    exportResult[key] = new Piece(value.name, value.shortType)
                }
            }
        })
        return exportResult
    }
}

const Board = new BoardPrototype()
const TestBoard = [,,,,,,,new Piece("Player Character", "Player"),,new Terrain(),,,,,new Terrain(),,,,,,,new Terrain(),,,,,new Terrain(),new Terrain(),new Terrain(),,,new Terrain(),,,,,new Terrain(),,,,,,new Terrain(),new Terrain(),,new Terrain(),,new Piece("Enemy Character 2", "Enemy"),,,new Terrain(),,new Terrain(),,,,,,new Piece("Enemy Character", "Enemy"),,,,new Terrain(),new Terrain()];
Board.init(TestBoard);

class TurnHandler {
    constructor(turnTimeLimit, totalTimeLimit) {
        if (turnTimeLimit !== undefined) {
            this.turnTimeLimit = turnTimeLimit;
        }
        if (totalTimeLimit !== undefined) {
            this.totalTimeLimit = totalTimeLimit;
            this.playerTimeLeft = totalTimeLimit;
            this.enemyTimeLeft = totalTimeLimit;
        }
        this.currentTurn = this.randomizeTurn();
        this.turnTimer = null;
        this.totalTimer = null;
        this.selectedPiece = null;
        this.targetedPiece = null;
    }

    randomizeTurn() {
        if (Math.random() >= 0.5) {
            //console.log('Player goes first');
            return 'Player';
        } else {
            //console.log('Enemy goes first');
            return 'Enemy';
        }
    }

    start() {
        this.startTurn();
        if (this.totalTimeLimit !== undefined) {
            this.startTotalTimer();
        }
    }

    startTurn() {
        //console.log(`${this.currentTurn}'s turn`);
        if (this.currentTurn === 'Enemy') {
            EnemyAI.startTurn('monteCarlo');
        }
        if (this.turnTimeLimit !== undefined) {
            this.turnTimer = setTimeout(() => {
                this.endTurn();
            }, this.turnTimeLimit * 1000);
        }
    }

    startTotalTimer() {
        this.totalTimer = setInterval(() => {
            if (this.currentTurn === 'Player') {
                this.playerTimeLeft--;
                if (this.playerTimeLeft <= 0) {
                    this.loseCondition('Player');
                }
            } else {
                this.enemyTimeLeft--;
                if (this.enemyTimeLeft <= 0) {
                    this.loseCondition('Enemy');
                }
            }
        }, 1000);
    }

    endTurn() {
        clearTimeout(this.turnTimer);
        this.currentTurn = this.currentTurn === 'Player' ? 'Enemy' : 'Player';
        this.selectedPiece = null;
        this.targetedPiece = null;
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.startTurn();
            }, 5);
        });
    }

    loseCondition(loser) {
        clearTimeout(this.turnTimer);
        clearInterval(this.totalTimer);
        //console.log(`${loser} loses!`);
        // Handle lose condition (e.g., end game, show message, etc.)
    }

    endGame() {
        clearTimeout(this.turnTimer);
        clearInterval(this.totalTimer);
        //console.log('Game over');
        // Handle end game (e.g., show final score, reset game, etc.)
    }

    selectPiece(entity) {
        if(entity.shortType === this.currentTurn){
            this.selectedPiece = entity;
            entity.select();
        } else {
            this.targetedPiece = entity;
        }
    }
}

const CurrentCombat = new TurnHandler();
CurrentCombat.start()