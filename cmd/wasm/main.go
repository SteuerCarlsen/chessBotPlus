//go:build js && wasm

package main

import (
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

	// Process the board data
	// Implement actual logic
	result := "Processed board with " + jsonData

	return result
}

func main() {}
