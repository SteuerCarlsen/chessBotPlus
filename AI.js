const EnemyAI = {
    startTurn: function(typeOfAI) {
        const possibleMoves = this.getPossibleMovements();
        let move = null;
        if(typeOfAI === 'random') {
            move = this.randomMove(possibleMoves);
        } else if(typeOfAI === 'chase'){
            move = this.chaseMove(possibleMoves);
        } else if(typeOfAI === "monteCarlo"){
            move = this.monteCarloMove();
        }
        if (move != false){
            if (move[0] === 'movement') {
                Board.boardArray[move[1]].move(move[2], Board)
                CurrentCombat.endTurn();
            }
        } else {
            CurrentCombat.endTurn()
        }
    },

    getPossibleMovements: function() {
        let possibleMoves = [];
        Board.enemyPieces.forEach(piece => {
            piece.getMovementRange().forEach(move => {
                possibleMoves.push([piece.temp.index, move]);
            })
        })
        return possibleMoves;
    },

    randomMove: function(possibleMoves) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        if(randomMove != undefined){
            return [`movement`, randomMove[0], randomMove[1]];
        } else {
            return false
        }
    },

    chaseMove: function(possibleMoves) {
        const target = Board.playerPieces[0].temp.index;
        let moveArray = new Array(3).fill(99)
        possibleMoves.forEach(move =>{
            let distance = Board.calculateMoveDistanceWrapper(move, target);
            if (distance < moveArray[2]){
                moveArray = [move[0], move[1], distance]
            }
        })
        return [`movement`, moveArray[0], moveArray[1]]
    },

    monteCarloMove: function() {
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

    isTerminal() {
        for (const piece of this.board.enemyPieces) {
            if (this.checkWinCondition(this.board, piece.temp.index)) {
                return true;
            }
        }
        return false;
    }

    getScore() {
        if (this.isTerminal()) {
            return 1;
        }
        return 0;
    }

    getLastMove() {
        return this.lastMove;
    }

    checkWinCondition(board, index) {
        for (const neighborIndex of NeighborMap[index]) {
            const piece = board.boardArray[neighborIndex];
            if (piece && piece.shortType === "Player") {
                return true;
            }
        }
        return false;
    }
}


