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
