SOURCE=../src/modules
TARGET=compiled

help:
	@echo "Available targets:"
	@echo "-----------------------------------------------"
	@echo "build                  build all typescript libs"
	@echo "install                install all dependencies"

install:
	npm install

build:
	tsc --out $(TARGET)/store.js \
		$(SOURCE)/store/LocalStore.ts

test:
	NODE_ENV=test mocha t
