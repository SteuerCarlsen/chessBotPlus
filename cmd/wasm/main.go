//go:build js && wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/steuercarlsen/chessDungeonCrawler/internal/game"
)

var (
	gameState *game.State
)

// Process the board data from JavaScript
func ProcessBoard(this js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return "No board data provided"
	}

	// Get the JSON string from JavaScript
	jsonData := args[0].String()

	var board []interface{}
	if err := json.Unmarshal([]byte(jsonData), &board); err != nil {
		return "Error parsing JSON: " + err.Error()
	}

	var returnBoardArray [64]game.Piece

	for i, piece := range board {
		if piece == false {
			returnBoardArray[i] = game.Piece{Name: "Empty", PieceType: game.EmptyPiece}
			continue
		}
		if pieceMap, ok := piece.(map[string]interface{}); ok {
			pieceType := pieceMap["type"].(string)
			switch pieceType {
			case "Enemy":
				statMap := pieceMap["stats"].(map[string]interface{})
				healthStats := statMap["health"].(map[string]interface{})
				stats := game.StatStruct{
					Health: game.Stat{Type: game.HealthStat, Base: healthStats["base"].(float64), FlatBonus: healthStats["flatBonus"].(float64), PercentBonus: healthStats["percentBonus"].(float64)},
				}
				returnBoardArray[i] = game.Piece{Name: "Enemy", PieceType: game.EnemyPiece, Stats: stats}
			case "Terrain":
				returnBoardArray[i] = game.Piece{Name: "Terrain", PieceType: game.TerrainPiece}
			case "PlayerArea":
				returnBoardArray[i] = game.Piece{Name: "PlayerArea", PieceType: game.PlayerAreaPiece}
			}
		}
	}

	game.ActiveGame.Board.InitBoard(returnBoardArray)

	fmt.Printf("Board data: %v\n", board)

	return "Succes"
}

func GetSquare(this js.Value, args []js.Value) interface{} {
	piece := &game.ActiveGame.Board.BoardArray[args[0].Int()]
	activeGameState := game.ActiveGame.GameState

	switch activeGameState {
	case game.SetupCombat:
		if piece.PieceType == game.PlayerAreaPiece {
			return "PlayerArea"
		}
		return "You can only select PlayerArea"
	case game.InCombat:
		if piece.PieceType == game.EnemyPiece {
			if game.SelectedPiece != nil {
				return "Action chosen against Enemy"
			}
			return "You can't select the Enemy"
		}
		if piece.PieceType == game.PlayerPiece {
			game.SelectedPiece = piece
			return "PlayerPiece selected"
		}
	}
	return "Invalid state"
}

func main() {
	// Register functions to be called from JavaScript
	js.Global().Set("processBoard", js.FuncOf(ProcessBoard))
	js.Global().Set("getSquare", js.FuncOf(GetSquare))

	// Keep the program running
	c := make(chan struct{}, 0)
	<-c
}
