importScripts(
    './web/static/wasm_exec.js',
    './Stats.js',
    './Abilities.js',
    './AI.js',
    './CombatHandler.js',
)

let wasmLoaded = false;

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

//Something about running the Go modules