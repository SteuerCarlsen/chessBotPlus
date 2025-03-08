use core::f32;
use std::{
    ops::{Add, Sub}, 
    rc::Rc,
    cell::RefCell,
};
use rand::Rng;
use crate::pieces::{Piece, Ability};
use crate::{BOARD_SIZE, NEIGHBOR_MAP, LOS_LINE_MAP};

#[derive(Clone, Copy)]
pub struct Vec2 {
    x: u8,
    y: u8,
}

impl Add for Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Sub for Vec2 {
    type Output = Vec2;

    fn sub(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

#[derive(Clone, PartialEq)]
pub enum Actor {
    AI,
    Player,
}

#[derive(Clone, PartialEq)]
pub enum ActionType {
    Move,
    Ability,
}

#[derive(Clone)]
pub struct Board {
    board: [Piece; BOARD_SIZE],
    simple_move_board: [bool; BOARD_SIZE],
    simple_los_board: [bool; BOARD_SIZE],
    player_piece_indexes: Vec<usize>,
    ai_piece_indexes: Vec<usize>,
}
impl Board {
    pub fn new(board: [Piece; BOARD_SIZE]) -> Self {   
        let mut simple_move_board:[bool; BOARD_SIZE] = [false; BOARD_SIZE];
        let mut simple_los_board: [bool; BOARD_SIZE] = [false; BOARD_SIZE];
        let mut player_piece_indexes = Vec::new();
        let mut ai_piece_indexes = Vec::new();

        for (index, piece) in board.iter().enumerate() {
            simple_move_board[index] = piece.blocks_movement;
            simple_los_board[index] = piece.blocks_los;

            if piece.player_controlled {
                player_piece_indexes.push(index);
            } else if piece.ai_controlled {
                ai_piece_indexes.push(index);
            }
        };

        Board {
            board,
            simple_move_board,
            simple_los_board,
            player_piece_indexes,
            ai_piece_indexes,
        }
    }

    pub fn switch_pieces(&mut self, index_1: usize, index_2: usize) {
        let piece_1 = self.board[index_1].clone();
        let piece_2 = self.board[index_2].clone();
        
        self.board[index_1] = piece_2;
        self.board[index_2] = piece_1;
        
        self.simple_move_board.swap(index_1, index_2);
        self.simple_los_board.swap(index_1, index_2);
    }

    fn calculate_los(&self, index: usize, target: usize) -> bool {
        if index == target {
            return false;
        }
    
        let los_line = match LOS_LINE_MAP[index as usize][target as usize] {
            None => return false,
            Some(line) => line,
        };
    
        // Iterate over the line using a regular for loop instead of range
        for square in los_line {
            if self.simple_los_board[*square] {
                return false;
            }
        }
    
        true
    }

    pub fn calculate_range(&self, index: usize, range: u8, check_los: bool, accept_targets: bool) -> Vec<usize> {
        let mut range_map: Vec<usize> = Vec::new();
        let mut range_map_index: usize = 0;
        let mut calculated_squares: Vec<u8> = Vec::new();
        let mut queue_indexes: Vec<usize> = Vec::new();
        let mut queue_ranges: Vec<u8> = Vec::new();

        let mut queue_start: usize = 0;
        let mut queue_end: usize = 1;

        queue_indexes[0] = index;
        queue_ranges[0] = range + 1;

        if accept_targets {
            range_map[range_map_index] = index;
            range_map_index += 1;
        }

        while queue_start < queue_end {
            let current_index = queue_indexes[queue_start];
            let current_range = queue_ranges[queue_start];
            queue_start += 1;

            if current_range < 1 {
                continue;
            }

            let neighbors = NEIGHBOR_MAP[current_index];
        
            for neighbor_opt in neighbors {
                if let Some(neighbor) = neighbor_opt {
                    let new_range = current_range - 1;

                    if new_range > calculated_squares[neighbor] as u8 {
                        if check_los {
                            if self.calculate_los(index, neighbor) {
                                if !self.simple_los_board[neighbor] {
                                    range_map[range_map_index] = neighbor;
                                    range_map_index += 1;
                                    calculated_squares[neighbor] = new_range;
                                    queue_indexes[queue_end] = neighbor;
                                    queue_ranges[queue_end] = new_range;
                                    queue_end += 1;
                                } else if accept_targets && (self.board[neighbor].player_controlled || self.board[neighbor].ai_controlled) {
                                    range_map[range_map_index] = neighbor;
                                    range_map_index += 1;
                                }
                            }
                        } else if !self.simple_move_board[neighbor] {
                            range_map[range_map_index] = neighbor;
                            range_map_index += 1;
                            calculated_squares[neighbor] = new_range;
                            queue_indexes[queue_end] = neighbor;
                            queue_ranges[queue_end] = new_range;
                            queue_end += 1;
                        }
                    }
                }
            }
        }

        range_map
    }
}

#[derive(Clone)]
pub struct State {
    current_turn: Actor,
    current_turn_type: u8,
    actor_order: [Actor; 2],
    turn: u16,
    last_action: Option<Action>,
    board: Board,
}
impl State {
    pub fn new(current_turn: Actor, board: Board) -> Self {
        State {
            current_turn,
            current_turn_type: 0,
            actor_order: [Actor::Player, Actor::AI],
            turn: 0,
            last_action: None,
            board,
        }
    }

    pub fn advance_turn(&mut self) {
        self.current_turn_type +=1;
        if self.current_turn_type == 1 {
            self.turn_start();
        } else if self.current_turn_type == 2 {
            self.turn_action();
        } else if self.current_turn_type == 3 {
            self.current_turn_type = 0;
            let terminal = self.is_terminal();
            if terminal.0 || terminal.1 {
                self.game_end();
            }
            self.turn_end();
        };
    }

    fn turn_start(&mut self) {
        self.advance_turn();
    }

    fn turn_action(&mut self) {
        self.advance_turn();
    }

    fn turn_end(&mut self) {
        if self.current_turn == Actor::Player {
            self.current_turn = Actor::AI;
        } else {
            self.current_turn = Actor::Player;
        }
        self.advance_turn();
    }

    fn game_end(&mut self) {}

    fn is_terminal(&mut self) -> (bool, bool){
        (self.check_win_condition(Actor::AI), self.check_win_condition(Actor::Player))
    }

    pub fn check_win_condition(&self, actor: Actor) -> bool {
        let mut total_health: i16 = 0;
        if actor == Actor::AI {
            for index in self.board.player_piece_indexes.iter() {
                total_health += self.board.board[*index].health.get_current_value();
                if total_health > 0 {
                    return false
                }
            } return true
        } else if actor == Actor::Player {
            for index in self.board.ai_piece_indexes.iter() {
                total_health += self.board.board[*index].health.get_current_value();
                if total_health > 0 {
                    return false
                }
            } return true
        } false
    }

    pub fn get_possible_actions(&self) -> Vec<Action> {
        let mut all_actions: Vec<Action> = Vec::new();
        let mut all_moves: Vec<Action> = Vec::new();
        let mut all_abilities: Vec<Action> = Vec::new();
        let mut action_count: usize = 0;

        let piece_indexes = match self.current_turn {
            Actor::Player => &self.board.player_piece_indexes,
            Actor::AI => &self.board.ai_piece_indexes,
        };

        let pieces = piece_indexes.iter().map(|index| &self.board.board[*index]);

        for piece in pieces {
            let moves: Vec<Action> = piece.get_valid_moves(&self.board);
            if moves.len() > 0 {
                for action in moves {
                    all_moves[action_count] = action.clone();
                    all_actions[action_count] = action.clone();
                    action_count += 1;
                }
            }

            let abilities = &piece.abilities;
            let piece_index: usize = piece.index;
            if abilities.len() > 0{
                for ability in abilities {
                    let valid_ability_actions = ability.get_valid_actions(piece_index, &self.board);
                    if valid_ability_actions.len() > 0 {
                        for action in valid_ability_actions {
                            all_abilities[action_count] = action.clone();
                            all_actions[action_count] = action.clone();
                            action_count += 1;
                        }
                    }
                }
            }
        }
        all_actions
    }

    fn play(&mut self, action: Action) {
        action.play(self);
        self.last_action = Some(action);
        self.advance_turn();
    }

    fn get_last_action(&self) -> &Option<Action> {
        &self.last_action
    }
}

#[derive(Clone)]
pub struct Action{
    action_type: ActionType,
    start: usize,
    end: usize,
    ability: Option<Ability>,
}
impl Action {
    pub fn new(action_type: ActionType, start: usize, end: usize, ability: Option<Ability>) -> Self {
        Action {
            action_type,
            start,
            end,
            ability,
        }
    }

    pub fn play(&self, state: &mut State) {
        if self.action_type == ActionType::Move {
            state.board.switch_pieces(self.start, self.end);
        } else if self.action_type == ActionType::Ability {
            if let Some(ability) = &self.ability {
                ability.play(state, self.start, self.end);
            }
        }
    }
}

#[derive(Clone)]
pub struct TreeNode {
    state: State,
    parent: Option<Rc<RefCell<TreeNode>>>,
    children: Option<Vec<TreeNode>>,
    wins: u16,
    visits: u16,
    turns: u16,
    untried_actions: Option<Box<[Action]>>,
    exploration_constant: f32,
}
impl TreeNode {
    pub fn new(state: State, exploration_constant: f32) -> Self {
        TreeNode {
            state,
            parent: None,
            children: None,
            wins: 0,
            visits: 0,
            turns: 0,
            untried_actions: None,
            exploration_constant,
        }
    }

    pub fn select_child(&self) -> Option<&TreeNode> {
        if let Some(children) = &self.children {

            let mut best_uct = f32::NEG_INFINITY;
            let mut best_child = None;

            for child in children.iter() {
                let exploitation = child.wins as f32 / child.visits as f32;
                let exploration = self.exploration_constant * ((self.visits as f32).ln() / child.visits as f32).sqrt();
                let uct = exploitation + exploration;

                if uct > best_uct {
                    best_uct = uct;
                    best_child = Some(child);
                }
            }

            return best_child
        }
        None
    }

    pub fn expand(mut self) -> Option<TreeNode> {
        let untried_actions_length: usize = self.untried_actions.as_ref().map_or(0, |actions| actions.len());
        if untried_actions_length == 0 {
            return None;
        }

        let action_index: usize = rand::thread_rng().gen_range(0..untried_actions_length);
        let action: Action = {
            let actions = self.untried_actions.as_mut().unwrap();
            let boxed_slice = std::mem::replace(actions, Box::new([]));
            let mut vec = boxed_slice.to_vec();
            let action = vec.remove(action_index);
            *actions = vec.into_boxed_slice();
            action
        };

        let mut next_state: State = self.state.clone();
        next_state.play(action);

        let child = TreeNode::new(next_state, self.exploration_constant);
 
        if self.children.is_none() {
            self.children = Some(Vec::new());
        }
        
        if let Some(children) = &mut self.children {
            children.push(child.clone());
        }
    
        Some(child)
    }

    pub fn simulate(self, max_depth: u16) -> (u16, u16) {
        let mut current_state = self.state.clone();
        let mut depth: u16 = 0;

        let terminal = current_state.is_terminal();

        if terminal.0 {
            return (1, depth);
        }
        
        if terminal.1 {
            return (0, depth);
        }

        while depth < max_depth {
            let possible_actions = current_state.get_possible_actions();

            if possible_actions.len() == 0 {
                let terminal = current_state.is_terminal();
                if terminal.0 {
                    return (1, depth);
                }
                
                if terminal.1 {
                    return (0, depth);
                }
            }

            let random_action = possible_actions[rand::thread_rng().gen_range(0..possible_actions.len())].clone();
            current_state.play(random_action);
            let terminal = current_state.is_terminal();

            if terminal.0 {
                return (1, depth);
            }
            if terminal.1 {
                return (0, depth);
            }

            depth += 1;
        }

        (0, depth)
    }

    pub fn backpropagate(self, result: (u16, u16)) {
        let mut current = Some(self);
        
        while let Some(mut node) = current {
            node.visits += 1;
            node.wins += result.0;
            node.turns += result.1;
            
            current = match node.parent {
                Some(parent) => Some(parent.borrow_mut().clone()),
                None => None
            };
        }
    }

    pub fn is_fully_expanded(self) -> bool {
        let untried_actions_length: usize = self.untried_actions.as_ref().map_or(0, |actions| actions.len());
        untried_actions_length == 0
    }

    pub fn is_terminal(&mut self) -> (bool, bool) {
        let terminal = self.state.is_terminal();
        (terminal.0, terminal.1)
    }
}

#[derive(Clone)]
pub struct MonteCarloTreeSearch {
    exploration_constant: f32,
    time_limit: u16,
    max_depth: u16,
    iteration_goal: u16,
    initial_board: Board,
    initial_player: Actor,
    initial_state: State,
}
impl MonteCarloTreeSearch {
    pub fn new (initial_board: Board, initial_player: Actor, initial_state: State) -> Self {
        MonteCarloTreeSearch {
            exploration_constant: 1.41,
            time_limit: 1000,
            max_depth: 500,
            iteration_goal: 20000,
            initial_board,
            initial_player,
            initial_state,
        }
    }
}