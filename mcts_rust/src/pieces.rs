use crate::combat::{Action, ActionType, Board, State};

#[derive(Clone)]
pub struct PieceData {
    pub name: String,
    pub index: usize,
    pub blocks_movement: bool,
    pub blocks_los: bool,
    pub player_controlled: bool,
    pub ai_controlled: bool,
    pub movement_range: u8,
    pub health: Stat,
    pub abilities: Vec<Ability>,
}

#[derive(Clone)]
pub struct Piece {
    pub blocks_movement: bool,
    pub blocks_los: bool,
    pub player_controlled: bool,
    pub ai_controlled: bool,
    pub index: usize,
    pub movement_range: u8,
    pub health: Stat,
    pub abilities: Vec<Ability>,
}
impl Piece {
    pub fn new(piece_values: PieceData) -> Self {
        Piece {
            index: piece_values.index,
            blocks_movement: piece_values.blocks_movement,
            blocks_los: piece_values.blocks_los,
            player_controlled: piece_values.player_controlled,
            ai_controlled: piece_values.ai_controlled,
            movement_range: piece_values.movement_range,
            health: piece_values.health,
            abilities: piece_values.abilities,
        }
    }

    pub fn get_valid_moves(&self, board: &Board) -> Vec<Action> {
        let mut valid_moves: Vec<Action> = Vec::new();
        let valid_move_indexes = board.calculate_range(self.index, self.movement_range, false, false);
        
        for move_index in valid_move_indexes {
            valid_moves.push(Action::new(ActionType::Move, self.index, move_index, None));
        }

        valid_moves
    }
}

#[derive(Clone)]
pub struct Stat {
    init_value: i16,
    current_value: i16,
}
impl Stat {
    pub fn new(init_value: i16) -> Self {
        Stat {
            init_value,
            current_value: init_value,
        }
    }
    pub fn get_current_value(&self) -> i16 {
        self.current_value
    }
}

#[derive(Clone)]
pub struct Ability {}
impl Ability {
    pub fn new() -> Self {
        Ability {}
    }

    pub fn get_valid_actions(&self, caster_index: usize, board: &Board) -> Vec<Action>{

    }

    pub fn play(&self, state: &mut State, start: usize, target: usize) {
    }
}
