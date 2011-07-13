NODE := `which node nodejs`

JSHINT_CHECK := ./build/jshint-check.js

SRC_DIR := ./js

all: hint

hint:
	@@for file in `ls ${SRC_DIR}/*.js`; do \
		echo "Hinting: $$file"; \
		${NODE} ${JSHINT_CHECK} $$file; \
		echo "--------------------------"; \
	done
