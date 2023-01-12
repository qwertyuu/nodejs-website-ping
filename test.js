const http = require('http');

const server = http.createServer((req, res) => {
    // Do not end the response, causing a timeout in the browser
});

server.listen(3000);