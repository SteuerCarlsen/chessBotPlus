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

type JSONPiece struct {
	//TODO - Match to the values passed from JS
}

type JSONBoard struct {
	Squares []JSONPiece
}

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
		fmt.Printf("Piece: %v\n", piece)
		if piece == false {
			returnBoardArray[i] = game.Piece{Name: "Empty", PieceType: game.EmptyPiece}
			continue
		}
		if pieceMap, ok := piece.(map[string]interface{}); ok {
			pieceType := pieceMap["type"].(string)
			switch pieceType {
			case "Enemy":
				returnBoardArray[i] = game.Piece{Name: "Enemy", PieceType: game.EnemyPiece}
			case "Terrain":
				returnBoardArray[i] = game.Piece{Name: "Terrain", PieceType: game.TerrainPiece}
			case "PlayerArea":
				returnBoardArray[i] = game.Piece{Name: "PlayerArea", PieceType: game.PlayerAreaPiece}
			}
		}
	}

	game.CurrentBoard.InitBoard(returnBoardArray)

	return "Succes"
}

func main() {
	// Register functions to be called from JavaScript
	js.Global().Set("processBoard", js.FuncOf(ProcessBoard))

	// Keep the program running
	c := make(chan struct{}, 0)
	<-c
}
