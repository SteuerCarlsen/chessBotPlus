class AIPrototype {
    constructor(type) {
        this.type = type;
        this.gameState = null;
        this.possibleActions = this.gameState.getPossibleActions();
    }
    
    startTurn() {
        this.gameState = new GameState(Board, 'enemy');
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

    randomAction() {
        const randomAction = this.possibleActions[Math.floor(Math.random() * this.possibleActions.length)];
        if (randomAction != undefined) {
            return randomAction;
        }
        return false;
    }

    chaseMove() {
        const target = Board.playerPieces[0].temp.index;
        let moveArray = new Array(3).fill(99)
        this.possibleActions.forEach(move =>{
            if (move[0] === 'movement') {
                let distance = Board.calculateMoveDistanceWrapper(move, target);
                if (distance < moveArray[3]){
                    moveArray = move.push(distance);
                }
            }
        })
        return moveArray;
    }

    monteCarloMove() {
        for (const action of this.possibleActions) {
            if (this.gameState.checkWinCondition()) return action;
        }

        const gameState = new GameState(Board.exportBoard(), 'enemy');

        const mcts = new MonteCarloTreeSearch(gameState);
        const bestAction = mcts.runSearch();

        if(!bestAction) return false;
        return bestAction;
    }
}

class GameState {
    constructor(board, currentPlayer) {
        if(board instanceof BoardPrototype) {
            this.board = board;
        } else {
            this.board = new BoardPrototype();
            this.board.init(board, false);
        }
        this.possibleActions = this.getPossibleActions();
        this.currentPlayer = currentPlayer;
        this.lastAction = null;
    }
    
    getPossibleActions() {
        let possibleActions = [];
        let pieces = this.currentPlayer === 'player' ? this.board.playerPieces : this.board.enemyPieces;
        pieces.forEach(piece => {
            let moves = piece.getMovementRange(this.board);
            moves.forEach(move => {
                possibleActions.push(['movement', piece.temp.index, move]);
            })
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
        })
        return possibleActions;
    }
    
    clone() {
        return new GameState(
            this.board.exportBoard(),
            this.currentPlayer,
        )
    }

    play(action) {
        const actingPiece = this.board.boardArray[action[1]];
        if (action[0] === 'movement') {
            actingPiece.move(move[2], this.board, false);
        } else if (action[0] === 'ability') {
            actingPiece.abilities[action[3]].use(actingPiece, this.board.boardArray[action[2]]);
        }
        this.lastAction = action;
        this.currentPlayer = this.currentPlayer === 'player' ? 'enemy' : 'player';
    }

    getLastAction() {
        return this.lastAction;
    }

    checkWinCondition() {
        for (const piece of this.board.enemyPieces) {
            for (const neighborIndex of NeighborMap[piece.temp.index]) {
                const neighborPiece = this.board.boardArray[neighborIndex];
                if (neighborPiece instanceof PlayerPiece) {
                    return true;
                }
            }
        }
        return false;
    }
}

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

    simulate(maxDepth) {
        let currentState = this.state.clone();
        let depth = 0;
        while(depth < maxDepth) {
            const possibleActions = currentState.getPossibleActions();
            if(possibleActions.length === 0) {
                return 0
            };
            const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
            currentState.play(randomAction);
            if(currentState.checkWinCondition()) {
                return 1 + Math.round((maxDepth - depth) / (maxDepth));
            };
            depth++;
        }
        return 0;
    }

    backpropagate(result) {
        let node = this;
        while(node !== null) {
            node.visits++;
            node.wins += result;
            node = node.parent;
        }
    }

    isFullyExpanded() {
        return this.untriedActions.length === 0;
    }

    isTerminal() {
        return this.state.checkWinCondition();
    }
}

class MonteCarloTreeSearch {
    constructor(initialState, timeLimit = 500, maxDepth = 25) {
        this.root = new TreeNode(initialState);
        this.timeLimit = timeLimit;
        this.maxDepth = maxDepth;
    }

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

        console.log(`Completed ${iterations} iterations in ${Date.now() - startTime}ms`);
        return this.getBestAction();
    }

    getBestAction() {
        if(this.root.children.length === 0) return false;
        return this.root.children.reduce((best, child) =>
            child.wins > best.wins ? child : best
        ).state.getLastAction();
    }
}