#!/bin/sh
forever start -a -o /tmp/webapp.log -e /tmp/webapp.err.log ./server.js
