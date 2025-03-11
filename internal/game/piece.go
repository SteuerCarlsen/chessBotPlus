package game

type PieceType uint8

const (
	TerrainPiece PieceType = iota
	PlayerPiece
	AIPiece
)

type Piece struct {
	Name       string
	Abilities  []Ability
	Index      uint8
	PieceType  PieceType
	BlocksLOS  bool
	BlocksMove bool
	MoveRange  uint8
	Stats      StatStruct
}

func (p Piece) Clone() Piece {
	return Piece{
		Name:       p.Name,
		Abilities:  p.Abilities,
		Index:      p.Index,
		PieceType:  p.PieceType,
		BlocksLOS:  p.BlocksLOS,
		BlocksMove: p.BlocksMove,
		MoveRange:  p.MoveRange,
		Stats:      p.Stats.clone(),
	}
}

func (p *Piece) GetValidMoves(board Board) []Action {
	validMoves := []Action{}
	validMoveIndexes := board.CalculateRange(p.Index, p.MoveRange, false)

	for _, index := range validMoveIndexes {
		validMoves = append(validMoves, Action{MoveType, p.Index, index, nil})
	}

	return validMoves
}

// Add more checks for if target is allowed (and potentially optimize for only Player/AIPiece)
func (p *Piece) GetValidAbilities(board Board) []Action {
	validAbilities := []Action{}

	for _, ability := range p.Abilities {
		validAbilityIndexes := board.CalculateRange(p.Index, ability.Range, true)

		for _, index := range validAbilityIndexes {
			validAbilities = append(validAbilities, Action{AbilityType, p.Index, index, &ability})
		}
	}

	return validAbilities
}

type Stat struct {
	initValue    int16
	currentValue int16
}

func (s *Stat) GetCurrentValue() int16 {
	return s.currentValue
}

type StatStruct struct {
	Health Stat
}

func (s StatStruct) clone() StatStruct {
	return StatStruct{
		Health: s.Health,
	}
}
