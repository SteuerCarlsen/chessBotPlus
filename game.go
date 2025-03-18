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

func InitBoard(args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Passed board is not valid")
	}
}
