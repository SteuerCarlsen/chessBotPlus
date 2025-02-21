let comparedSimulations = null;

async function testSimulationValues (simulations = 10, timeLimit = 1000, maxDepth = 500, explorationConstant = 1.41) {
    let results = [];

    for (let i = 0; i < simulations; i++) {
        let simulationAI = new MonteCarloTreeSearch(explorationConstant);
        simulationAI.init(Board.exportBoard(), 'enemy', timeLimit, maxDepth);
        const result = await simulationAI.runSearch(true)
        results.push(result);
        simulationAI.cleanupWorkers();
    }

    let totalIterations = 0;
    let totalBestScore = 0;
    let totalBestActionAverageTurns = 0;

    for (const result of results) {
        totalIterations += result.iterations;
        totalBestScore += result.bestScore;
        totalBestActionAverageTurns += result.bestActionAverageTurns;
    }

    const averageIterations = totalIterations / simulations;
    const averageBestScore = totalBestScore / simulations;
    const averageBestActionAverageTurns = totalBestActionAverageTurns / simulations;

    return {
        averageIterations: averageIterations,
        averageBestScore: averageBestScore,
        averageBestActionAverageTurns: averageBestActionAverageTurns,
    }
}

async function compareSimulationValues(cases = []) {
    let output = [cases, {averageIterations: [], averageBestScore: [], averageBestActionAverageTurns: []}, {averageIterationsFactor: [1], averageBestScoreFactor: [1], averageBestActionAverageTurnsFactor: [1]}];

    for (const testCase of cases) {
        const result = await testSimulationValues(testCase.simulations, testCase.timeLimit, testCase.maxDepth, testCase.explorationConstant);
        output[1].averageIterations.push(result.averageIterations);
        output[1].averageBestScore.push(result.averageBestScore);
        output[1].averageBestActionAverageTurns.push(result.averageBestActionAverageTurns);
    }

    for (let i = 1; i < cases.length; i++) {
        output[2].averageIterationsFactor.push(output[1].averageIterations[i] / output[1].averageIterations[0]);
        output[2].averageBestScoreFactor.push(output[1].averageBestScore[i] / output[1].averageBestScore[0]);
        output[2].averageBestActionAverageTurnsFactor.push(output[1].averageBestActionAverageTurns[i] / output[1].averageBestActionAverageTurns[0]);
    }

    console.log('Simulation comparison results:', output);
    comparedSimulations = output;
}

const testCases = [
    {simulations: 10, timeLimit: 1000, maxDepth: 500, explorationConstant: 0.6},
]

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
        let action = null;
        if(this.type === 'monteCarlo') {
            action = await this.monteCarloMove();
        } else if (this.type === 'random') {
            action = this.randomMove();
        } else if (this.type === 'chase') {
            action = this.chaseMove();
        }
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
    //Method to choose a random action from possible actions
    randomAction() {
        const randomAction = this.possibleActions[Math.floor(Math.random() * this.possibleActions.length)];
        if (randomAction != undefined) {
            return randomAction;
        }
        return false;
    }
    //Chase down the closest player piece
    chaseMove() {
        const targets = Board.playerPieces;
        let moveArray = new Array(3).fill(Infinity)
        this.possibleActions.forEach(move =>{
            if (move[0] === 'movement') {
                targets.forEach(target => {
                    let distance = Board.calculateMoveDistanceWrapper(move, target.temp.index);
                    if (distance < moveArray[3]){
                        moveArray = move.push(distance);
                    }
                })
                
            }
        })
        return moveArray;
    }
    //Choose action based on Monte Carlo Tree Search (action most likely to result in win)
    async monteCarloMove() {
        MCTSAI.init(Board.exportBoard(), 'enemy')
        const bestAction = await MCTSAI.runSearch();
        console.log('Monte Carlo AI chose:', bestAction);
        if(!bestAction) return false;
        return bestAction;
    }
}

