//AI Prototype holds info and methods for the in-game AI controlling pieces
class AIPrototype {
    constructor(type) {
        this.type = type;
        this.gameState = null;
        this.possibleActions = null;
    }
    //Method to start the AI's turn with moves chosen based on AI-type
    async startTurn() {
        this.gameState = new SimulationState(Board, 'enemy');
        this.possibleActions = this.gameState.getPossibleActions();
        let action = action = await this.monteCarloMove();
        if (action != false) {
            console.log('AI chose:', action);
            const actingPiece = Board.boardArray[action[1]];
            if (action[0] === 'movement') {
                actingPiece.move(action[2], Board)
            } else if (action[0] === 'ability') {
                actingPiece.abilities[action[3]].use(actingPiece, Board.boardArray[action[2]]);
            }
        } else {
            CurrentCombat.advanceTurn()
        }
    }
    //Choose action based on Monte Carlo Tree Search (action most likely to result in win)
    async monteCarloMove() {
        MCTSAI.init(Board.exportBoard(), 'enemy')
        const bestAction = await MCTSAI.runSearch();
        if(!bestAction) return false;
        return bestAction;
    }
}


//MonteCarloTreeSearch Prototype holds info and methods for the Monte Carlo Tree Search. This should stay in
class MonteCarloTreeSearch {
    constructor(explorationConstant = 0.6) {
        this.explorationConstant = explorationConstant;
        this.workers = [];
        this.numWorkers = 4;
        this.initWorkers();
    }

    cleanupWorkers() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }

    initWorkers() {
        for (let i = 0; i < this.numWorkers; i++) {
            const worker = new Worker('mcts-worker.js');
            this.workers.push(worker);
        }
    }

    init(initialBoard, initialPlayer, timeLimit = 1000, maxDepth = 500, iterationGoal = 20000) {
        this.initialBoard = initialBoard;
        this.initialPlayer = initialPlayer;
        this.initialSate = new SimulationState(initialBoard, initialPlayer);
        this.initialPossibleActions = this.initialSate.getPossibleActions();
        this.timeLimit = timeLimit;
        this.iterationGoal = iterationGoal;
        this.maxDepth = maxDepth;
        this.actionsPerWorker = Math.ceil(this.initialPossibleActions.length / this.numWorkers);
    }

    //Runs the Monte Carlo Tree Search within the given parameters
    async runSearch(returnMetadata = false) {
        const initialTime = Date.now();
        try {
            const promises = this.workers.map((worker, index) => {
                const startIndex = index * this.actionsPerWorker;
                const endIndex = Math.min(startIndex + this.actionsPerWorker, this.initialPossibleActions.length);
                return new Promise(resolve => {
                    worker.postMessage({
                        initialBoard: this.initialBoard,
                        initialPlayer: this.initialPlayer,
                        startIndex: startIndex,
                        endIndex: endIndex,
                        timeLimit: this.timeLimit / this.numWorkers,
                        maxDepth: this.maxDepth,
                        explorationConstant: this.explorationConstant,
                        iterationGoal: this.iterationGoal / this.numWorkers
                    });

                    worker.onmessage = function(e) {
                        if (e.data.type === 'debug') {
                            console.log('MCTS Debug:', e.data.data.message, e.data.data.data);
                        } else {
                            resolve(e.data);
                        }
                    }
                })
            });

            const results = await Promise.all(promises);
            let totalCalculationTime = Date.now() - initialTime;
            console.log({time: totalCalculationTime, results});

            return this.getBestAction(results, returnMetadata);
        } catch (error) {
            console.error('MCTS Errror:', error);
            return false;
        }
    }

    //Returns the action with highest win rate
    getBestAction(results, returnMetadata = false) {
        let bestAction = null;
        let bestScore = -Infinity;
        let bestActionAverageTurns = Infinity;
        let bestFastWin = Infinity;
        let totalIterations = 0;

        for (const result of results) {
            if (!result || !result[0]) continue;
            
            const [actionStats, iterations] = result;
            totalIterations += iterations;
    
            for (const actionStat of actionStats) {
                if (!actionStat) continue;
                
                const [action, wins, visits, turns] = actionStat;
                const score = visits > 0 ? wins / visits : 0;
                const actionAverageTurns = visits > 0 ? turns / visits : 0;
                const fastWin = actionAverageTurns / score;
    
                if (fastWin < bestFastWin) {
                    bestAction = action;
                    bestScore = score;
                    bestFastWin = fastWin;
                    bestActionAverageTurns = visits > 0 ? turns / visits : 0;
                }
            }
        }

        if (returnMetadata) {
            return {
                iterations: totalIterations,
                bestScore: bestScore,
                bestActionAverageTurns: bestActionAverageTurns,
            }
        }
    
        return bestAction;
    }
}