let selectedEncounter = null;
let selectedParty = new Map();
let encounters = new Map();

function selectEncounter(id) {
    selectedEncounter = encounters.get(id);
    console.log("Selected encounter: " + selectedEncounter.id);
}

function loadEncounter() {
    if (selectedEncounter == null) {
        console.log("No encounter selected");
        return;
    }
    if (selectedParty.size < 1) {
        console.log("No party selected");
        return;
    }
    selectedEncounter.init();
}

class Encounter {
    constructor(id, map, size = 64){
        this.id = id;
        this.map = map;
        this.array = [];
        this.size = size;
        if (encounters.has(id)){
            console.log("Encounter already exists");
            return;
        }
        encounters.set(id, this);
    }

    init(){
        VisualBoard.init(this.size);

        for (let i = 0; i < this.size; i++){
            if (this.map.has(i)){
                this.array[i] = this.map.get(i);
            } else {
                this.array[i] = false;
            }
            VisualBoard.updateSquare(i, this.array[i]);
        }

        const jsonData = JSON.stringify(this.array);

        //Send to GO WASM
    }

    //Receive changes to Board from WASM
    update(index, newValue){
        //Handle potential value type mismatch
        this.map.set(index, newValue);
        this.array[index] = newValue;
        VisualBoard.updateSquare(index, newValue);
    }
}

class Enemy extends BaseCharacter {
    constructor(){
        super();
        this.type = 'Enemy';
    }
}

class Terrain {
    constructor(){
        this.type = 'Terrain';
    }
}

const Tree = new Terrain();

class PlayerArea {
    constructor(){
        this.type = 'PlayerArea';
    }
}

const Enemy1 = new Enemy();

const testEncounter = new Encounter('test', new Map([
    [0, Enemy1],
    [1, Tree],
    [62, new PlayerArea()]
]));

// TO DO - Code to run WebWorkers
const Webworkers = {}