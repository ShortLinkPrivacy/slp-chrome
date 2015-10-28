NODE=$(shell which node)
NPM=$(shell which npm)
BOWER=$(shell which bower)

help:
	@echo "Available targets:"
	@echo "install    - install all bower and npm deps"
	@echo "clean      - remove all bower and npm modules"
	@echo "start      - start the server"

install:
	$(NPM) install
	$(BOWER) install

clean:
	rm -rf bower_components/ node_modules/

start:
	$(NODE) server.js
