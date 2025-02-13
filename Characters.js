//Character class to hold information about characters outside the combat
class Character {
  constructor(name, title) {
    this.name = name;
    this.title = title;
  }
}

// Specific class for player characters to hold information like equipment, abilities, etc.
class PlayerCharacter extends Character {
  constructor(name, title) {
    super(name, title);
  }

  // Export the player character to a player piece for combat
  exportToCombat() {
    return new PlayerPiece(this.name, this.title)
  }

  calculateStats() {}
}

// Specific class for enemy encounters to hold information like abilities, pieces, AI, etc.
class EnemyEncounter extends Character {
  constructor(name, title, AI, board) {
    super(name, title);
    this.AI = AI;
    this.board = board;
  }

  initiate() {
    return new EnemyPiece(this.name, this.title)
  }
}

const Boss1 = new EnemyEncounter('Boss1', 'The First Boss', "monteCarlo", new Array(64));