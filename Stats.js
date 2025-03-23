class Stat {
    constructor(type, base, flatBonus, percentBonus) {
        switch(type) {
            case 'FlatStat': this.type = 'FlatStat'; break;
            case 'PercentStat': this.type = 'PercentStat'; break;
            case 'HealthStat': this.type = 'HealthStat'; break;
        }
        this.base = base;
        this.flatBonus = flatBonus;
        this.percentBonus = percentBonus;
        this.total = 0;
        this.calulateTotal();
    }
    calulateTotal() {
        let preCalced = this.base * (1 + this.percentBonus) + this.flatBonus;
        if (this.type == "FlatStat") {
            this.total = preCalced;
        } else {
            this.total = Math.round(preCalced);
        }
    }
    addFlatBonus(bonus) {
        this.flatBonus += bonus;
        this.calulateTotal();
    }
    addPercentBonus(bonus) {
        this.percentBonus += bonus;
        this.calulateTotal();
    }
}

class StatStruct {
    constructor(
        health
    ) {
        this.health = new Stat('HealthStat', health[0], health[1], health[2]);
    }
}