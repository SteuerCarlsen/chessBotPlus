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

type MonteCarloTreeSearch struct {
	timeLimit     uint16
	maxDepth      uint16
	iterationGaol uint16
	initialBoard  Board
	initialActor  Actor
	initialState  State
}
