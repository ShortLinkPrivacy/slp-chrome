help:
	@echo "Available targets:"
	@echo "install                 install all dependencies"
	@echo "build                   compile all CoffeeScript and TypeScript files"

build:
	coffee -c ./
	tsc --out src/modules.js \
		src/modules/config.ts \
		src/modules/interfaces.ts \
		src/modules/pgp/keys.ts \
		src/modules/services/definitions.ts \
		src/modules/services/settings/LocalStore.ts \
		src/modules/services/storage/LocalStore.ts

install:
	bower install
	tsd install
