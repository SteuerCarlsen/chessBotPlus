// Settings for how Primary Stats affect Secondary/Ressource Stats as a factor
const Factor = {
    Agility: { dodgeChance: 0.005 },
    Stamina: { health: 10 },
    Wisdom: { mana: 10 },
    Dexterity: { meleeCriticalChance: 0.005 },
    Strength: { minMeleeDamage: 0.2, maxMeleeDamage: 0.4, minBlockValue: 0.1, maxBlockValue: 0.2 },
    meleeCriticalFactor: 2,
};

// Base class for Stats to make the same methods avaislable to all stats
class Stat {
    constructor(permanent, visualId, tempFlat = 0, tempPct = 0) {
        this.permanent = permanent;
        this.tempFlat = tempFlat;
        this.tempPct = tempPct;
        this.objType = 'stat';
    }

    // Return the total stat after all permanent and temporary bonuses have been applied
    getTotal() {
        const calculatedValue = (this.permanent + this.tempFlat) * (1 + this.tempPct);
        return calculatedValue;
    }

    static updateVisual() {}
}

class PrimaryStat extends Stat {
    constructor(baseValue, visualId, target) {
        super(baseValue, visualId);
        this.calculateStats(target);
    }

    calculateStats() {};

    // Positive number to increase and negative number to decrease
    alterPermanent(value, target) {
        this.permanent += value;
        this.calculateStats(target);
    }

    // Positive number to increase and negative number to decrease
    alterTempFlat(value, target) {
        this.tempFlat += value;
        this.calculateStats(target);
    }

    /* Positive number to increase and negative number to decrease. 
    To ease coding and readability percentages are written as whole numbers and not decimals */
    alterTempPct(value, target) {
        this.tempPct += value / 100;
        this.calculateStats(target);
    }

    // Method used in subclasses to calculate secondary and resource stat values whenever primary stat is updated
    static calculateStats() {}
}

class ChanceStat extends Stat {
    constructor(visualId) {
        super(0, visualId);
    }
}

class RangeStat extends Stat {
    constructor(visualId) {
        super(0, visualId);
    }
}

class FactorStat extends Stat {
    constructor(visualId, factor) {
        super(0, visualId);
        this.factor = factor;
    }
}

class FlatStat extends Stat {
    constructor(visualId) {
        super(0, visualId);
    }
}

class Strength extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'strength', target);
    }

    static calculateStats(target) {
        target.secondaryStats.minMeleeDamage.permanent = target.primaryStats.strength.getTotal() * Factor.Strength.minMeleeDamage;
        target.secondaryStats.maxMeleeDamage.permanent = target.primaryStats.strength.getTotal() * Factor.Strength.maxMeleeDamage;
        target.secondaryStats.minBlockValue.permanent = target.primaryStats.strength.getTotal() * Factor.Strength.minBlockValue;
        target.secondaryStats.maxBlockValue.permanent = target.primaryStats.strength.getTotal() * Factor.Strength.maxBlockValue;
    }
}

class Agility extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'agility', target);
    }

    static calculateStats(target) {
        target.secondaryStats.dodgeChance.permanent = target.primaryStats.agility.getTotal() * Factor.Agility.dodgeChance;
    }
}

class Stamina extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'stamina', target);
    }

    static calculateStats(target) {
        target.resourceStats.health.permanent = target.primaryStats.stamina.getTotal() * Factor.Stamina.health;
    }
}

class Intelligence extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'intelligence', target);
    }
}

class Wisdom extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'wisdom', target);
    }

    static calculateStats(target) {
        target.resourceStats.mana.permanent = target.primaryStats.wisdom.getTotal() * Factor.Wisdom.mana;
    }
}

class Dexterity extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'dexterity', target);
    }

    static calculateStats(target) {
        target.secondaryStats.meleeCriticalChance.permanent = target.primaryStats.dexterity.getTotal() * Factor.Dexterity.meleeCriticalChance;
    }
}

class Initiative extends PrimaryStat {
    constructor(baseValue, target) {
        super(baseValue, 'initiative', target);
    }
}

// Class for Secondary Stats
class SecondaryStat extends Stat {
    constructor(visualId) {
        super(0, visualId);
    }

    updateValue(value) {
        this.permanent = value;
    }
}

// Secondary Stats with Flat values
class FlatSecondaryStat extends SecondaryStat {
    constructor(visualId) {
        super(visualId);
    }
}

// Secondary Stats that apply a factor
class FactorSecondaryStat extends SecondaryStat {
    constructor(visualId, baseValue) {
        super(visualId);
        this.permanent = baseValue;
    }
}

// Secondary Stats that are chances of something happening
class ChanceSecondaryStat extends SecondaryStat {
    constructor(visualId) {
        super(visualId);
    }
}

// Secondary Stats that contain a range of min/max
class RangeSecondaryStat extends SecondaryStat {
    constructor(visualId) {
        super(visualId);
        this.permanentMin = 0;
        this.permanentMax = 1;
    }

    updateValue(value, factorMin, factorMax) {
        this.permanentMin += value * factorMin;
        this.permanentMax += value * factorMax;
    }

    getTotalMin() {
        const calculatedValue = Math.floor((this.permanentMin + this.tempFlat) * (1 + this.tempPct));
        return calculatedValue;
    }

    getTotalMax() {
        const calculatedValue = Math.floor((this.permanentMax + this.tempFlat) * (1 + this.tempPct));
        return calculatedValue;
    }
}

// Resource Stats that increase/decrease due to use/regain in combat
class ResourceStat extends Stat {
    constructor(visualId) {
        super(0, visualId);
        this.currentValue = 0;
    }

    updateValue(value) {
        this.permanent = value;
        this.currentValue = this.getTotal();
    }

    reduce(value, updateVisual = true) {
        this.currentValue -= value;
        if (this.currentValue <= 0) {
            this.zeroed();
        }
        /*if (updateVisual) {
            this.updateVisual();
        }*/
        return this.currentValue;
    }

    regain(value) {
        if (this.currentValue + value > this.getTotal()) {
            this.currentValue = this.getTotal();
        } else {
            this.currentValue += value;
        }
    }

    getCurrentValue() {
        return this.currentValue;
    }

    static zeroed() {
        debugLog('Resource stat zeroed', this);
    }

    static calculateStats() {}
}

// All Resource Stats
class HealthStat extends ResourceStat {
    constructor(value) {
        super('Health');
        this.currentValue = value;
    }

    zeroed() {}

    updateVisual(target) {
        this.visualId.innerHTML = this.value;
    }

    calculateStats(target) {
        target.resourceStats.health.permanent = target.primaryStats.stamina.getTotal() * Factor.Stamina.health;
    }
}

class ManaStat extends ResourceStat {
    constructor() {
        super('Mana');
    }
}