let AcitveEncounter = null;

class Encounter {
    constructor(map, size = 64){
        this.map = map;
        this.array = [];
        this.size = size;
    }

    init(){
        VisualBoard.init(this.size);

        for (i = 0; i < size; i++){
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

const testEncounter = new Encounter(new Map([
    [0, Enemy1],
    [1, Tree],
    [62, new PlayerArea()]
]));

AcitveEncounter = testEncounter;
AcitveEncounter.init();