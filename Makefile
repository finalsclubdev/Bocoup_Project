GIT := git
MAKE := make
DIST_FILE := webapp.tar.gz

all: check hint

check:
	cd server-node && ${MAKE} check

hint:
	cd server-node && ${MAKE} hint

dist: check
	${GIT} archive --format=tar --prefix=webapp/ HEAD | gzip > ${DIST_FILE}

clean:
	rm -f ${DIST_FILE}
