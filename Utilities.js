//Get a random integer between two values
function getRandomIntRange(max, min){
    return Math.floor(Math.random() * (max - min) + min)
}

function trimArray(arr) {
    return arr.reduce((acc, item) => {
        if (Array.isArray(item)) {
            acc.push(...trimArray(item)); // Recursively flatten nested arrays
        } else if (item !== undefined && item !== null) {
            acc.push(item); // Include non-empty values
        }
        return acc;
    }, []);
}

function roundToDecimals (value, decimals) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

const combatLog = {
    log: [],
    shownLog: [],
    maxEntries: 100,

    addEntry(type, payLoad = {}) {
        this.log.unshift({
            type,
            payLoad,
            timeStamp: Date.now(),
        })

        if(type == "move"){
            this.moveEntry(payLoad);
        }

        if(type == "ability"){
            this.abilityEntry(payLoad);
        }
        
        if (this.log.length > this.maxEntries) {
            this.removeOldestEntry();
        }

        this.updateShownLog();
    },

    abilityEntry(payLoad) {
        this.shownLog.unshift(`Turn ${CurrentCombat.turn}: ${payLoad.piece} used ${payLoad.ability} on ${payLoad.target} for ${payLoad.value}`);
    },

    moveEntry(payLoad) {
        this.shownLog.unshift(`Turn ${CurrentCombat.turn}: ${payLoad.piece} moved to square ${payLoad.index}`);
    },

    removeOldestEntry() {
        this.log.pop();
        this.shownLog.pop();
    },

    clearLog() {
        this.log = [];
    },

    updateShownLog() {
        VisualCombatLog.update(this.shownLog);
    }

}

function calculateLosLines(boardSize = 64) {
    const losLines = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (i !== j) {
                losLines[i][j] = calculateLosLine(i, j, boardSize);
            }
        }
    }
    return losLines;
}

function calculateLosLine(index, target, boardSize = 64) {
    const startX = CoordinateMap[index].x;
    const startY = CoordinateMap[index].y;
    const endX = CoordinateMap[target].x;
    const endY = CoordinateMap[target].y;

    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = (startX < endX) ? 1 : -1;
    const sy = (startY < endY) ? 1 : -1;
    let err = dx - dy;

    let x = startX;
    let y = startY;
    const losPath = [];
    while (x !== endX || y !== endY) {
        if (x !== startX || y !== startY) {
            const square = x + (y * Math.sqrt(boardSize));
            losPath.push(square);
        }
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
    
    return losPath;
}

function calculateCoordinateMap(boardSize = 64) {
    const dimensions = Math.sqrt(boardSize);
    const coordinateMap = new Array(boardSize);
    for (let i = 0; i < boardSize; i++) {
        const x = i % dimensions;
        const y = Math.floor(i / dimensions);
        coordinateMap[i] = { x, y };
    }
    return coordinateMap;
}

function calculateNeighbors(size = 64, directions = [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
    const neighborMap = new Array(size);
    for (let i = 0; i < size; i++) {
        const neighbors = [];
        const x = CoordinateMap[i].x;
        const y = CoordinateMap[i].y;
        directions.forEach(([dx, dy]) => {
            const newRow = y + dy;
            const newCol = x + dx;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                neighbors.push(newRow * 8 + newCol);
            }
        });
        neighborMap[i] = neighbors;
    }
    return neighborMap;
}

let comparedSimulations = null;

async function testSimulationValues (simulations = 10, timeLimit = 1000, maxDepth = 500, explorationConstant = 1.41, iterationGoal) {
    let results = [];

    for (let i = 0; i < simulations; i++) {
        let simulationAI = new MonteCarloTreeSearch(explorationConstant);
        simulationAI.init(Board.exportBoard(), 'enemy', timeLimit, maxDepth, iterationGoal);
        const result = await simulationAI.runSearch(true)
        results.push(result);
        //simulationAI.cleanupWorkers();
    }

    let totalIterations = 0;
    let totalBestScore = 0;
    let totalBestActionAverageTurns = 0;

    for (const result of results) {
        totalIterations += result.iterations;
        totalBestScore += result.bestScore;
        totalBestActionAverageTurns += result.bestActionAverageTurns;
    }

    const averageIterations = Math.round(totalIterations / simulations);
    const averageBestScore = roundToDecimals(totalBestScore / simulations, 2);
    const averageBestActionAverageTurns = Math.round(totalBestActionAverageTurns / simulations);

    return {
        averageIterations: averageIterations,
        averageBestScore: averageBestScore,
        averageBestActionAverageTurns: averageBestActionAverageTurns,
    }
}

async function compareSimulationValues(cases = []) {
    let output = [cases, {averageIterations: [], averageBestScore: [], averageBestActionAverageTurns: []}, {averageIterationsFactor: [1], averageBestScoreFactor: [1], averageBestActionAverageTurnsFactor: [1]}];

    for (const testCase of cases) {
        const result = await testSimulationValues(testCase.simulations, testCase.timeLimit, testCase.maxDepth, testCase.explorationConstant);
        output[1].averageIterations.push(result.averageIterations);
        output[1].averageBestScore.push(result.averageBestScore);
        output[1].averageBestActionAverageTurns.push(result.averageBestActionAverageTurns);
    }

    for (let i = 1; i < cases.length; i++) {
        output[2].averageIterationsFactor.push(roundToDecimals(output[1].averageIterations[i] / output[1].averageIterations[0], 2));
        output[2].averageBestScoreFactor.push(roundToDecimals(output[1].averageBestScore[i] / output[1].averageBestScore[0], 2));
        output[2].averageBestActionAverageTurnsFactor.push(roundToDecimals(output[1].averageBestActionAverageTurns[i] / output[1].averageBestActionAverageTurns[0], 2));
    }

    console.log('Simulation comparison results:', output);
    comparedSimulations = output;
}

const testCases = [
    {simulations: 1, timeLimit: 1000, maxDepth: 500, explorationConstant: 0.6},
]