importScripts(
    './Utilities.js',
    './Stats.js',
    './Abilities.js',
    './AI.js',
    './CombatHandler.js',
)

self.onmessage = function(e) {
    const {initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth} = e.data;
    const result = runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth);
    self.postMessage(result);
}

function runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth) {
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
    
            const result = node.simulate(maxDepth);
    
            node.backpropagate(result);
        }
        
        results.push([action, root.wins])
    }

    return [results, iterations];
}