.PHONY: build test clean serve

build:
    GOOS=js GOARCH=wasm go build -o web/static/main.wasm cmd/wasm/main.go
    cp "$(shell go env GOROOT)/misc/wasm/wasm_exec.js" web/static/

test:
    go test ./...

clean:
    rm -f web/static/main.wasm
    rm -f web/static/wasm_exec.js

serve: build
    go run cmd/server/main.go