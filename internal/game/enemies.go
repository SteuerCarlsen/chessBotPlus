package game

type Enemy struct {
	Name string
	//TODO - Implement
}

// Keep all enemies in a map for lookup when initiating an encounter
var Enemies = map[string]*Enemy{
	"Enemy1": {
		Name: "Enemy1",
	},
}