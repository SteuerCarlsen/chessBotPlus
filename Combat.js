class Combat {
    constructor(encounter, party){
        this.initEncounter = encounter;
        this.initParty = party;
    }
    
    initCombat(){
        VisualBoard.init(encounter.length);
        for (let i = 0; i < encounter.length; i++){
            VisualBoard.updateSquare(i, encounter[i]);
        }

        //TO DO - Pass the board to GO
    }
}

// TO DO - Code to run WebWorkers
const Webworkers = {}