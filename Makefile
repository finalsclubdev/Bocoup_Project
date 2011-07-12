GIT := git
MAKE := make
DIST_FILE := webapp.tar.gz

check:
	cd server-node && ${MAKE} check

dist: check
	${GIT} archive --format=tar --prefix=webapp/ HEAD | gzip > ${DIST_FILE}

clean:
	rm -f ${DIST_FILE}
