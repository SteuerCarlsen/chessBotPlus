class VisualElement {
    constructor(id, position) {
        this.id = id;
        this.position = position;
    }

    updateValue(newValue, format) {
        if (format === undefined) {
            document.getElementById(this.id).innerHTML = newValue;
        } else if (format === '%') {
            document.getElementById(this.id).innerHTML = newValue * 100 + '%';
        }
    }

    addEventListener(event, func) {
        document.getElementById(this.id).addEventListener(event, func);
    }

    addClass(className) {
        document.getElementById(this.id).classList.add(className);
    }

    removeClass(className) {
        document.getElementById(this.id).classList.remove(className);
    }

    clearClass() {
        document.getElementById(this.id).className = '';
    }

    static click() {}
}

class VisualSquare extends VisualElement {
    constructor(id, position) {
        super(id, position);
    }

    click() {
        // Call GO logic
    }
}

const VisualBoard = {
    contents: {},

    init(size) {
        for (let i = 0; i < size; i++) {
            const localValue = i;
            this.contents['Square' + localValue] = new VisualSquare('Square' + localValue, localValue);
            this.contents['Square' + localValue].addEventListener('click', () => {
               this.click();
            });
        }
    },

    updateSquare(index, value) {
        this.contents['Square' + index].clearClass();
        this.contents['Square' + index].addClass('Square');

        if(value == false){
            this.contents['Square' + index].updateValue('');
            return
        }

        if (value instanceof Hero) {
            this.contents['Square' + index].addClass('PlayerPiece');
            this.contents['Square' + index].updateValue("😎");
            return;
        }

        if (value instanceof Enemy) {
            this.contents['Square' + index].addClass('EnemyPiece');
            this.contents['Square' + index].updateValue("💀");
            return;
        }

        if (value instanceof Terrain) {
            this.contents['Square' + index].addClass('Terrain');
            this.contents['Square' + index].updateValue("🌲🌲<br>🌲🌲");
            return;
        }

        if (value instanceof PlayerArea) {
            this.contents['Square' + index].addClass('Terrain');
            this.contents['Square' + index].updateValue("🌲🌲<br>🌲🌲");
            return;
        }

        this.contents['Square' + index].addClass('Range');
        this.contents['Square' + index].updateValue("🦶");
        return;
    }
};

// VisualInventory holds all visual elements and related methods
const VisualInventory = {
    contents: {},
    initiate() {
        for (let i = 0; i < 64; i++) {
            const localValue = i;
            this.contents['I' + localValue] = new VisualElement('Inventory' + localValue, localValue);
        }
    },

    updateInventory(newImg, tooltip, bag) {
        const img = `<img src='${newImg}' onclick='Inventory.Bag${bag}.positionClick(${this.position})'>`;
        document.getElementById(this.id).innerHTML = img;
    }
};

VisualInventory.initiate();

const VisualCombatLog = {
    parent: new VisualElement('combatLog'),

    update(log) {
        let shownContent = '';
        log.forEach((entry) => {
            shownContent += `<p>${entry}</p>`;
        });
        this.parent.updateValue(shownContent);
    }
};


// VisualSelectedPlayer holds shown information about the selected player character
const VisualSelectedPlayer = {
    name: new VisualElement('selectedPlayerName'),
    healthBar: new VisualElement('selectedPlayerHealthBar'),
    resourceBar: new VisualElement('selectedPlayerResourceBar'),
    statusEffects: new VisualElement('selectedPlayerStatusEffects')
};

// VisualSelectedEnemy holds shown information about the selected enemy character
const VisualSelectedEnemy = {
    name: new VisualElement('selectedEnemyName'),
    healthBar: new VisualElement('selectedEnemyHealthBar'),
    resourceBar: new VisualElement('selectedEnemyResourceBar'),
    statusEffects: new VisualElement('selectedEnemyStatusEffects')
};

// A class specifically for visual elements related to abilities
class VisualElementAbility extends VisualElement {
    constructor(id) {
        super(id);
    }

    onCooldown() {
        document.getElementById(this.id).classList.add('onCooldown');
    }

    offCooldown() {
        document.getElementById(this.id).classList.remove('onCooldown');
    }
}

// The ability bar
const VisualAbilityBar = {
    A0: new VisualElementAbility('Ability0'),
    A1: new VisualElementAbility('Ability1'),
    A2: new VisualElementAbility('Ability2'),
    A3: new VisualElementAbility('Ability3'),
    A4: new VisualElementAbility('Ability4'),
    A5: new VisualElementAbility('Ability5'),
    A6: new VisualElementAbility('Ability6'),
    A7: new VisualElementAbility('Ability7')
};

const CombatButtons = {
    startCombat: new VisualElement('startCombatButton'),
    endTurn: new VisualElement('endTurnButton'),
};

CombatButtons.startCombat.addEventListener('click', () => {
    if (!CurrentCombat.started) {
        return CurrentCombat.start();
    }
    return console.log('Combat already started');
});

CombatButtons.endTurn.addEventListener('click', () => {
    if (CurrentCombat.started) {
        if (CurrentCombat.currentPlayer === 'player') {
            return CurrentCombat.advanceTurn();
        }
        return console.log('Not your turn');
    }
    return console.log('Combat not started');
});

// A class specifically for menu elements
class VisualElementMenu extends VisualElement {
    constructor(id, pageId) {
        super(id);
        this.pageId = pageId;
    }

    activate() {
        VisualPages.forEach((element) => {
            if (element === this.pageId) {
                document.getElementById(element).classList.replace('Hidden', 'Visible');
            } else {
                document.getElementById(element).classList.replace('Visible', 'Hidden');
            }
        });
    }
}

// All menu/page elements
const VisualMenuBar = {
    story: new VisualElementMenu('storyButton', 'storyPage'),
    combat: new VisualElementMenu('combatButton', 'combatPage'),
    heroes: new VisualElementMenu('heroesButton', 'heroesPage'),
    inventory: new VisualElementMenu('inventoryButton', 'inventoryPage'),
    abilities: new VisualElementMenu('abilitiesButton', 'abilitiesPage'),
    town: new VisualElementMenu('townButton', 'townPage'),
    settings: new VisualElementMenu('settingsButton', 'settingsPage')
};

// All page names to hide/show pages
const VisualPages = ['storyPage', 'combatPage', 'heroesPage', 'inventoryPage', 'abilitiesPage', 'townPage', 'settingsPage'];