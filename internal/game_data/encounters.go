package game_data

import game "github.com/steuercarlsen/chessDungeonCrawler/internal/game"

var Encounters = map[string]Encounter{
	"TestEncounter": {
		Name:        "TestEncounter",
		Description: "This is a test encounter",
		Board: map[int]struct{}{
			0: TestEnemy,
			1: Tree,
			2: PlayerArea{},
		},
	},
}

type Encounter struct {
	Name        string
	Description string
	Board       map[int]struct{}
}

func (e *Encounter) ExportEncounter() [64]game.Piece {
	exportArray := [64]game.Piece{}

	// Loop through the board data and create Pieces for each square
	for i := range exportArray {
		_, exists := e.Board[i]
		if !exists {
			exportArray[i] = game.Piece{Name: "Empty", PieceType: game.EmptyPiece}
			continue
		}
		// $TODO: Implement the rest of the piece types
	}

	return exportArray
}

type PlayerArea struct{}

type Enemy struct{}

var TestEnemy = Enemy{}
