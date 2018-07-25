var http = require("http");

/**
 * Create a PortManagerClient for registering on a PortManagerServer
 * @param {*} appId your application id to be registered as
 * @param {*} serverHost host of the server
 * @param {*} serverPort port of the server
 */
var PortManagerClient = function(appId, serverHost, serverPort){
    this.appId = appId;
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    this.initBeforeExit();
};

/**
 * Execute a request and treat the response
 * @param {*} options see http request for more informations
 * @param {*} writeData body to send (if there is any, can be null)
 */
var doRequest = function(options, writeData){
    return new Promise((resolve,reject) => {
        const req = http.request(options, (res) => {
    
            var data = '';
    
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data+=chunk;
            });
    
            res.on('end', () => {
                if(res.statusCode >= 300){
                    reject(JSON.parse(data));
                }
                else{
                    resolve(data != '' ? JSON.parse(data) : {});
                }
            });
        });
    
        req.on('error', (e) => {
            reject(e);
        });
    
        if(writeData){
            req.write(writeData);
        }

        req.end();
    });
};

/**
 * Initialize the shutdown process
 */
PortManagerClient.prototype.initBeforeExit = function(){
    var that = this;
    // do app specific cleaning before exiting
    process.on('exit', function () {
        that.beforeExit();
    });

    // catch ctrl+c event and exit normally
    process.on('SIGINT', function () {
        that.beforeExit();
        process.exit(2);
    });

    //catch uncaught exceptions, trace, then exit normally
    process.on('uncaughtException', function(e) {
        console.error(e.stack);
        that.beforeExit();
        process.exit(99);
    });
};

/**
 * Method executed before exiting
 */
PortManagerClient.prototype.beforeExit = function(){
    this.disconnect();
};

/**
 * Register the client on the given port
 * @param {*} port the port to be registered on
 * @returns Promise with return form request (err or data)
 */
PortManagerClient.prototype.register = function(port){
    var postData = JSON.stringify({name:this.appId,port:port});
    var options = {
        hostname: this.serverHost,
        port: this.serverPort,
        path: '/application',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }

    return doRequest(options, postData);
};

/**
 * Disconnect from the server
 */
PortManagerClient.prototype.disconnect = function(){
    console.log("Client[",this.appId,"]- Unregistering from server");
    var options = {
        hostname: this.serverHost,
        port: this.serverPort,
        path: '/application/'+this.appId,
        method: 'DELETE'
    }

    return doRequest(options).then(data => {
        console.log("Client- Successfully disconnected");
    }).catch(err => {
        console.error("Client - Error during disconnect : ", err);
    });
};


module.exports = PortManagerClient;