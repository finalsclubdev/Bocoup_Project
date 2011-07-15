NODE := `which node nodejs`

GIT := git
MAKE := make
DIST_FILE := webapp.tar.gz

all: check hint

check:
	@cd server-node && ${MAKE} check

hint:
	@cd server-node && ${MAKE} hint
	@cd client && ${MAKE} hint

update_submodules:
	${GIT} submodule init && ${GIT} submodule update

dist: update_submodules check
	${GIT} archive --format=tar --prefix=webapp/ HEAD | gzip > ${DIST_FILE}

clean:
	rm -f ${DIST_FILE}
