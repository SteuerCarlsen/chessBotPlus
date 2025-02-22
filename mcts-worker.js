importScripts(
    './Stats.js',
    './Abilities.js',
    './AI.js',
    './CombatHandler.js',
)

self.onmessage = function(e) {
    try {
        const {initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, explorationConstant, iterationGoal} = e.data;
        const result = runSimulation(initialBoard, initialPlayer,  startIndex, endIndex, timeLimit, maxDepth, explorationConstant, iterationGoal);
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

function runSimulation(initialBoard, initialPlayer, startIndex, endIndex, timeLimit, maxDepth, explorationConstant = 0.6, iterationGoal) {
    /*debugLog('Starting simulation', {
        initialBoard,
        initialPlayer,
        startIndex,
        endIndex,
        iterationGoal,
    });*/
    let results = [];
    let iterations = 0;

    const state = new SimulationState(initialBoard, initialPlayer);
    const root = new TreeNode(state, explorationConstant);
    root.untriedActions = root.untriedActions.slice(startIndex, endIndex);

    while (iterations < iterationGoal) {
        iterations++;

        let node = root;
    
        while(!node.isTerminal() && node.isFullyExpanded()) {
            node = node.selectChild();
            if (!node) break;
        }

        if(node && !node.isTerminal()) {
            let expandedNode = node.expand();
            if(expandedNode) {
                node = expandedNode;
            }
        }

        if (node) {
            const [result, turns] = node.simulate(maxDepth);
            node.backpropagate([result, turns]);
        }
    }

    for (const child of root.children) {
        if (!child) continue;
        const action = child.state.lastAction;
        results.push([action, child.wins, child.visits, child.turns]);
    }

    return [results, iterations];
}