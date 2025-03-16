package game

import (
	"math"
	"math/rand"
)

const ExplorationConstant = 1.41421356237

type TreeNode struct {
	State          State
	parent         *TreeNode
	children       []*TreeNode
	wins           uint16
	visits         uint16
	turns          uint16
	untriedActions []Action
}

func (n *TreeNode) Init() *TreeNode {
	n.untriedActions = n.State.GetPossibleActions()
	return n
}

func (n *TreeNode) SelectCild() *TreeNode {
	var bestUCT float64 = -1
	var bestChild *TreeNode

	for _, child := range n.children {
		exploitation := float64(child.wins) / float64(child.visits)
		exploration := ExplorationConstant * (math.Log(float64(child.visits)) / float64(n.visits))
		uct := exploitation + exploration

		if uct > bestUCT {
			bestUCT = uct
			bestChild = child
		}
	}

	return bestChild
}

func (n *TreeNode) expand() *TreeNode {
	if len(n.untriedActions) < 1 {
		return nil
	}

	actionIndex := rand.Intn(len(n.untriedActions))
	action := n.untriedActions[actionIndex]

	nextState := n.State.Clone()
	nextState.ExecuteAction(action)

	childNode := &TreeNode{
		State:  nextState,
		parent: n,
	}

	n.children = append(n.children, childNode)

	return childNode.Init()
}

func (n *TreeNode) simulate(maxDepth uint16) (float32, uint16) {
	state := n.State
	depth := uint16(0)

	for depth < maxDepth {
		aiWin, playerWin := state.IsTerminal()

		switch {
		case aiWin:
			return 1, depth
		case playerWin:
			return 0, depth
		}

		actions := state.GetPossibleActions()
		action := actions[rand.Intn(len(actions))]

		state.ExecuteAction(action)
		depth++
	}

	return 0, depth
}

func (n *TreeNode) Backpropagate(result float32, depth uint16) {
	current := n

	for current != nil {
		current.visits++
		current.wins += uint16(result)
		current.turns += depth
		current = current.parent
	}
}

func (n *TreeNode) IsFullyExpanded() bool {
	return len(n.untriedActions) == 0
}

func (n *TreeNode) IsTerminal() (bool, bool) {
	return n.State.IsTerminal()
}

type ActionStats struct {
	Action Action
	Wins   uint16
	Visits uint32
	Turns  uint16
}

type SearchMetadata struct {
	Iterations         uint32
	BestScore          float64
	BestActionAvgTurns float64
}

type MCTS struct {
	initialBoard  Board
	initialActor  Actor
	initialState  State
	timeLimit     uint16
	iterationGoal uint16
	maxDepth      uint16
}

func (m *MCTS) Search() *Action {
	var results [][]ActionStats
	// Passs to js to run webworkers and return results
	return m.BestAction(results)
}

func (m *MCTS) BestAction(results [][]ActionStats) *Action {
	var (
		bestAction *Action
		//bestScore          = math.Inf(-1)
		//bestActionAvgTurns = math.Inf(1)
		bestFastWin     = math.Inf(1)
		totalIterations uint32
	)

	for _, result := range results {
		if len(result) == 0 {
			continue
		}

		for _, stats := range result {
			if stats.Visits == 0 {
				continue
			}

			score := float64(stats.Wins) / float64(stats.Visits)
			avgTurns := float64(stats.Turns) / float64(stats.Visits)
			fastWin := avgTurns / score

			if fastWin < bestFastWin {
				bestAction = &stats.Action
				//bestScore = score
				bestFastWin = fastWin
				//bestActionAvgTurns = avgTurns
			}

			totalIterations += stats.Visits
		}
	}

	/* Pass to console
	&SearchMetadata{
		Iterations:         totalIterations,
		BestScore:          bestScore,
		BestActionAvgTurns: bestActionAvgTurns,
	}*/

	return bestAction
}
