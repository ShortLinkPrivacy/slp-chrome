var connect = require('connect'),
    serveStatic = require('serve-static'),
    port = 8080;

console.log("Server listening on :" + port);
connect().use(serveStatic(__dirname)).listen(port);
