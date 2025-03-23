package game

import "math"

type PieceType uint8

const (
	TerrainPiece PieceType = iota
	PlayerPiece
	EnemyPiece
	EmptyPiece
	PlayerAreaPiece
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

type StatType uint8

const (
	FlatStat StatType = iota
	PercentStat
	HealthStat
)

type Stat struct {
	Type         StatType
	Base         float64
	FlatBonus    float64
	PercentBonus float64
	Total        float64
}

func (s *Stat) CalculateTotal() {
	preCalced := s.Base*(1+s.PercentBonus) + s.FlatBonus
	switch s.Type {
	case FlatStat:
		s.Total = preCalced
	case PercentStat:
		s.Total = math.Round(preCalced)
	case HealthStat:
		s.Total = math.Max(0, preCalced)
		//Call some kind of piece death function
	}
}

func (s *Stat) AddFlatBonus(amount float64) {
	s.FlatBonus += amount
	s.CalculateTotal()
}

func (s *Stat) AddPercentBonus(amount float64) {
	s.PercentBonus += amount
	s.CalculateTotal()
}

type StatStruct struct {
	Health Stat
}

func (s StatStruct) clone() StatStruct {
	return StatStruct{
		Health: s.Health,
	}
}
