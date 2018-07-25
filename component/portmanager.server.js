var fs = require("fs");
var express = require("express");


var PortManagerServer = function(){
    this.app = express();

    this.persistData = false;
    this.confFile = './portmanager.server.json'
    this.conf = {
        appPort: 8080,
        portMin: 8081,
        portMax: 9999
    };
    this.registeredApps = {};
};

/**
 * Read the given configuration file
 * @param {string} confFile the configuration file to read
 * @throws exception when reading is not possible or the file doesn't exists
 */
PortManagerServer.prototype.readConf = function(confFile){
    if(fs.existsSync(confFile)){
        this.confFile = confFile;
        try{
            var confRead = JSON.parse(fs.readFileSync(confFile,{flag:'r'}));
            this.conf = Object.assign(this.conf, confRead);
        } catch(e){
            console.error("Error during conf file reading : ", e);
            throw e;
        }
    }
    else{
        throw "The file " + confFile + " does not exist";
    }
    return this;
};

/**
 * Refresh config without restarting application
 */
PortManagerServer.prototype.refreshConf = function(){
    return this.readConf(this.confFile).restart();
};

/**
 * https://stackoverflow.com/a/21947851
 * Init proper way to exit application
 */
PortManagerServer.prototype.beforeExitInit = function(){
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
        console.log(e.stack);
        that.beforeExit();
        process.exit(99);
    });
};

/**
 * Indicates weither or not the server should save datas to config file
 */
PortManagerServer.prototype.persist = function(persistData){
    this.persistData = persistData | false;
    return this;
};

/**
 * Action taken before exiting application
 */
PortManagerServer.prototype.beforeExit = function(){
    console.log("Server- Cleaning informations");
    if(this.persistData){
        this.conf.lastWrite = Date.now();
        fs.writeFileSync(this.confFile, JSON.stringify(this.conf));
    }
    this.server.close();
};

/**
 * Restart express server
 */
PortManagerServer.prototype.restart = function(){
    this.server.close();
    this.start();
};

/**
 * Look if the given port is available for application
 */
PortManagerServer.prototype.isPortAvailable = function(askedPort, application){
    return Object.keys(this.registeredApps).every(appName => ((this.registeredApps[appName].port != askedPort && appName != application) || (this.registeredApps[appName].port == askedPort && appName == application)));
};

/**
 * Starts the indexing server
 */
PortManagerServer.prototype.start = function(){
    this.beforeExitInit();
    var that = this;
    
    this.app.use(express.json());

    this.app.get('/health', function(req, res){
        res.status(200);
        res.contentType("application/json");
        res.json({test: "test", conf: that.conf, apps: that.registeredApps});
    });

    this.app.post('/application', function(req, res){
        var application = req.body;
        var askedPort = application.port;
        var canRegister = that.conf.portMin <= askedPort && that.conf.portMax >= askedPort && that.isPortAvailable(askedPort, application.name);
        if(canRegister){
            that.registeredApps[application.name] = {port: askedPort, registeredAt: Date.now()};
            console.log("Registered application ", that.registeredApps[application.name]);
            res.statusMessage = "Application registered";
            res.status(201);
            res.json({name:application.name, port:application.port});
        }
        else{
            res.statusMessage = "Wrong port";
            res.status(400);
            res.json({error:true, message:"Port is unavailable or out of managed ports (["+that.conf.portMin+" to "+that.conf.portMax+"])"});
        }
    });

    //Remove an application from the managed one
    this.app.delete('/application/:appName', function(req, res){
        var appName = req.params.appName;
        if(that.registeredApps.hasOwnProperty(appName)){
            console.log("Unregistered application ", that.registeredApps[appName]);
            delete that.registeredApps[appName];
            res.status(204);
            res.send();
        }
        else{
            res.statusMessage = "Unknown application";
            res.status(404);
            res.send({error:true, message:"The application was never registered on the server."});
        }
    });

    this.server = this.app.listen(this.conf.appPort);
    console.log("ServerManager started on port ", this.conf.appPort);
};

module.exports = PortManagerServer;