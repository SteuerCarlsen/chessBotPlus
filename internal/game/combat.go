package game

type ActionType uint8

const (
	MoveType ActionType = iota
	AbilityType
)

type Actor uint8

const (
	PlayerActor Actor = iota
	AIActor
)

type State struct {
	CurrentActor    Actor
	currentTurnType uint8
	turn            uint16
	LastAction      Action
	Board           Board
}

func (s *State) Clone() State {
	return State{
		CurrentActor:    s.CurrentActor,
		currentTurnType: s.currentTurnType,
		turn:            s.turn,
		LastAction:      s.LastAction,
		Board:           s.Board.Clone(),
	}
}

func (s *State) AdvanceTurn() {
	s.currentTurnType++

	switch s.currentTurnType {
	case 1:
		s.turn++
		s.TurnStart()
	case 2:
		s.TurnAction()
	case 3:
		s.currentTurnType = 0
		playerWin, aiWin := s.IsTerminal()
		if playerWin || aiWin {
			s.GameEnd()
		}
		s.TurnEnd()
	}
}

func (s *State) TurnStart() {
	s.AdvanceTurn()
}

func (s *State) TurnAction() {
	s.AdvanceTurn()
}

func (s *State) TurnEnd() {
	if s.CurrentActor == PlayerActor {
		s.CurrentActor = AIActor
	} else {
		s.CurrentActor = PlayerActor
	}
	s.AdvanceTurn()
}

func (s *State) GameEnd() {
	// TODO
}

func (s *State) IsTerminal() (bool, bool) {
	return s.CheckWinCondition(AIActor), s.CheckWinCondition(PlayerActor)
}

// Checks if any pieces are left - remember to remove pieces from array when they die
func (s *State) CheckWinCondition(actor Actor) bool {
	if actor == PlayerActor {
		return len(s.Board.aiPieceIndexes) == 0
	} else {
		return len(s.Board.playerPieceIndexes) == 0
	}
}

func (s *State) GetPossibleActions() []Action {
	allActions := make([]Action, 0, 64)

	var pieceIndexes []uint8
	if s.CurrentActor == PlayerActor {
		pieceIndexes = s.Board.playerPieceIndexes
	} else {
		pieceIndexes = s.Board.aiPieceIndexes
	}

	for _, idx := range pieceIndexes {
		piece := s.Board.BoardArray[idx]

		moves := piece.GetValidMoves(s.Board)
		allActions = append(allActions, moves...)

		if len(piece.Abilities) > 0 {
			abilities := piece.GetValidAbilities(s.Board)
			allActions = append(allActions, abilities...)
		}
	}

	return allActions
}

func (s *State) ExecuteAction(action Action) {
	action.Execute(s)
	s.LastAction = action
	s.AdvanceTurn()
}

func (s *State) GetLastAction() Action {
	return s.LastAction
}

type Action struct {
	ActionType ActionType
	Index      uint8
	Target     uint8
	Ability    *Ability
}

func (a *Action) Execute(state *State) {
	if a.ActionType == MoveType {
		state.Board.SwitchPieces(a.Index, a.Target)
	} else if a.ActionType == AbilityType && a.Ability != nil {
		a.Ability.Execute(state, a.Index, a.Target)
	}
}

type Ability struct{}
