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