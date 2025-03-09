package game

type BitBoard uint64

func (b *BitBoard) SetPiece(index uint8) {
	*b |= 1 << index
}

func (b *BitBoard) ClearPiece(index uint8) {
	*b &^= 1 << index
}

func (b *BitBoard) GetPiece(index uint8) bool {
	return *b&(1<<index) != 0
}

type Board struct {
	BoardArray         [64]Piece
	MoveBoard          BitBoard
	LOSBoard           BitBoard
	playerPieceIndexes []uint8
	aiPieceIndexes     []uint8
}

func (b *Board) Clone() Board {
	returnBoardArray := [64]Piece{}

	for i, piece := range b.BoardArray {
		returnBoardArray[i] = piece.Clone()
	}

	return Board{
		BoardArray:         returnBoardArray,
		MoveBoard:          b.MoveBoard,
		LOSBoard:           b.LOSBoard,
		playerPieceIndexes: b.playerPieceIndexes,
		aiPieceIndexes:     b.aiPieceIndexes,
	}
}

func (b *Board) InitBoard(boardArray [64]Piece) {
	b.BoardArray = boardArray
	b.MoveBoard = 0
	b.LOSBoard = 0
	b.playerPieceIndexes = []uint8{}
	b.aiPieceIndexes = []uint8{}
	for i, piece := range b.BoardArray {
		b.UpdateSquare(uint8(i), piece)
		if piece.PlayerControlled {
			b.playerPieceIndexes = append(b.playerPieceIndexes, uint8(i))
		} else if piece.AIControlled {
			b.aiPieceIndexes = append(b.aiPieceIndexes, uint8(i))
		}
	}
}

func (b *Board) SwitchPieces(index1, index2 uint8) {
	temp1 := b.BoardArray[index1]
	temp2 := b.BoardArray[index2]
	b.UpdateSquare(index1, temp2)
	b.UpdateSquare(index2, temp1)
}

func (b *Board) UpdateSquare(index uint8, piece Piece) {
	b.BoardArray[index] = piece
	if piece.BlocksMovement {
		b.MoveBoard.SetPiece(index)
	} else {
		b.MoveBoard.ClearPiece(index)
	}
	if piece.BlocksLOS {
		b.LOSBoard.SetPiece(index)
	} else {
		b.LOSBoard.ClearPiece(index)
	}
}

func (b *Board) CalculateLos(index, target uint8) bool {
	losLine := LOSLineMap[index][target]

	if losLine[0] == 254 || losLine[0] == 255 {
		return true
	}

	for _, square := range losLine {
		if b.LOSBoard.GetPiece(square) {
			return false
		}
	}

	return true
}

func (b *Board) CalculateRange(index uint8, rangeValue uint8, checkLos bool) []uint8 {
	ranges := make([]uint8, 0, 64)
	calculatedSquares := make([]uint8, 0, 64)
	queueIndexes := make([]uint8, 0, 64)
	queueRanges := make([]uint8, 0, 64)

	queueStart := uint8(0)
	queueEnd := uint8(0)

	queueIndexes[0] = index
	queueRanges[0] = rangeValue + 1

	for queueStart < queueEnd {
		currentIndex := queueIndexes[queueStart]
		currentRange := queueRanges[queueStart]
		queueStart++

		if currentRange < 1 {
			continue
		}

		for _, neighbor := range NeighborMap[currentIndex] {

			newRange := currentRange - 1

			if newRange > calculatedSquares[neighbor] {
				if (checkLos && b.CalculateLos(index, neighbor)) ||
					(!checkLos && !b.MoveBoard.GetPiece(neighbor)) {
					ranges = append(ranges, neighbor)
					calculatedSquares[neighbor] = newRange
					queueIndexes[queueEnd] = neighbor
					queueRanges[queueEnd] = newRange
					queueEnd++
				}
			}
		}
	}
	return ranges
}
