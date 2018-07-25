let PortManagerServer = require("./component/portmanager.server");
let PortManagerClient = require("./component/portmanager.client");

let CONF_FILE = __dirname + "/manager.conf.json"
console.log("Giving confFile : ", CONF_FILE);
let portManagerServer = new PortManagerServer();
portManagerServer.persist(false).readConf(CONF_FILE).start();


/**
 * Method for testing purpose only
 * place breakpoint at setTimeout to register or kill clients
 * @param {*} clients 
 */
var waitingNext = function(clients){

    var registerClient = function(appName, port){
        if(!clients.hasOwnProperty(appName)){
            clients[appName] = (new PortManagerClient(appName,"localhost",55101));
            clients[appName].register(port).then(data => {
                console.log("Client- Successfully registered : ", data);
            }).catch(err => {
                console.error("Client - Error during registering : ", err);
            });
        }
    };
    
    var killClient = function(appName){
        clients[appName].beforeExit();
        delete clients[appName];
    };

    setTimeout(function(){waitingNext(clients);}, 5000);
}

waitingNext({});