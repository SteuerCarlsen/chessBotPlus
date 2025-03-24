package game_data

var Heroes = map[string]Hero{}

type Hero struct {
	Name      string
	Equipment []Item
}
