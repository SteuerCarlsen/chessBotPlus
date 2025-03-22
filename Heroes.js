const maxPartySize = 3;

class BaseCharacter {
    constructor(id){
        this.id = id;
        heroes.set(this.id, this);
    }
}

class Hero extends BaseCharacter {}

let heroes = new Map();

function selectHero(id) {
    if(selectedParty.size >= maxPartySize){
        console.log("Party is full");
        return;
    }
    let selectedHero = heroes.get(id);
    selectedParty.set(selectedHero.id, selectedHero);
    console.log("Selected hero: " + selectedHero.id);
}

function deselectHero(id) {
    selectedParty.delete(id);
    console.log("Deselected hero: " + id);
}

let testHero = new Hero('testHero');