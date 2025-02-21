// Overall Ability Class used to gather all components
class Ability {
    constructor(name, targetGroup = {selfTarget: false, friendlyTarget: false, opponentTarget: false}, components, range) {
        this.name = name;
        this.range = range;
        this.selfTarget = targetGroup.selfTarget;
        this.friendlyTarget = targetGroup.friendlyTarget;
        this.opponentTarget = targetGroup.opponentTarget;
        this.targetLookup = new Map([
            ['self', this.selfTarget],
            ['friendly', this.friendlyTarget],
            ['opponent', this.opponentTarget]
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
        if(!isReal) {
            this.apply(actor, target);
        } else {
            this.apply(actor, target, isReal);
        }
        //debugLog('Returning from use')
    }

    canTarget(actor, target) {
        const type = actor === target ? 'self'
        : actor.objType === target.objType ? 'friendly'
        : 'opponent';
        
        return this.targetLookup.get(type);
    }

    static apply() {}
}

// Ability Classes for abilities with same method needs (like a physical attack, a buff, etc.)
class PhysicalAbility extends Ability {
    constructor(name, targetGroup, components, range) {
        super(name, targetGroup, components, range);
    }
    // Use the ability given actor and target
    apply(actor, target, isReal = true) {
        /*debugLog('Applying physical ability', {
            actor: actor.name,
            target: target.name,
            damage: this.PhysicalDamageComp?.damage
        });*/
        if (this.hasComponent('PhysicalHitGuaranteedComp') || Math.random() <= this.PhysicalHitComp.hitChance) {
            const damage = this.PhysicalDamageComp.damage;
            const beforeHealth = target.resourceStats.health.getCurrentValue();
            target.resourceStats.health.reduce(damage, isReal);
            const afterHealth = target.resourceStats.health.getCurrentValue();

            /*debugLog('Damage applied', {
                damage,
                beforeHealth,
                afterHealth,
            });*/
        }
        //debugLog('Returning from apply')
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
const WeaponAttack = new PhysicalAbility("Weapon Attack", {opponentTarget: true}, {
    PhysicalDamageComp: 10,
    PhysicalHitComp: 0.5,
    PhysicalHitGuaranteedComp
}, 1);

// Map of abilities for dynamically creating new abilities when creating item/abilities/etc.
const AbilityMap = new Map(
    [
        ['WeaponAttack', WeaponAttack],
    ],
);