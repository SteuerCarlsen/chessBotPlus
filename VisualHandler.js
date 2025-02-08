// Visual Element Class used to encapsulate elements from HTML and add methods to change/update
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

    updateInventory(newImg, tooltip, bag) {
        const img = `<img src='${newImg}' onclick='Inventory.Bag${bag}.positionClick(${this.position})'>`;
        document.getElementById(this.id).innerHTML = img;
    }
}

// VisualBoard holds all visuals for the Board
const VisualBoard = {
    contents: {},
    initiate(size) {
        for (let i = 0; i < size; i++) {
            const localValue = i;
            this.contents['Square' + localValue] = new VisualElement('Square' + localValue, localValue);
        }
    },
    refresh() {
        Board.boardArray.forEach((value, index) => {
            this.updateSquare(index, value);
        });
    },
    updateSquare(index, value) {
        let content = `<div class='undefinedPiece' onclick='Board.selectSquare(${index})'>` + index + `</div>`;
        if (value != undefined && value.shortType != undefined) {
            content = `<div class='${value.shortType}Piece' onclick='Board.selectSquare(${index})'>` + index + `</div>`;
        } else if (value == "RG") {
            content = `<div class='Range' onclick='Board.selectSquare(${index})'>` + index + `</div>`;
        }
        this.contents['Square' + index].updateValue(content);
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
    }
};

VisualInventory.initiate();

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