help:
	@echo "Available targets:"
	@echo "install                 install all dependencies"
	@echo "build                   compile all CoffeeScript and TypeScript files"

build:
	coffee -c ./
	tsc --out src/modules.js \
		src/modules/config.ts \
		src/modules/interfaces.ts \
		src/modules/keys.ts \
		src/modules/settings.ts \
		src/modules/settings/LocalStore.ts \
		src/modules/store.ts \
		src/modules/store/LocalStore.ts

install:
	bower install
	tsd install
