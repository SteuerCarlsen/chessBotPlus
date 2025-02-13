// Overall Ability Class used to gather all components
class Ability {
    constructor(components, range) {
        this.range = range;
        for (const key in components) {
            this.addComponent(key, components[key]);
        }
    }
    // Add a component to the ability
    addComponent(key, value) {
        const className = abilityComponentMap[key];
        this[key] = new className(value);
    }
    // Check if the ability has a given component
    hasComponent(key) {
        return this.hasOwnProperty(key);
    }
    // Get a component from the ability
    getComponent(key) {
        return this?.[key];
    }
    // Get the range of the ability
    getRange(index, board = Board) {
        return board.getRangeMap(index, this.range, true);
    }
    // Use the ability - Should be overwritten by child classes
    static use() {}
}

// Ability Classes for abilities with same method needs (like a physical attack, a buff, etc.)
class PhysicalAbility extends Ability {
    constructor(components, range) {
        super(components, range);
    }
    // Use the ability given actor and target
    use(actor, target) {
        if (this.hasComponent('PhysicalHitGuaranteedComp') || Math.random() <= this.physicalHitComp.hitChance) {
            console.log('Hit for ' + this.physicalDamageComp.damage);
        }
    }
}

// Components galore
class PhysicalDamageComp {
    constructor(baseValue) {
        this.damage = baseValue;
    }
}

class PhysicalHitComp {
    constructor(baseValue) {
        this.hitChance = baseValue;
    }
}

class PhysicalHitGuaranteedComp {
    constructor() {}
}

// Map of components for dynamically creating new components when creating item/abilities/etc.
const abilityComponentMap = {
    PhysicalDamageComp: PhysicalDamageComp,
    PhysicalHitComp: PhysicalHitComp,
    PhysicalHitGuaranteedComp: PhysicalHitGuaranteedComp,
};

// Abilities
const weaponHit = new PhysicalAbility({
    PhysicalDamageComp: 10,
    PhysicalHitComp: 0.5,
    PhysicalHitGuaranteedComp
}, 1);