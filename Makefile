lint:
	node ./node_modules/jshint/bin/jshint bin lib plugins

build: lint

.PHONY: lint build
