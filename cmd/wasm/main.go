//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/steuercarlsen/chessDungeonCrawler/internal/game"
	"github.com/steuercarlsen/chessDungeonCrawler/internal/game_data"
)

var (
	GameState         *game.State
	SelectedEncounter game_data.Encounter
	SelectedHeroes    = make([]game_data.Hero, 0, game_data.MaxPartySize)
)

type JSFunction struct {
	Name string
	Func func(js.Value, []js.Value) any
}

var API = []JSFunction{
	{Name: "selectEncounter", Func: SelectEncounter},
	{Name: "selectHero", Func: SelectHero},
	{Name: "initiateCombat", Func: InitiateCombat},
	{Name: "getSquare", Func: GetSquare},
}

func RegisterAPI() {
	for _, api := range API {
		js.Global().Set(api.Name, js.FuncOf(api.Func))
	}
}

func SelectEncounter(this js.Value, args []js.Value) any {
	encounterID := args[0].String()
	SelectedEncounter = game_data.Encounters[encounterID]
	return "Encounter selected"
}

func SelectHero(this js.Value, args []js.Value) any {
	if len(SelectedHeroes) == game_data.MaxPartySize {
		return "Party full"
	}

	heroID := args[0].Index(0).String()
	hero := game_data.Heroes[heroID]

	itemsArray := args[1]
	for i := 0; i < itemsArray.Length(); i++ {
		itemID := itemsArray.Index(i).String()
		hero.Equipment = append(hero.Equipment, game_data.Items[itemID])
	}

	SelectedHeroes = append(SelectedHeroes, hero)
	return "Hero selected"
}

func InitiateCombat(this js.Value, args []js.Value) any {
	return "Combat initiated"
}

func GetSquare(this js.Value, args []js.Value) any {
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
	RegisterAPI()

	// Prevent program from exiting
	select {}
}
