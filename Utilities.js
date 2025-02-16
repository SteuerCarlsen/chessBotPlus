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
        
        if (this.log.length > this.maxEntries) {
            this.removeOldestEntry();
        }
    },

    moveEntry(payLoad) {
        this.shownLog.unshift(`${payLoad.piece} moved to ${payLoad.index}`);
    },

    removeOldestEntry() {
        this.log.pop();
        this.shownLog.pop();
    },

    clearLog() {
        this.log = [];
    },

}