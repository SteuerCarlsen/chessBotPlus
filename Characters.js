class Character {
  constructor(name, title) {
    this.name = name;
    this.title = title;
  }
}

class PlayerCharacter extends Character {
  constructor(name, title) {
    super(name, title);
  }

  exportToCombat() {
    return new PlayerPiece(this.name, this.title)
  }

  calculateStats() {}
}

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