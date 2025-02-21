importScripts(
    './Stats.js',
    './Abilities.js',
    './AI.js',
    './CombatHandler.js',
)

self.onmessage = function(e) {
    try {
        const {initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats, maxNodeRepeats, explorationConstant} = e.data;
        const result = runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats, maxNodeRepeats, explorationConstant);
        sendMessage(result);
    } catch (error) {
        sendMessage({
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        });
    }
}

function sendMessage(data) {
    if(data.debug) {
        self.postMessage({type: 'debug', data: data.debug});
    } else {
        self.postMessage(data);
    }
}

/*function debugLog(message, data) {
    sendMessage({
        debug: {
            message,
            data,
            timestamp: Date.now()
        }
    });
}*/

function runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, minNodeRepeats = 1, maxNodeRepeats = 1, explorationConstant = 0.6) {
    let results = [];
    let iterations = 0;
    const timePerMove = timeLimit / (endIndex - startIndex);
    let initialNode = new TreeNode(new SimulationState(initialBoard, initialPlayer), explorationConstant);
    let initialActions = initialNode.state.getPossibleActions().slice(startIndex, endIndex);

    for (const action of initialActions) {
        const state = new SimulationState(initialBoard, initialPlayer);
        state.play(action);

        const root = new TreeNode(state, initialNode.explorationConstant);
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
    
            let resultArray = node.simulate(maxDepth);
            let result = resultArray[0];
            let turns = resultArray[1];

            node.backpropagate([result, turns]);
        }
        results.push([action, root.wins, root.visits, root.turns]);
    }

    return [results, iterations];
}