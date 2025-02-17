//AI Prototype holds info and methods for the in-game AI controlling pieces
class AIPrototype {
    constructor(type) {
        this.type = type;
        this.gameState = null;
        this.possibleActions = null;
    }
    //Method to start the AI's turn with moves chosen based on AI-type
    startTurn() {
        this.gameState = new SimulationState(Board, 'enemy');
        this.possibleActions = this.gameState.getPossibleActions();
        let action = null;
        if(this.type === 'monteCarlo') {
            action = this.monteCarloMove();
        } else if (this.type === 'random') {
            action = this.randomMove();
        } else if (this.type === 'chase') {
            action = this.chaseMove();
        }
        if (action != false) {
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
    async monteCarloMove(timeLimit = 500, maxDepth = 100) {
        console.log('MCTS started')
        MCTSAI.init(Board.exportBoard(), 'enemy', timeLimit, maxDepth)
        const bestAction = await MCTSAI.runSearch();
        console.log(bestAction)
        if(!bestAction) return false;
        return bestAction;
    }
}

//TreeNode Prototype holds info and methods for the nodes in the Monte Carlo Tree Search
class TreeNode {
    constructor(state) {
        this.state = state;         // Current game position
        this.parent = null;         // Previous position
        this.children = [];         // Next possible positions
        this.wins = 0;             // How many wins we got through this position
        this.visits = 0;           // How many times we tried this position
        this.turns = 0;
        this.untriedActions = state.getPossibleActions();  // Moves we haven't tried yet
        this.explorationConstant = 1.41;
        this.depth = 0;
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

        const child = new TreeNode(nextState, this.depth + 1);
        child.parent = this;
        this.children.push(child);

        return child
    }
    //Simulates the game from the current node to a terminal state
    simulate(maxDepth) {
        let currentState = this.state.clone();
        let depth = 0;
        while(depth < maxDepth) {
            const possibleActions = currentState.getPossibleActions();
            if(possibleActions.length === 0) {
                return 0
            };

            currentState.advanceTurn();

            const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
            currentState.play(randomAction);

            const Terminal = currentState.advanceTurn();

            if(Terminal != undefined) {
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
    constructor() {
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

    init(initialBoard, initialPlayer, timeLimit = 500, maxDepth = 100) {
        this.initialBoard = initialBoard;
        this.initialPlayer = initialPlayer;
        this.initialSate = new SimulationState(initialBoard, initialPlayer);
        this.initialPossibleActions = this.initialSate.getPossibleActions();
        this.timeLimit = timeLimit;
        this.maxDepth = maxDepth;
        this.actionsPerWorker = Math.ceil(this.initialPossibleActions.length / this.numWorkers);
    }

    //Runs the Monte Carlo Tree Search within the given parameters
    async runSearch() {
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
                    });
                    worker.onmessage = (e) => resolve(e.data);
                })
            });

            const results = await Promise.all(promises);

            return this.getBestAction(results);
        } catch (error) {
            console.error('MCTS Errror:', error);
            return false;
        }
    }

    //Returns the action with most wins in the simulation
    getBestAction(results) {
        let allActions = [];
        let iterations = 0;
        results.forEach(result => {
            allActions = allActions.concat(result[0]);
            iterations += result[1];
        });

        let bestAction = null;
        let bestScore = -Infinity;
        let bestActionAverageTurns = 0;

        console.log(results)
        console.log(allActions)

        for (const [action, score, visits, turns] of Object.entries(allActions)) {
            if(score > bestScore) {
                bestAction = action;
                bestScore = score;
                bestActionAverageTurns = turns / visits;
            }
        }

        console.log(iterations)
        console.log(bestAction, bestScore, bestActionAverageTurns)
        return bestAction;
    }
}