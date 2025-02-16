importScripts(
    './Stats.js',
    './Abilities.js',
    './AI.js',
    './CombatHandler.js',
)

self.onmessage = function(e) {
    try {
        const {initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats, maxNodeRepeats} = e.data;
        const result = runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats, maxNodeRepeats);
        self.postMessage(result);
    } catch (error) {
        self.postMessage({ error: error.message});
    }
}

function runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats = 1, maxNodeRepeats = 1) {
    let results = [];
    let iterations = 0;
    const timePerMove = timeLimit / (endIndex - startIndex);
    let initialNode = new TreeNode(new SimulationState(initialBoard, initialPlayer));
    let initialActions = initialNode.state.getPossibleActions().slice(startIndex, endIndex);

    for (const action of initialActions) {
        const state = new SimulationState(initialBoard, initialPlayer);
        state.play(action);

        const root = new TreeNode(state);
        const startTime = Date.now();

        while (Date.now() - startTime < timePerMove) {
            iterations++;
    
            let node = root;
    
            while(!node.isTerminal() && node.isFullyExpanded()) {
                node = node.selectChild();
            }
    
            if(!node.isTerminal()) {
                node = node.expand();
                if(node === null) continue;
            }
    
            let repeats = Math.max(minNodeRepeats, maxNodeRepeats - node.depth);
            let result = 0;
            let turns = 0;

            for (let i = 0; i < repeats; i++) {
                let resultArray = node.simulate(maxDepth);
                result += resultArray[0];
                turns += resultArray[1];
            }

            let averagedResult = Math.round(result / repeats);
            let averagedTurns = Math.round(turns / repeats);

            node.backpropagate([averagedResult, averagedTurns]);
        }
        results.push([action, root.wins, root.visits, root.turns]);
    }

    return [results, iterations];
}