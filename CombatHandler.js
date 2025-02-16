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
            this.updateSquare(i, this.initSquare(board[i]), updateVisual);
        }
        this.boardArray.forEach((value, index) => {
            if (value) {
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
            CurrentCombat.advanceTurn();
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
                    exportResult[key] = ['terrain'];
                } else if (value instanceof PlayerPiece){
                    const pieceData = value.exportPiece();
                    exportResult[key] = ['playerPiece', pieceData[0], pieceData[1], pieceData[2]];
                } else if (value instanceof EnemyPiece){
                    const pieceData = value.exportPiece();
                    exportResult[key] = ['enemyPiece', pieceData[0], pieceData[1], pieceData[2]];
                }
            }
        })
        return exportResult
    }

    initSquare(value) {
        if (value === undefined || value === null) {
            return null;
        }
        if(value[0] == "terrain"){
            return new Terrain()
        }
        if (value[0] == "playerPiece"){
            return new PlayerPiece(value[1], value[2], value[3])
        }
        if (value[0] == "enemyPiece"){
            return new EnemyPiece(value[1], value[2], value[3])
        }
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
        //Beware that this is manually set for now
        this.ressourceStats = {
            health: new HealthStat(100)
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
        board.switchPieces(this.temp.index, newIndex, updateVisual);
        this.temp.index = newIndex;
        if(updateVisual) {combatLog.addEntry('move', {piece: this.name, index: newIndex})}
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

//GameState Prototype holds info and methods for the game states. Mainly used in Monte Carlo Tree Search.
class GameState {
    constructor() {
        this.actionOrder = ['start', 'action', 'end'];
        this.currentAction = 0;
        this.playerOrder = [];
    }

    advanceTurn() {
        this.sharedTurnAdvance();
    }

    sharedTurnAdvance() {
        if (++this.currentAction == 1) {
            this.turnStart();
        } else if (this.currentAction == 2) {
            this.turnAction();
        } else if (this.currentAction == 3) {
            this.currentAction = 0;
            const Terminal = this.isTerminal();
            if(Terminal[0] || Terminal[1]){
                this.currentAction = 0;
                this.gameEnd();
                return Terminal
            }
            this.turnEnd();
        }
    }

    turnStart() {
        this.advanceTurn();
    }

    turnAction() {
        return
    }

    turnEnd() {
        this.sharedTurnEnd();
    }

    sharedTurnEnd() {
        this.currentPlayer = this.currentPlayer === 'player' ? 'enemy' : 'player';
        this.advanceTurn();
    }

    gameEnd() {
        clearInterval(this.totalTimer);
    }

    //Method to check if the game state is terminal (win or loss)
    isTerminal() {
        return [this.checkWinCondition('enemy'), this.checkWinCondition('player')];
    }

    //Method to clone the current game state for use in new nodes to simulate without affecting other nodes
    clone() {
        return new SimulationState(
            this.board.exportBoard(),
            this.currentPlayer,
        )
    }

    //Checks the Win Condition (all player pieces are dead)
    checkWinCondition(actor) {
        let totalHealth = 0;
        if(actor == 'enemy'){
            for(const piece of this.board.playerPieces){
                totalHealth += Math.max(0, piece.ressourceStats.health.getCurrentValue());
                if(totalHealth > 0){
                    return false;
                }
            }
            return true;
        } else {
            for(const piece of this.board.enemyPieces){
                totalHealth += Math.max(0, piece.ressourceStats.health.getCurrentValue());
                if(totalHealth > 0){
                    return false;
                }
            }
            return true;
        }
    }
}

class SimulationState extends GameState {
    constructor(board, player) {
        super();
        this.lastAction = null;
        this.currentPlayer = player;
        this.board = new BoardPrototype();
        this.board.init(board, false);
    }

    //Get array of possible actions for the current player
    getPossibleActions() {
        let possibleActions = [];
        let pieces = this.currentPlayer === 'player' ? this.board.playerPieces : this.board.enemyPieces;
        pieces.forEach(piece => {
            let moves = piece.getMovementRange(this.board);
            moves.forEach(move => {
                possibleActions.push(['movement', piece.temp.index, move]);
            })
            if(piece.abilities != undefined && piece.abilities.length > 0){
                piece.abilities.forEach((ability, abilityKey) => {
                    let range = ability.getRange(piece.temp.index, this.board);
                    range.forEach(targetIndex => {
                        if (this.currentPlayer === 'player' && this.board.boardArray[targetIndex] instanceof EnemyPiece) {
                            possibleActions.push(['ability', piece.temp.index, targetIndex, abilityKey]);
                        } else if (this.currentPlayer === 'enemy' && this.board.boardArray[targetIndex] instanceof PlayerPiece) {
                            possibleActions.push(['ability', piece.temp.index, targetIndex, abilityKey]);
                        } 
                    })
                })
            }
        })
        return possibleActions;
    }

    //Method to play the given action in the simulation
    play(action) {
        const actingPiece = this.board.boardArray[action[1]];
        if (action[0] === 'movement') {
            actingPiece.move(action[2], this.board, false);
        } else if (action[0] === 'ability') {
            actingPiece.abilities[action[3]].use(actingPiece, this.board.boardArray[action[2]]);
        }
        this.lastAction = action;
    }

    //Method to get the last action played
    getLastAction() {
        return this.lastAction;
    }
}

class RealGameState extends GameState {
    constructor(board) {
        super();
        if(board instanceof BoardPrototype) {
            this.board = board;
        } else {
            this.board = new BoardPrototype();
            this.board.init(board, false);
        }
        this.selectedPiece = null;
        this.targetedPiece = null;
        this.started = false;
        this.currentPlayer = this.randomizeTurn();
        this.init();
    }

    init(enemyEncounter) {
        /*this.playerTimeLeft = enemyEncounter.playerTotalTimeLimit;
        this.enemyTimeLeft = enemyEncounter.enemyTotalTimeLimit;
        this.enemyAI = new AIPrototype(enemyEncounter.AI);*/
        this.enemyAI = new AIPrototype('monteCarlo');
    }

    //Randomized who's turn it is at the start of the game
    randomizeTurn() {
        console.log('Randomizing turn');
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
        this.totalTimer = setInterval(() => {
            if (this.currentTurn === 'player') {
                this.playerTimeLeft--;
                if (this.playerTimeLeft <= 0) {
                    this.gameEnd();
                }
            } else {
                this.enemyTimeLeft--;
                if (this.enemyTimeLeft <= 0) {
                    this.gameEnd();
                }
            }
        }, 1000);
        this.advanceTurn();
    }

    advanceTurn() {
        const Terminal = this.isTerminal();
        if(Terminal[0] || Terminal[1]){
            this.gameEnd();
            return Terminal
        }
        this.sharedTurnAdvance();
    }

    turnAction() {
        if(this.currentPlayer === 'enemy'){
            this.enemyAI.startTurn();
            this.advanceTurn();
        }
    }

    turnEnd() {
        this.selectedPiece = null;
        this.targetedPiece = null;
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.sharedTurnEnd();
            }, 5);
        });

    }

    selectPiece(entity) {
        if (this.currentPlayer === 'player') {
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