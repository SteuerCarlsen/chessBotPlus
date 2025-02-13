//AI Prototype holds info and methods for the in-game AI controlling pieces
class AIPrototype {
    constructor(type) {
        this.type = type;
        this.gameState = null;
        this.possibleActions = null;
    }
    //Method to start the AI's turn with moves chosen based on AI-type
    startTurn() {
        this.gameState = new GameState(Board, 'enemy');
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
                CurrentCombat.endTurn();
            } else if (action[0] === 'ability') {
                actingPiece.abilities[action[3]].use(actingPiece, Board.boardArray[action[2]]);
                CurrentCombat.endTurn();
            }
        } else {
            CurrentCombat.endTurn()
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
        let moveArray = new Array(3).fill(99)
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
    monteCarloMove(timeLimit = 500, maxDepth = 100) {
        for (const action of this.possibleActions) {
            if (this.gameState.checkWinCondition('enemy')) return action;
        }

        const gameState = new GameState(Board.exportBoard(), 'enemy');

        const mcts = new MonteCarloTreeSearch(gameState, timeLimit, maxDepth);
        const bestAction = mcts.runSearch();

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
        this.untriedActions = state.getPossibleActions();  // Moves we haven't tried yet
        this.explorationConstant = 1.41;
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

        const child = new TreeNode(nextState);
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
            if(Terminal[0]) return 1 + Math.round((maxDepth - depth) / (maxDepth));
            if(Terminal[1]) return 0;

            depth++;
        }
        return 0;
    }
    //Backpropagates the result of the simulation to node and parent nodes
    backpropagate(result) {
        let node = this;
        while(node !== null) {
            node.visits++;
            node.wins += result;
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
    constructor(initialState, timeLimit = 500, maxDepth = 100) {
        this.root = new TreeNode(initialState);
        this.timeLimit = timeLimit;
        this.maxDepth = maxDepth;
    }
    //Runs the Monte Carlo Tree Search within the given parameters
    runSearch() {
        const startTime = Date.now();
        let iterations = 0;

        while (Date.now() - startTime < this.timeLimit) {
            iterations++;
            let node = this.root;

            while(!node.isTerminal() && node.isFullyExpanded()) {
                node = node.selectChild();
            }

            if(!node.isTerminal()) {
                node = node.expand();
                if(node === null) continue;
            }

            const result = node.simulate(this.maxDepth);

            node.backpropagate(result);
        }

        console.log(`Completed ${iterations} iterations`);
        return this.getBestAction();
    }
    //Returns the action with most wins in the simulation
    getBestAction() {
        if(this.root.children.length === 0) return false;
        return this.root.children.reduce((best, child) =>
            child.wins > best.wins ? child : best
        ).state.getLastAction();
    }
}