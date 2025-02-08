// Overall Ability Class used to gather all components
class Ability {
    constructor(components) {
        for (const key in components) {
            this.addComponent(key, components[key]);
        }
    }

    addComponent(key, value) {
        const className = abilityComponentMap[key];
        this[key] = new className(value);
    }

    hasComponent(key) {
        return this.hasOwnProperty(key);
    }

    getComponent(key) {
        return this?.[key];
    }

    static use() {}
}

// Ability Classes for abilities with same method needs (like a physical attack, a buff, etc.)
class PhysicalAbility extends Ability {
    constructor(components) {
        super(components);
    }

    use() {
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
});