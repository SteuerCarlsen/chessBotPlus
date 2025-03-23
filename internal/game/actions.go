package game

type ActionType uint8

const (
	MoveType ActionType = iota
	AbilityType
)

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

type Ability struct {
	Name           string
	Range          uint8
	TargetSelf     bool
	TargetFriendly bool
	TargetEnemy    bool
	Components     []interface{}
}

func (a *Ability) Execute(state *State, index uint8, target uint8) {
}

// Components galore below
type PhysicalDamageComponent interface {
	CalculateDamage() int
}

type HitChanceComponent interface {
	CalculateHitChance() float32
}