//TreeNode Prototype holds info and methods for the nodes in the Monte Carlo Tree Search
class TreeNode {
    constructor(state, explorationConstant = 0.6) {
        this.state = state;         // Current game position
        this.parent = null;         // Previous position
        this.children = [];         // Next possible positions
        this.wins = 0;             // How many wins we got through this position
        this.visits = 0;           // How many times we tried this position
        this.turns = 0;
        this.untriedActions = [...state.getPossibleActions()];  // Moves we haven't tried yet
        this.explorationConstant = explorationConstant;
    }
    //Selects child node based on UCT (Upper Confidence Bound for Trees) formula
    selectChild() {
        return this.children.reduce((bestChild, child) => {
            const exploitation = child.wins / child.visits;
            const exploration = this.explorationConstant * Math.sqrt(Math.log(this.visits) / child.visits);
            const uct = exploitation + exploration;

            if(uct > bestChild.uct) {
                return {node: child, uct: uct};
            }
            return bestChild
        }, {node: this.children[0], uct: -Infinity}).node;
    }
    //Expands the node by playing a random untried action
    expand() {
        if(this.untriedActions.length === 0) return null;
        const actionIndex = Math.floor(Math.random() * this.untriedActions.length);
        const action = this.untriedActions.splice(actionIndex, 1)[0];

        const nextState = this.state.clone();
        nextState.play(action);

        const child = new TreeNode(nextState, this.explorationConstant);
        child.parent = this;
        this.children.push(child);

        return child
    }

    //Simulates the game from the current node to a terminal state
    simulate(maxDepth) {
        let currentState = this.state.clone();
        let depth = 0;

        //debugLog('Starting simulation', { maxDepth });

        while(depth < maxDepth) {
            const possibleActions = currentState.getPossibleActions();
            if(possibleActions.length === 0) {
                //debugLog('No possible actions', { depth });
                return 0
            };

            const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
            
            const Terminal = currentState.play(randomAction);

            if(Terminal != undefined) {
                //debugLog('Terminal state reached', Terminal);
                if(Terminal[0]) return [1, depth];
                if(Terminal[1]) return [0, depth];
            }

            depth++;
        }
        return [0, depth];
    }
    //Backpropagates the result of the simulation to node and parent nodes
    backpropagate(result) {
        let node = this;
        while(node !== null) {
            node.visits++;
            node.wins += result[0];
            node.turns += result[1];
            node = node.parent;
        }
    }
    //Checks if the node is fully expanded (all possible actions have been tried)
    isFullyExpanded() {
        return this.untriedActions.length === 0;
    }
    //Checks if the node is terminal (win or loss)
    isTerminal() {
        const Terminal = this.state.isTerminal();
        return Terminal[0] || Terminal[1];
    }
}

//MonteCarloTreeSearch Prototype holds info and methods for the Monte Carlo Tree Search
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

    init(initialBoard, initialPlayer, timeLimit = 1000, maxDepth = 500) {
        this.initialBoard = initialBoard;
        this.initialPlayer = initialPlayer;
        this.initialSate = new SimulationState(initialBoard, initialPlayer);
        this.initialPossibleActions = this.initialSate.getPossibleActions();
        this.timeLimit = timeLimit;
        this.maxDepth = maxDepth;
        this.actionsPerWorker = Math.ceil(this.initialPossibleActions.length / this.numWorkers);
    }

    //Runs the Monte Carlo Tree Search within the given parameters
    async runSearch(returnMetadata = false) {
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
                        timeLimit: this.timeLimit,
                        maxDepth: this.maxDepth,
                        minNodeRepeats: 1,
                        maxNodeRepeats: 10,
                        explorationConstant: this.explorationConstant,
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
    
        debugLog('MCTS results:', {
            iterations: totalIterations,
            timeLimit: this.timeLimit,
            bestAction,
            bestScore,
            bestActionAverageTurns
        });

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