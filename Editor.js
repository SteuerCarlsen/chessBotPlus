const toolIndex = ['empty', 'playerArea', 'enemy', 'terrain']
let editorBoard = null;
let selectedTool = null;

function enableEditor() {
    console.log('Editor enabled');
    editorBoard = new BoardPrototype(true);
    editorBoard.init(new Array(64), true);
}

function selectTool(index) {
    selectedTool = index;
}

function editSquare (index) {
    switch (selectedTool) {
        case 0:
            editorBoard.updateSquare(index, null);
            break;
        case 1:

    }
}

function exportBoard() {
    console.log(editorBoard.exportBoard());
}