TS_PATH=../src/modules
LIB_PATH=lib

help:
	@echo "Available targets:"
	@echo "-----------------------------------------------"
	@echo "build                  build all typescript libs"
	@echo "install                install all dependencies"

install:
	npm install

build:
	tsc --out $(LIB_PATH)/store.js \
		$(TS_PATH)/store/LocalStore.ts

test:
	NODE_ENV=test mocha t
