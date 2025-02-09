class AIPrototype {
    constructor(type) {
        this.type = type;
    }
    
    startTurn() {
        let move = null;
        if(this.type === 'monteCarlo') {
            move = this.monteCarloMove();
        } else if (this.type === 'random') {
            move = this.randomMove();
        } else if (this.type === 'chase') {
            move = this.chaseMove();
        }
        if (move != false) {
            if (move[0] === 'movement') {
                Board.boardArray[move[1]].move(move[2], Board)
                CurrentCombat.endTurn();
            }
        } else {
            CurrentCombat.endTurn()
        }
    }

    getPossibleMoves() {
        let possibleMoves = [];
        Board.enemyPieces.forEach(piece => {
            piece.getMovementRange().forEach(move => {
                possibleMoves.push([piece.temp.index, move]);
            })
        })
        return possibleMoves;
    }

    randomMove() {
        const possibleMoves = this.getPossibleMoves();
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        if (randomMove != undefined) {
            return ['movement', randomMove[0], randomMove[1]];
        }
        return false;
    }

    chaseMove() {
        const target = Board.playerPieces[0].temp.index;
        let moveArray = new Array(3).fill(99)
        let possibleMoves = this.getPossibleMoves();
        possibleMoves.forEach(move =>{
            let distance = Board.calculateMoveDistanceWrapper(move, target);
            if (distance < moveArray[2]){
                moveArray = [move[0], move[1], distance]
            }
        })
        return ['movement', moveArray[0], moveArray[1]]
    }

    monteCarloMove() {
        const gameState = new GameState(Board.exportBoard(), 'enemy');
        
        const mcts = new MonteCarloTreeSearch(gameState);
        const bestMove = mcts.runSearch();

        if(!bestMove) return false;
        return ['movement', bestMove[0], bestMove[1]];
    }
}

class GameState {
    constructor(board, currentPlayer) {
        this.board = new BoardPrototype();
        this.board.init(board, false);
        this.possibleMoves = this.getPossibleMoves();
        this.currentPlayer = currentPlayer;
        this.lastMove = null;
    }
    
    getPossibleMoves() {
        let possibleMoves = [];
        let pieces = this.currentPlayer === 'player' ? this.board.playerPieces : this.board.enemyPieces;
        pieces.forEach(piece => {
            let moves = piece.getMovementRange(this.board);
            moves.forEach(move => {
                possibleMoves.push([piece.temp.index, move]);
            })
        })
        return possibleMoves;
    }
    
    clone() {
        return new GameState(
            this.board.exportBoard(),
            this.currentPlayer,
        )
    }

    play(move) {
        this.board.boardArray[move[0]].move(move[1], this.board, false);
        this.lastMove = move;
        this.currentPlayer = this.currentPlayer === 'player' ? 'enemy' : 'player';
    }

    getLastMove() {
        return this.lastMove;
    }

    checkWinCondition(pieceIndex) {
        if (pieceIndex === undefined) {
            for (const piece of this.board.enemyPieces) {
                for (const neighborIndex of NeighborMap[piece.temp.index]) {
                    const neighborPiece = this.board.boardArray[neighborIndex];
                    if (neighborPiece instanceof PlayerPiece) {
                        return true;
                    }
                }
            }
        } else {
            for (const neighborIndex of NeighborMap[pieceIndex]) {
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
        this.untriedMoves = state.getPossibleMoves();  // Moves we haven't tried yet
        this.explorationConstant = 1.41;
    }
    
    selectChild() {
        return this.children.reduce((bestChild, child) => {
            const exploitation = child.wins / (child.visits * this.explorationConstant);
            const exploration = Math.sqrt(Math.log(this.visits) / child.visits);
            const uct = exploitation + exploration;

            if(uct > bestChild.uct) {
                return {node: child, uct: uct};
            }
            return bestChild
        }, {node: this.children[0], uct: -Infinity}).node;
    }

    expand() {
        if(this.untriedMoves.length === 0) return null;
        const moveIndex = Math.floor(Math.random() * this.untriedMoves.length);
        const move = this.untriedMoves.splice(moveIndex, 1)[0];

        const nextState = this.state.clone();
        nextState.play(move);

        const child = new TreeNode(nextState);
        child.parent = this;
        this.children.push(child);

        return child
    }

    simulate(maxDepth) {
        let currentState = this.state.clone();
        let depth = 0;
        while(depth < maxDepth) {
            const possibleMoves = currentState.getPossibleMoves();
            if(possibleMoves.length === 0) {
                return 0
            };
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            currentState.play(randomMove);
            if(currentState.checkWinCondition()) {
                return 1 + (maxDepth - depth) / (maxDepth * 2);
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
        return this.untriedMoves.length === 0;
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
        console.log(this.getBestMove());
        return this.getBestMove();
    }

    getBestMove() {
        if(this.root.children.length === 0) return false;
        return this.root.children.reduce((best, child) =>
            child.visits > best.visits ? child : best
        ).state.getLastMove();
    }
}