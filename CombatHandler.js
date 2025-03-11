
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
        //Call the Go function
        //updatevisual
    }

    init(board = [], updateVisual = true) {
        //Init the GO board and update the visual board
    }

    showRange(index, range, checkLos = false) {
        //Call the Go function and update the visual board
    }

    hideRange() {
        //Update the visual board
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
}