/*class SimulationAIInstance {
    constructor(type, board){
        this.type = type;
        this.board = board;
        this.pieces = type == "player" ? board.playerPieces : board.enemyPieces;
        this.score = 0;
    }
    
    startTurn() {
        const possibleMoves = this.getPossibleMovements();
        let move = this.randomMove(possibleMoves);
        if (move != false){
            if (move[0] === 'movement') {
                this.board.boardArray[move[1]].move(move[2], this.board, false)
            }
            return [move[1], move[2]]
        } 
        return false
    }

    getPossibleMovements() {
        let possibleMoves = []
        this.pieces.forEach(piece =>{
            possibleMoves.push([piece.temp.index, piece.getMovementRange(this.board)])
        })
        return possibleMoves
    }

    randomMove(possibleMoves) {
        const randomPiece = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        if (randomPiece[1].length > 0){
            const randomPosition = randomPiece[1][Math.floor(Math.random() * randomPiece[1].length)];
            return [`movement`, randomPiece[0], randomPosition];
        } else {
            return false
        }
    }
}

/class Simulation {
    constructor(initBoard = [], simulations, depth) {
        this.board = new BoardPrototype();
        this.board.init(initBoard, false);
        this.possibleMoves = this.getPossibleMovements();
        this.simulations = simulations;
        this.depth = depth;
        this.scores = new Array(this.possibleMoves.length).fill(0).map(() => []);
    }

    getPossibleMovements() {
        let possibleMoves = [];
        this.board.enemyPieces.forEach(piece => {
            possibleMoves.push([piece.temp.index, piece.getMovementRange(this.board)]);
        });
        return possibleMoves;
    }

    calculatePieceWeights() {
        let output = [];
        this.scores.forEach((piece, pieceKey) => {
            if (output[pieceKey] == undefined) {
                output[pieceKey] = 0;
            }
            piece.forEach(score => {
                output[pieceKey] += score;
            });
        });
        return output;
    }

    getWeightedRandom(weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const randomNum = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulativeWeight += weights[i];
            if (randomNum < cumulativeWeight) {
                return i;
            }
        }
        return weights.length - 1;
    }

    simulate() {
        //console.group('Simulation');
        this.possibleMoves.forEach((moveSet, setKey) => {
            moveSet[1].forEach(() => {
                if (this.scores[setKey] == undefined) {
                    this.scores[setKey] = [0];
                } else {
                    this.scores[setKey].push(0);
                }
            });
        });
        for (let i = 0; i < this.simulations; i++) {
            //console.group(`Simulation ${i + 1}`);
            let piece = null;
            let move = null;
            if (Math.random() > 0.5) {
                let pieceWeights = this.calculatePieceWeights();
                piece = this.getWeightedRandom(pieceWeights);
                move = this.getWeightedRandom(this.scores[piece]);
            } else {
                // Select a non-weighted random key
                piece = Math.floor(Math.random() * this.possibleMoves.length);
                move = Math.floor(Math.random() * this.possibleMoves[piece][1].length);
            }
            //console.log(`Selected piece: ${piece}, Selected move: ${move}`);
            this.scores[piece][move] += this.simulationLoop(piece, move, this.depth, this.depth, this.board, new SimulationAIInstance('enemy', this.board));
            //console.groupEnd();
        }
        //console.log(this.scores);
        //console.groupEnd();
        console.log(this.scores)
    }

    simulationLoop(pieceIndex, moveIndex, orgDepth, remainingDepth, board, player) {
        //console.group(`Depth ${orgDepth - remainingDepth + 1}`);
        let chosenMove = player.startTurn();
        let actingPieceIndex = chosenMove[0];
        //console.log(`Player ${player.type}, Chosen move ${chosenMove}`);
        if (player.type == "enemy" && actingPieceIndex && this.checkWinCondition(board, actingPieceIndex)) {
            //console.log(`Win condition met at depth ${orgDepth - remainingDepth + 1}`);
            //console.groupEnd();
            return orgDepth - remainingDepth;
        }
        if (--remainingDepth == 0) {
            //console.log(`Reached max depth at depth ${orgDepth}`);
            //console.groupEnd();
            return -25;
        }
        let nextPlayer = player.type == "enemy" ? "player" : "enemy";
        let newBoard = new BoardPrototype();
        newBoard.init(board.exportBoard(), false);
        let result = this.simulationLoop(pieceIndex, moveIndex, orgDepth, remainingDepth, newBoard, new SimulationAIInstance(nextPlayer, newBoard));
        player.score += result;
        //console.groupEnd();
        return result;
    }

    checkWinCondition(board, index) {
        for (let i = 0; i < NeighborMap[index].length; i++) {
            let compIndex = NeighborMap[index][i]
            if (board.boardArray[compIndex] != null) {
                if (board.boardArray[compIndex].shortType == "Player") {
                    return true;
                }
            }
        }
        return false;
    }
}*/

const explorationConstant = 1.41;

class TreeNode {
    constructor(state) {
        this.state = state;         // Current game position
        this.parent = null;         // Previous position
        this.children = [];         // Next possible positions
        this.wins = 0;             // How many wins we got through this position
        this.visits = 0;           // How many times we tried this position
        this.untriedMoves = state.getPossibleMoves();  // Moves we haven't tried yet
    }
    
    selectChild() {
        return this.children.reduce((bestChild, child) => {
            const exploitation = child.wins / child.visits;
            const exploration = Math.sqrt(Math.log(this.visits) / child.visits);
            const uct = exploitation + explorationConstant * exploration;

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
        while(!currentState.isTerminal() && depth < maxDepth) {
            const possibleMoves = currentState.getPossibleMoves();
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            currentState.play(randomMove);
            depth++;
        }
        return currentState.getScore();
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
        return this.state.isTerminal();
    }
}

class MonteCarloTreeSearch {
    constructor(initialState, timeLimit = 500, maxDepth = 20) {
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
        return this.getBestMove();
    }

    getBestMove() {
        if(this.root.children.length === 0) return false;
        return this.root.children.reduce((best, child) =>
            child.visits > best.visits ? child : best
        ).state.getLastMove();
    }
}