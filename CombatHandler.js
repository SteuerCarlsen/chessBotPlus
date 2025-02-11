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
    constructor(editorMode = false) {
        this.boardArray = null;
        this.simpleMoveBoard = null;
        this.simpleLOSBoard = null;
        this.neighborMap = new Array(64);
        this.coordinateMap = CoordinateMap;
        this.losLineMap = LOSLineMap;
        this.calculatedSquares = null;
        this.rangeMap = null;
        this.playerPieces = [];
        this.enemyPieces = [];
        this.distance = null;
        this.editorMode = editorMode;
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
            this.boardArray[index] = value;
            this.simpleLOSBoard[index] = value.blocksLOS;
            this.simpleMoveBoard[index] = value.blocksMovement;
        } else {
            this.boardArray[index] = null;
            this.simpleLOSBoard[index] = false;
            this.simpleMoveBoard[index] = false;
        }
        if (updateVisual) {
            VisualBoard.updateSquare(index, value);
        }
    }

    init(board = [], updateVisual = true) {
        const size = board.length;
        this.boardArray = new Array(size);
        this.simpleMoveBoard = new Uint8Array(size);
        this.simpleLOSBoard = new Uint8Array(size);
        if(updateVisual){
            VisualBoard.init(size);
        }
        for (let i = 0; i < size; i++) {
            this.updateSquare(i, board[i], updateVisual);
        }
        this.boardArray.forEach((value, index) => {
            if (value) {
                //console.log(value);
                value.temp.index = index;
                if (value.playerControlled) {
                    this.playerPieces.push(value);
                } else if (value.enemyControlled) {
                    this.enemyPieces.push(value);
                }
            }
        })
    }

    calculateLos(index, target) {
        //console.log(index + " " + target)
        if(index != target){
            for (const value of LOSLineMap[index][target]) {
                if (this.simpleLOSBoard[value]) {
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
                if (!this.simpleLOSBoard[neighbor] && newRange > this.calculatedSquares[neighbor] && this.calculateLos(orgIndex, neighbor)) {
                    //console.log(neighbor)
                    this.rangeMap.push(neighbor)
                    this.calculateRange(neighbor, orgIndex, newRange, orgRange, true);
                }
            });
        } else {
            NeighborMap[index].forEach((neighbor) => {
                const newRange = range - 1;
                if (!this.simpleMoveBoard[neighbor] && newRange > this.calculatedSquares[neighbor]) {
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
            if(!this.simpleMoveBoard[neighbor] && newCountDown > this.calculatedSquares[neighbor]){
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
        if (this.editorMode) {
            editSquare(index);
        }
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
                } else if (value instanceof PlayerPiece){
                    const pieceData = value.exportPiece()
                    exportResult[key] = new PlayerPiece(pieceData[0], pieceData[1], pieceData[2])
                } else if (value instanceof EnemyPiece){
                    const pieceData = value.exportPiece()
                    exportResult[key] = new EnemyPiece(pieceData[0], pieceData[1], pieceData[2])
                }
            }
        })
        return exportResult
    }
}

// Overall Entity Class - Entities are any object/character/piece/etc. that can take a spot on the gameboard
class Entity {
    constructor(name, blocksLOS, blocksMovement) {   
        this.name = name;
        this.objType = 'Entity';
        this.blocksLOS = blocksLOS;
        this.blocksMovement = blocksMovement;
        this.playerControlled = false;
        this.enemyControlled = false;
        this.temp = {
            index: null,
        }
    }
}

class Terrain extends Entity {
    constructor() {
        super("Terrain", true, true);
        this.objType = 'Terrain';
    }
    select () {
        //console.log('Terrain selected');
    }
    init() {}
}

