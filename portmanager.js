let portManagerServer = require("./component/portmanager.server");
let http = require('http');

let CONF_FILE = __dirname + "/manager.conf.json"
console.log("Giving confFile : ", CONF_FILE);
portManagerServer.persist(false).readConf(CONF_FILE).start();

http.get('http://localhost:55101/health', function(resp){
    resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
    });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});