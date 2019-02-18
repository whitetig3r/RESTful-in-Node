const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./lib/config.js');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
const https = require('https');
const fs = require('fs');

// CREATING HTTP SERVER
const HTTPserver = http.createServer(function (req,res){
    unifiedServer(req,res);
});

HTTPserver.listen(config.httpPort, function () { // start server
    console.log(`LISTENING ON PORT ${config.httpPort} - ${config.envName}`);
});
// HTTP SERVER END

// HTTPS SERVER START
const httpsOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

const HTTPSserver = https.createServer( httpsOptions, function (req, res) {
    unifiedServer(req,res);
});

HTTPSserver.listen(config.httpsPort, function () { // start server
    console.log(`LISTENING ON PORT ${config.httpsPort} - ${config.envName}`);
});
// HTTPS SERVER END


// Server logic for both HTTP & HTTPS server
var unifiedServer = function (req, res){

        var parsedURL = url.parse(req.url, true); //1. get parsed URL

        var path = parsedURL.pathname;  // 2. get route/path

        var trimmedPath = path.replace(/^\/+|\/+$/g, ''); // 3. trim starting and end slashes | keep intermediate ones

        var method = req.method.toUpperCase(); // 4. get RESTful method

        var query = parsedURL.query;    // 5. get query params

        var headers = req.headers; // 6. get headers 

        var buff = ''; // 7. create a new data/string object
        var decoder = new StringDecoder('utf-8'); // 8. create a decoder for stream UTF-8 data

        req.on('data', function (data) {
            buff += decoder.write(data); // 9. on event 'data' decode and write to buff
        })

        req.on('end', function () {
            buff += decoder.end(); // 10. on event 'end' place termination to buffer and send response

            var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound; // 11. pick the right handler (or) go to 404 route

            var data = {
                'path': trimmedPath,
                'method': method,
                'query': query,
                'headers': headers,
                'payload': helpers.parseJsonToObject(buff)
            }  // 12. construct the payload

            chosenHandler(data, function (statusCode, payload) {     // 13. invoke the handler with the supplied statuscode & payload
                statusCode = typeof (statusCode) !== 'number' ? 200 : statusCode;
                payload = typeof (payload) !== 'object' ? {} : payload; // 14. supply defaults

                payloadSting = JSON.stringify(payload); // 15. stringify for transmission
                res.setHeader('Content-type', 'application/json');
                res.writeHead(statusCode); // 16. write status code to header
                res.end(payloadSting); // 17. send response

                console.log('Returned: ', statusCode, payloadSting); // LOG to server console
            });
        })
}


// create router for different routes

const router = {  
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
}
