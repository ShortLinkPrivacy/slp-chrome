SOURCE=../src/modules
TARGET=compiled

help:
	@echo "Targets"
	@echo "==========================================================="
	@echo "build                  build all typescript libs"
	@echo "install                install all dependencies"
	@echo "test                   run all tests"
	@echo "clean                  remove compiled and generated files"

install:
	npm install

build:
	coffee -c t/ lib/
	tsc --out $(TARGET)/keystore.js \
		$(SOURCE)/keystore/LocalStore.ts

test:
	NODE_ENV=test mocha -b -S t

clean:
	rm -v $(TARGET)/*.js t/*.js lib/*.js
