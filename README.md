# FinalsClub

## Directories
* `client/`         - Client side files (web root).
* `server-apache/`  - The static web server configuration files.
* `server-node/`    - The application server.

## Dependencies

* [Node.js](https://github.com/joyent/node/wiki/Installation)


## Developing Locally
* Modify your `/etc/HOSTS` file, rerouting dev.finalsclub.org to your development environment

        127.0.0.1 dev.finalsclub.org

* Run an HTTP server of your choice in the `client` directory

        python -m SimpleHTTPServer 1234

* Run the socket.io server from the `server-node` directory

        node server.js

* Open `http://dev.finalsclub.org` in a browser
