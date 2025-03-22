// Initialize the Go WASM runtime
const go = new Go();
let wasmInstance = null;

// Load and initialize the WebAssembly module
async function initWasm() {
    try {
        // Fetch the WASM file
        const response = await fetch('web/static/main.wasm');
        const buffer = await response.arrayBuffer();
        
        // Instantiate the WASM module
        const result = await WebAssembly.instantiate(buffer, go.importObject);
        wasmInstance = result.instance;
        
        // Run the Go WASM instance
        go.run(wasmInstance);
        
        console.log("WASM module loaded successfully");
    } catch (error) {
        console.error("Failed to load WASM module:", error);
    }
}

// Initialize WASM when the page loads
window.addEventListener("load", initWasm);