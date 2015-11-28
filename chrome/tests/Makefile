SOURCE=../src/modules
TARGET=compiled

help:
	@echo "Targets"
	@echo "==============================================="
	@echo "build                  build all typescript libs"
	@echo "install                install all dependencies"
	@echo "test                   run all tests"

install:
	npm install

build:
	coffee -c t/ lib/
	tsc --out $(TARGET)/store.js \
		$(SOURCE)/store/LocalStore.ts

test:
	NODE_ENV=test mocha t
