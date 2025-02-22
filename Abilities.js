// Overall Ability Class used to gather all components
class Ability {
    constructor(name, targetGroup = {selfTarget: false, friendlyTarget: false, opponentTarget: false}, components, range) {
        this.name = name;
        this.range = range;
        this.targetLookup = new Map([
            ['self', targetGroup.selfTarget],
            ['friendly', targetGroup.friendlyTarget],
            ['opponent', targetGroup.opponentTarget]
        ]);
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
        return board.calculateRange(index, this.range, true, true);
    }

    use(actor, target, isReal = true) {
        /*debugLog('Using ability', {
            actor: actor.name,
            target: target.name,
            ability: this.name,
            isReal
        });*/

        this.apply(actor, target, isReal);

    }

    canTarget(actor, target) {
        const type = actor === target ? 'self'
        : actor.objType === target.objType ? 'friendly'
        : 'opponent';
        
        /*debugLog('Checking if ability can target', {
            actor: actor.name,
            target: target.name,
            type
        });*/

        return this.targetLookup.get(type);
    }

    static apply() {}
}

// Ability Classes for abilities with same method needs (like a physical attack, a buff, etc.)
class PhysicalAbility extends Ability {
    constructor(name, components, range = 1) {
        super(name, {selfTarget: false, friendlyTarget: false, opponentTarget: true}, components, range);
    }
    // Use the ability given actor and target
    apply(actor, target, isReal = true) {
        if (this.hasComponent('PhysicalHitGuaranteedComp') || Math.random() <= this.PhysicalHitComp.hitChance) {
            target.resourceStats.health.reduce(this.PhysicalDamageComp.damage, isReal);

            if (!isReal) {return};

            combatLog.addEntry('ability', {
                piece: actor.name,
                ability: this.name,
                target: target.name,
                value: this.PhysicalDamageComp.damage
            });
        };
    };
}

class RangedAbility extends Ability {
    constructor(name, components, range = 3) {
        super(name, {selfTarget: false, friendlyTarget: false, opponentTarget: true}, components, range);
    }

    apply(actor, target, isReal = true) {
        if (Math.random() <= this.RangedHitComp.hitChance) {
            target.resourceStats.health.reduce(this.RangedDamageComp.damage, isReal);

            if (!isReal) {return};

            combatLog.addEntry('ability', {
                piece: actor.name,
                ability: this.name,
                target: target.name,
                value: this.RangedDamageComp.damage
            });
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

class RangedHitComp {
    constructor(baseValue) {
        this.hitChance = baseValue;
    }
}

class RangedDamageComp {
    constructor(baseValue) {
        this.damage = baseValue;
    }
}

// Map of components for dynamically creating new components when creating item/abilities/etc.
const abilityComponentMap = {
    PhysicalDamageComp: PhysicalDamageComp,
    PhysicalHitComp: PhysicalHitComp,
    PhysicalHitGuaranteedComp: PhysicalHitGuaranteedComp,
    RangedDamageComp: RangedDamageComp,
    RangedHitComp: RangedHitComp,
};

// Abilities
const WeaponAttack = new PhysicalAbility("Weapon Attack", {
    PhysicalDamageComp: 50,
    PhysicalHitComp: 0.5,
    PhysicalHitGuaranteedComp
});

const RangedWeaponAttack = new RangedAbility("Ranged Weapon Attack", {
    RangedDamageComp: 50,
    RangedHitComp: 0.5
});

// Map of abilities for dynamically creating new abilities when creating item/abilities/etc.
const AbilityMap = new Map(
    [
        ['WeaponAttack', WeaponAttack],
        ['RangedWeaponAttack', RangedWeaponAttack],
    ],
);