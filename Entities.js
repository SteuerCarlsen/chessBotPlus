// Overall Entity Class - Entities are any object/character/piece/etc. that can take a spot on the gameboard
class Entity {
    constructor(name, blocksLOS, blocksMovement) {   
        this.name = name;
        this.objType = 'Entity';
        this.blocksLOS = blocksLOS;
        this.blocksMovement = blocksMovement;
        this.playerControlled = false;
        this.enemyControlled = false;
        this.temp = {
            index: null,
        }
    }
}

class Terrain extends Entity {
    constructor() {
        super("Terrain", true, true);
        this.objType = 'Terrain';
    }
    select () {
        //console.log('Terrain selected');
    }
    init() {}
}

// Pieces are any player/enemy character that has stats
class Piece extends Entity {
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, true, true);
        this.title = title;
        this.abilities = abilities;
        this.passives = passives;
        this.status = {
            isWeaponEquipped: false,
            isShieldEquipped: false,
        };
        this.movementPoints = 3;
        this.range = 5;
        this.secondaryStats = {
            dodgeChance: new ChanceStat('DodgeChance'),
            parryChance: new ChanceStat('ParryChance'),
            blockChance: new ChanceStat('BlockChance'),
            blockValue: new RangeStat('BlockChance'),
            meleeCriticalChance: new ChanceStat('MeleeCriticalChance'),
            meleeCriticalFactor: new FactorStat('MeleeCriticalFactor', Factor.MeleeCriticalFactor),
            meleeDamage: new RangeStat('MeleeDamage'),
            armor: new FlatStat('Armor'),
        };
        this.ressourceStats = {
            health: new HealthStat(),
        };
        this.primaryStats = {
            strength: new Strength(primaryStats.strength, this),
            agility: new Agility(primaryStats.agility, this),
            stamina: new Stamina(primaryStats.stamina, this),
            intelligence: new Intelligence(primaryStats.intelligence, this),
            wisdom: new Wisdom(primaryStats.wisdom, this),
            dexterity: new Dexterity(primaryStats.dexterity, this),
            initiative: new Initiative(primaryStats.initiative, this),
        };
    }

    exportPiece() {
        return [this.name, this.title, 
            {
                strength: this.primaryStats.strength.permanent,
                agility: this.primaryStats.agility.permanent,
                stamina: this.primaryStats.stamina.permanent,
                intelligence: this.primaryStats.intelligence.permanent,
                wisdom: this.primaryStats.wisdom.permanent,
                dexterity: this.primaryStats.dexterity.permanent,
                initiative: this.primaryStats.initiative.permanent,
                }
            ]
    }

    select() {
        //console.log(this.name + ' selected');
        this.showMovementRange();
    }

    showMovementRange() {
        //console.log(this.temp.index + " " + this.movementPoints)
        Board.showRange(this.temp.index, this.movementPoints);
    }

    showRange() {
        Board.showRange(this.temp.index, this.range, true);
    }

    move(newIndex, board = Board, updateVisual = true){
        //console.log(`Moving ${this.name} to index ${newIndex}`);
        //console.log(board)
        board.switchPieces(this.temp.index, newIndex, updateVisual);
        this.temp.index = newIndex;
    }

    getMovementRange(board = Board) {
        //console.log(this.name + ": " + this.temp.index)
        //console.log(Board.getRangeMap(this.temp.index, this.movementPoints))
        return board.getRangeMap(this.temp.index, this.movementPoints)
    }
}

class PlayerPiece extends Piece {
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, title, primaryStats, abilities, passives);
        this.objType = 'PlayerPiece';
        this.playerControlled = true;
        this.temp.threat = 0;
    }
}

class EnemyPiece extends Piece {    
    constructor(name, title, primaryStats, abilities, passives) {
        super(name, title, primaryStats, abilities, passives);
        this.objType = 'EnemyPiece';
        this.enemyControlled = true;
    }
}