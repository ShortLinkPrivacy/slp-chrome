NODE=$(shell which node)
APP=server.js
MOCHA=$(shell which mocha)

help:
	@echo "Available targets:"
	@echo "start       - run application in development mode"
	@echo "deploy      - run application in production mode"
	@echo "test        - run all test"

start:
	$(NODE) $(APP)

deploy:
	NODE_ENV=production $(NODE) $(APP)

test:
	NODE_ENV=test mocha t

mintest:
	NODE_ENV=test mocha -R min t
