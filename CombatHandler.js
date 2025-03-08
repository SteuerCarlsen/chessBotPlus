const debugLog = (typeof self !== 'undefined' && self.debugLog) 
    ? self.debugLog 
    : (typeof console !== 'undefined' && console.log) 
    ? console.log.bind(console) 
    : () => {};

let wasmCalculateLos = null;

async function initWasmForWorker() {
    if (typeof self !== 'undefined' && !self.document) { // Check if we're in a worker
        const { default: init, calculate_los } = await import('./mcts_rust/pkg/mcts_rust.js');
        await init();
        wasmCalculateLos = calculate_los;
        debugLog('WASM initialized in worker');
    }
}

function calculateLos(from, to, board) {
    if (typeof window !== 'undefined' && window.calculate_los) {
        return window.calculate_los(from, to, board);
    }
    if (wasmCalculateLos) {
        return wasmCalculateLos(from, to, board);
    }
    console.error('WASM not initialized');
    return false;
}

// Initialize WASM if we're in a worker
if (typeof self !== 'undefined' && !self.document) {
    initWasmForWorker().catch(console.error);
}

class BoardPrototype {
    constructor(editorMode = false) {
        this.boardArray = null;
        this.simpleMoveBoard = null;
        this.simpleLOSBoard = null;
        this.neighborMap = new Array(64);
        this.coordinateMap = CoordinateMap;
        this.losLineMap = LOSLineMap;
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

    /*calculateLos(index, target) {
        if(index == target) return false;

        const losLine = LOSLineMap[index][target];
        const losBoard = this.simpleLOSBoard;

        for(let i = 0; i < losLine.length; i++) {
            if(losBoard[losLine[i]]) return false;
        }
        return true;
    }

    calculateRange(index, range, checkLos = false, acceptTargets = false) {
        let rangeMap = new Uint8Array(64);
        let rangeMapIndex = 0;
        let calculatedSquares = new Uint8Array(64);
        const queueIndices = new Uint8Array(64);
        const queueRanges = new Uint8Array(64);

        
        let queueStart = 0;
        let queueEnd = 1;

        queueIndices[0] = index;
        queueRanges[0] = range + 1;
        calculatedSquares[index] = range + 1;

        if(acceptTargets) {
            rangeMap[rangeMapIndex++] = index;
        }

        const {simpleLOSBoard, simpleMoveBoard, boardArray} = this;
        const isPiece = acceptTargets ? 
        (idx) => boardArray[idx] instanceof PlayerPiece || boardArray[idx] instanceof EnemyPiece 
        : () => false;

        while(queueStart < queueEnd) {
            const currentIndex = queueIndices[queueStart];
            const currentRange = queueRanges[queueStart++];
            
            if(currentRange < 1) continue;

            const neighbors = NeighborMap[currentIndex];
            const neighborCount = neighbors.length;

            for(let i = 0; i < neighborCount; i++) {
                const neighbor = neighbors[i];
                const newRange = currentRange - 1;
    
                if(newRange > calculatedSquares[neighbor]) {
                    if(checkLos) {
                        if(calculateLos(index, neighbor, this.simpleLOSBoard)) {
                            if(!simpleLOSBoard[neighbor]) {
                                rangeMap[rangeMapIndex++] = neighbor;
                                calculatedSquares[neighbor] = newRange;
                                queueIndices[queueEnd] = neighbor;
                                queueRanges[queueEnd++] = newRange;
                            } else if(acceptTargets && isPiece(neighbor)) {
                                rangeMap[rangeMapIndex++] = neighbor;
                            }
                        }
                    } else if(!simpleMoveBoard[neighbor]) {
                        rangeMap[rangeMapIndex++] = neighbor;
                        calculatedSquares[neighbor] = newRange;
                        queueIndices[queueEnd] = neighbor;
                        queueRanges[queueEnd++] = newRange;
                    }
                }
            }
        }
    
        return rangeMap.slice(0, rangeMapIndex);
    }*/

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

    showRange(index, range, checkLos = false) {
        this.calculateRange(index, range, checkLos).forEach((value) => {
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
        if (CurrentCombat.currentPlayer === 'player') {
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
        } else {return console.log("Not your turn")}
    }

    exportBoard() {
        let exportResult = new Array(64)
        this.boardArray.forEach((value, key) =>{
            if(value != null && value != undefined){
                if(value instanceof Terrain){
                    exportResult[key] = ['terrain'];
                } else if (value instanceof PlayerPiece){
                    const pieceData = value.exportPiece();
                    exportResult[key] = ['playerPiece', pieceData[0], pieceData[1], pieceData[2], pieceData[3]];
                } else if (value instanceof EnemyPiece){
                    const pieceData = value.exportPiece();
                    exportResult[key] = ['enemyPiece', pieceData[0], pieceData[1], pieceData[2], pieceData[3]];
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
            return new PlayerPiece(value[1], value[2], value[3], value[4])
        }
        if (value[0] == "enemyPiece"){
            return new EnemyPiece(value[1], value[2], value[3], value[4])
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
    constructor(name, title, primaryStats, abilityKeys, passives) {
        super(name, true, true);
        this.title = title;
        this.abilityKeys = abilityKeys;
        this.abilities = [];
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
        this.resourceStats = {
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
        this.getAbilities(abilityKeys);
    }

    getAbilities(keys) {
        keys.forEach((key) => {
            this.abilities.push(AbilityMap.get(key));
        })
    };

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
                this.abilityKeys,
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
        return board.calculateRange(this.temp.index, this.movementPoints)
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
        return this.sharedTurnAdvance();
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
        return [this.checkWinCondition('enemy'), this.checkWinCondition('player'), this.turn];
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
                totalHealth += piece.resourceStats.health.getCurrentValue();
                if(totalHealth > 0){
                    return false;
                }
            }
            return true;
        } else {
            for(const piece of this.board.enemyPieces){
                totalHealth +=piece.resourceStats.health.getCurrentValue();
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
        this.boardArray = this.board.boardArray;
    }

    //Get array of possible actions for the current player
    /*getPossibleActions() {
        const allActions = new Array(100);
        const allMoves = new Array(64);
        const allAbilities = new Array(64);
        let actionCount = 0;
        
        const pieces = this.board[this.currentPlayer === 'player' ? 'playerPieces' : 'enemyPieces'];
        const piecesLength = pieces.length;

        for (let i = 0; i < piecesLength; i++) {
            const piece = pieces[i];
            const pieceIndex = piece.temp.index;

            const moves = piece.getMovementRange(this.board);
            const movesLength = moves.length;

            for (let j = 0; j < movesLength; j++) {
                allMoves[actionCount] = ['movement', pieceIndex, moves[j]];
                allActions[actionCount++] = ['movement', pieceIndex, moves[j]];
            }

            const abilities = piece.abilities;

            if (abilities?.length) {
                const abilitiesLength = abilities.length;
                for (let k = 0; k < abilitiesLength; k++) {
                    const ability = abilities[k];
                    const range = ability.getRange(pieceIndex, this.board);
                    const rangeLength = range.length;
                    for (let l = 0; l < rangeLength; l++) {
                        const targetIndex = range[l];
                        const target = this.boardArray[targetIndex];

                        /*debugLog('Checking ability target', {
                            piece: piece.constructor.name,
                            pieceIndex,
                            targetIndex,
                            hasTarget: !!target,
                            canTarget: target ? ability.canTarget(piece, target) : false
                        });

                        if (target != null && ability.canTarget(piece, target)) {
                            allAbilities[actionCount] = ['ability', pieceIndex, targetIndex, k];
                            allActions[actionCount++] = ['ability', pieceIndex, targetIndex, k];
                        }
                    }
                }
            }
        }

        debugLog('Action counts:', {
            total: actionCount,
            playerTargets: foundTargets.player,
            enemyTargets: foundTargets.enemy,
            currentPlayer: this.currentPlayer
        });

        return actionCount === allActions.length ? allActions : allActions.slice(0, actionCount);         
    }

    //Method to play the given action in the simulation
    play(action) {
        //debugLog("Playing action", action );
        const actingPiece = this.boardArray[action[1]];
        //debugLog("Acting piece", actingPiece);
        if (action[0] === 'movement') {
            actingPiece.move(action[2], this.board, false);
        } else if (action[0] === 'ability') {
            //debugLog(`Applying ability with ${actingPiece.name}`);
            const targetPiece = this.boardArray[action[2]];
            //debugLog(`Target piece is ${targetPiece.name}`);
            //debugLog(`Applying ability with ${actingPiece.name} on ${targetPiece.name}`);
            actingPiece.abilities[action[3]].use(actingPiece, targetPiece, false);
            //debugLog(`Ability applied`);
        }
        this.lastAction = action;
        return this.advanceTurn()
    }

    //Method to get the last action played
    getLastAction() {
        return this.lastAction;
    }*/
    
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
        this.turn = 1;
        this.currentPlayer = this.randomizeTurn();
    }

    //Currently hardcoded
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

    async turnAction() {
        if(this.currentPlayer === 'enemy'){
            console.log('Enemy turn');
            await this.enemyAI.startTurn();
            this.advanceTurn();
        }
    }

    turnEnd() {
        this.turn++;
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

const CoordinateMap = [
    {
        "x": 0,
        "y": 0
    },
    {
        "x": 1,
        "y": 0
    },
    {
        "x": 2,
        "y": 0
    },
    {
        "x": 3,
        "y": 0
    },
    {
        "x": 4,
        "y": 0
    },
    {
        "x": 5,
        "y": 0
    },
    {
        "x": 6,
        "y": 0
    },
    {
        "x": 7,
        "y": 0
    },
    {
        "x": 0,
        "y": 1
    },
    {
        "x": 1,
        "y": 1
    },
    {
        "x": 2,
        "y": 1
    },
    {
        "x": 3,
        "y": 1
    },
    {
        "x": 4,
        "y": 1
    },
    {
        "x": 5,
        "y": 1
    },
    {
        "x": 6,
        "y": 1
    },
    {
        "x": 7,
        "y": 1
    },
    {
        "x": 0,
        "y": 2
    },
    {
        "x": 1,
        "y": 2
    },
    {
        "x": 2,
        "y": 2
    },
    {
        "x": 3,
        "y": 2
    },
    {
        "x": 4,
        "y": 2
    },
    {
        "x": 5,
        "y": 2
    },
    {
        "x": 6,
        "y": 2
    },
    {
        "x": 7,
        "y": 2
    },
    {
        "x": 0,
        "y": 3
    },
    {
        "x": 1,
        "y": 3
    },
    {
        "x": 2,
        "y": 3
    },
    {
        "x": 3,
        "y": 3
    },
    {
        "x": 4,
        "y": 3
    },
    {
        "x": 5,
        "y": 3
    },
    {
        "x": 6,
        "y": 3
    },
    {
        "x": 7,
        "y": 3
    },
    {
        "x": 0,
        "y": 4
    },
    {
        "x": 1,
        "y": 4
    },
    {
        "x": 2,
        "y": 4
    },
    {
        "x": 3,
        "y": 4
    },
    {
        "x": 4,
        "y": 4
    },
    {
        "x": 5,
        "y": 4
    },
    {
        "x": 6,
        "y": 4
    },
    {
        "x": 7,
        "y": 4
    },
    {
        "x": 0,
        "y": 5
    },
    {
        "x": 1,
        "y": 5
    },
    {
        "x": 2,
        "y": 5
    },
    {
        "x": 3,
        "y": 5
    },
    {
        "x": 4,
        "y": 5
    },
    {
        "x": 5,
        "y": 5
    },
    {
        "x": 6,
        "y": 5
    },
    {
        "x": 7,
        "y": 5
    },
    {
        "x": 0,
        "y": 6
    },
    {
        "x": 1,
        "y": 6
    },
    {
        "x": 2,
        "y": 6
    },
    {
        "x": 3,
        "y": 6
    },
    {
        "x": 4,
        "y": 6
    },
    {
        "x": 5,
        "y": 6
    },
    {
        "x": 6,
        "y": 6
    },
    {
        "x": 7,
        "y": 6
    },
    {
        "x": 0,
        "y": 7
    },
    {
        "x": 1,
        "y": 7
    },
    {
        "x": 2,
        "y": 7
    },
    {
        "x": 3,
        "y": 7
    },
    {
        "x": 4,
        "y": 7
    },
    {
        "x": 5,
        "y": 7
    },
    {
        "x": 6,
        "y": 7
    },
    {
        "x": 7,
        "y": 7
    }
]

const NeighborMap = [
    [
        8,
        1
    ],
    [
        0,
        9,
        2
    ],
    [
        1,
        10,
        3
    ],
    [
        2,
        11,
        4
    ],
    [
        3,
        12,
        5
    ],
    [
        4,
        13,
        6
    ],
    [
        5,
        14,
        7
    ],
    [
        6,
        15
    ],
    [
        0,
        16,
        9
    ],
    [
        8,
        1,
        17,
        10
    ],
    [
        9,
        2,
        18,
        11
    ],
    [
        10,
        3,
        19,
        12
    ],
    [
        11,
        4,
        20,
        13
    ],
    [
        12,
        5,
        21,
        14
    ],
    [
        13,
        6,
        22,
        15
    ],
    [
        14,
        7,
        23
    ],
    [
        8,
        24,
        17
    ],
    [
        16,
        9,
        25,
        18
    ],
    [
        17,
        10,
        26,
        19
    ],
    [
        18,
        11,
        27,
        20
    ],
    [
        19,
        12,
        28,
        21
    ],
    [
        20,
        13,
        29,
        22
    ],
    [
        21,
        14,
        30,
        23
    ],
    [
        22,
        15,
        31
    ],
    [
        16,
        32,
        25
    ],
    [
        24,
        17,
        33,
        26
    ],
    [
        25,
        18,
        34,
        27
    ],
    [
        26,
        19,
        35,
        28
    ],
    [
        27,
        20,
        36,
        29
    ],
    [
        28,
        21,
        37,
        30
    ],
    [
        29,
        22,
        38,
        31
    ],
    [
        30,
        23,
        39
    ],
    [
        24,
        40,
        33
    ],
    [
        32,
        25,
        41,
        34
    ],
    [
        33,
        26,
        42,
        35
    ],
    [
        34,
        27,
        43,
        36
    ],
    [
        35,
        28,
        44,
        37
    ],
    [
        36,
        29,
        45,
        38
    ],
    [
        37,
        30,
        46,
        39
    ],
    [
        38,
        31,
        47
    ],
    [
        32,
        48,
        41
    ],
    [
        40,
        33,
        49,
        42
    ],
    [
        41,
        34,
        50,
        43
    ],
    [
        42,
        35,
        51,
        44
    ],
    [
        43,
        36,
        52,
        45
    ],
    [
        44,
        37,
        53,
        46
    ],
    [
        45,
        38,
        54,
        47
    ],
    [
        46,
        39,
        55
    ],
    [
        40,
        56,
        49
    ],
    [
        48,
        41,
        57,
        50
    ],
    [
        49,
        42,
        58,
        51
    ],
    [
        50,
        43,
        59,
        52
    ],
    [
        51,
        44,
        60,
        53
    ],
    [
        52,
        45,
        61,
        54
    ],
    [
        53,
        46,
        62,
        55
    ],
    [
        54,
        47,
        63
    ],
    [
        48,
        57
    ],
    [
        56,
        49,
        58
    ],
    [
        57,
        50,
        59
    ],
    [
        58,
        51,
        60
    ],
    [
        59,
        52,
        61
    ],
    [
        60,
        53,
        62
    ],
    [
        61,
        54,
        63
    ],
    [
        62,
        55
    ]
]