// Pieces are any player/enemy character that has stats
class Piece extends Entity {
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, true, true);
        this.title = title;
        this.abilities = abilities;
        this.passives = passives;
        this.status = {
            isWeaponEquipped: false,
            isShieldEquipped: false,
        };
        this.movementPoints = 3;
        this.secondaryStats = {
            dodgeChance: new ChanceStat('DodgeChance'),
            parryChance: new ChanceStat('ParryChance'),
            blockChance: new ChanceStat('BlockChance'),
            blockValue: new RangeStat('BlockChance'),
            meleeCriticalChance: new ChanceStat('MeleeCriticalChance'),
            meleeCriticalFactor: new FactorStat('MeleeCriticalFactor', Factor.MeleeCriticalFactor),
            meleeDamage: new RangeStat('MeleeDamage'),
            armor: new FlatStat('Armor'),
        };
        this.ressourceStats = {
            health: new HealthStat(),
        };
        this.primaryStats = {
            strength: new Strength(primaryStats.strength, this),
            agility: new Agility(primaryStats.agility, this),
            stamina: new Stamina(primaryStats.stamina, this),
            intelligence: new Intelligence(primaryStats.intelligence, this),
            wisdom: new Wisdom(primaryStats.wisdom, this),
            dexterity: new Dexterity(primaryStats.dexterity, this),
            initiative: new Initiative(primaryStats.initiative, this),
        };
    }

    exportPiece() {
        return [this.name, this.title, 
                {
                strength: this.primaryStats.strength.permanent,
                agility: this.primaryStats.agility.permanent,
                stamina: this.primaryStats.stamina.permanent,
                intelligence: this.primaryStats.intelligence.permanent,
                wisdom: this.primaryStats.wisdom.permanent,
                dexterity: this.primaryStats.dexterity.permanent,
                initiative: this.primaryStats.initiative.permanent,
                },
                this.abilities,
            ]
    }

    select() {
        //console.log(this.name + ' selected');
        this.showMovementRange();
    }

    showMovementRange() {
        //console.log(this.temp.index + " " + this.movementPoints)
        Board.showRange(this.temp.index, this.movementPoints);
    }

    showRange(range) {
        Board.showRange(this.temp.index, range, true);
    }

    move(newIndex, board = Board, updateVisual = true){
        //console.log(`Moving ${this.name} to index ${newIndex}`);
        //console.log(board)
        board.switchPieces(this.temp.index, newIndex, updateVisual);
        this.temp.index = newIndex;
    }

    getMovementRange(board = Board) {
        //console.log(this.name + ": " + this.temp.index)
        //console.log(Board.getRangeMap(this.temp.index, this.movementPoints))
        return board.getRangeMap(this.temp.index, this.movementPoints)
    }
}

class PlayerPiece extends Piece {
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, title, primaryStats, abilities, passives);
        this.objType = 'PlayerPiece';
        this.playerControlled = true;
        this.temp.threat = 0;
    }
}

class EnemyPiece extends Piece {    
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, title, primaryStats, abilities, passives);
        this.objType = 'EnemyPiece';
        this.enemyControlled = true;
    }
}

const Board = new BoardPrototype()
const TestBoard = [,,,,,,,
    new PlayerPiece("Player Character","None",{ 
    strength: 10,
    agility: 10,
    stamina: 10,
    intelligence: 10,
    wisdom: 10,
    dexterity: 10,
    initiative: 10,
    }),,new Terrain(),,,,,new Terrain(),,,,,,,new Terrain(),,,,,new Terrain(),new Terrain(),new Terrain(),,,new Terrain(),,,,,new Terrain(),,,,,,new Terrain(),new Terrain(),,new Terrain(),,
    new EnemyPiece("Enemy Character 2","None",{
        strength: 10,
        agility: 10,
        stamina: 10,
        intelligence: 10,
        wisdom: 10,
        dexterity: 10,
        initiative: 10,
    }),,,new Terrain(),,new Terrain(),,,,,,
    new EnemyPiece("Enemy Character","None",{
        strength: 10,
        agility: 10,
        stamina: 10,
        intelligence: 10,
        wisdom: 10,
        dexterity: 10,
        initiative: 10,
    }),,,,new Terrain(),new Terrain()];
Board.init(TestBoard);

class TurnHandler {
    constructor(enemyEncounter, turnTimeLimit, totalTimeLimit) {
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
        this.enemyAI = new AIPrototype(enemyEncounter.AI);
        this.started = false;
    }

    randomizeTurn() {
        if (Math.random() >= 0.5) {
            console.log('Player goes first');
            return 'player';
        } else {
            console.log('Enemy goes first');
            return 'enemy';
        }
    }

    start() {
        if (this.started) {
            console.log('Game already started');
            return;
        }
        console.log("Game starting");
        this.started = true;
        this.startTurn();
        if (this.totalTimeLimit !== undefined) {
            this.startTotalTimer();
        }
    }

    startTurn() {
        //console.log(`${this.currentTurn}'s turn`);
        if (this.currentTurn === 'enemy') {
            this.enemyAI.startTurn();
        }
        if (this.turnTimeLimit !== undefined) {
            this.turnTimer = setTimeout(() => {
                this.endTurn();
            }, this.turnTimeLimit * 1000);
        }
    }

    startTotalTimer() {
        this.totalTimer = setInterval(() => {
            if (this.currentTurn === 'player') {
                this.playerTimeLeft--;
                if (this.playerTimeLeft <= 0) {
                    this.loseCondition('player');
                }
            } else {
                this.enemyTimeLeft--;
                if (this.enemyTimeLeft <= 0) {
                    this.loseCondition('enemy');
                }
            }
        }, 1000);
    }

    endTurn() {
        clearTimeout(this.turnTimer);
        this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
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
        if (this.currentTurn === 'player') {
            if (entity.playerControlled) {
                this.selectedPiece = entity;
                entity.select();
            } else {
                this.targetedPiece = entity;
            }
        } else {
            console.log('Not your turn');
        }
    }
}

const CurrentCombat = new TurnHandler();