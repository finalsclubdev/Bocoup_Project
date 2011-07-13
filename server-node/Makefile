NODE := `which node nodejs`

JUNIT_RUNNER := ./tests.js

JSHINT_CHECK := ./build/jshint-check.js

SRC_DIR := ./src
SERVER_FILE := ./server.js

all: check hint

check:
	${NODE} ${JUNIT_RUNNER}

hint:
	@@for file in `find ${SERVER_FILE} ${SRC_DIR} -name "*.js"`; do \
		echo "Hinting: $$file"; \
		${NODE} ${JSHINT_CHECK} $$file; \
		echo "--------------------------"; \
	done
