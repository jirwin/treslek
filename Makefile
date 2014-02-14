lint:
	node ./node_modules/jshint/bin/jshint bin lib plugins

test-jasmine:
	node ./node_modules/jasmine-node/bin/jasmine-node spec

test: test-jasmine

build: test lint

.PHONY: lint test-jasmine test build
