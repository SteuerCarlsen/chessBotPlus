// Map holding all items as they're created
const items = new Map();

// InventoryBag class used to handle all related methods
class InventoryBag {
    constructor(bagNumber, capacity = 64) {
        this.bagNumber = bagNumber;
        this.capacity = capacity;
        this.content = [];
    }

    // Add an item to the inventory and call method to show
    addItem(id) {
        if (this.content.length < this.capacity) {
            const item = this.getItemInfo(id);
            const bagPos = this.content.length;
            VisualInventory['I' + bagPos].updateInventory(item.image, 'test', this.bagNumber);
            this.content.push(id);
        }
    }

    getItemInfo(id) {
        return items.get(id);
    }

    // When item is clicked in inventory
    positionClick(position) {
        console.log(position);
        console.log('Clicked on ' + this.getItemInfo(this.content[position]).name);
    }
}

// Create the inventory
const inventory = {
    bag1: new InventoryBag(1)
};

// Overall Item-class to receive all components and hold general functions
class Item {
    constructor(vName, sName, description, components) {
        this.id = items.size;
        this.name = vName;
        this.description = description;
        this.image = 'Images/' + sName + '.png';
        for (const key in components) {
            this.addComponent(key, components[key]);
        }
        items.set(this.id, this);
    }

    addComponent(key, value) {
        const className = itemComponentMap[key];
        this[key] = new className(value);
    }

    hasComponent(key) {
        return this.hasOwnProperty(key);
    }

    getComponent(key) {
        return this?.[key];
    }
}

// Specific Item class for Equipment due to specific functions needed for equipment
class Equipment extends Item {
    constructor(vName, sName, description, components) {
        super(vName, sName, description, components);
        this.equipable = true;
    }
}

// Weapon component to hold all information and methods regarding weapons
class WeaponComp {
    constructor(type, minDamage, maxDamage) {
        this.type = type;
        this.minDamage = minDamage;
        this.maxDamage = maxDamage;
    }
}

class TwoHandComp {
    constructor() {}
}

class OneHandComp {
    constructor() {}
}

class MainHandComp {
    constructor() {}
}

class OffHandComp {
    constructor() {}
}

// Sellable component to hold all information and methods regarding selling the item
class SellableComp {
    constructor(value) {
        this.value = value;
    }

    sell() {
        console.log('Item sold for ' + this.value + ' Gold');
    }
}

// Map of components for dynamically creating new components when creating item/abilities/etc.
const itemComponentMap = {
    SellableComp,
    WeaponComp,
    TwoHandComp,
    OneHandComp,
    MainHandComp,
    OffHandComp
};

// All items are created below this line
// -----
const testItem = new Equipment('Test Item', 'TestItem', 'Just for testing', {
    SellableComp: 1,
    WeaponComp: ['Sword', 10, 20],
    TwoHandComp
});