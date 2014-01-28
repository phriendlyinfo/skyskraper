BIN = node_modules/.bin
MOCHA = $(BIN)/mocha

.PHONY: test

all: test

test:
	@$(MOCHA) --reporter spec --recursive --colors
