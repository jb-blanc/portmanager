# Portmanager
Portmanager is composed from 2 classes (PortManagerServer and PortManagerClient) used to provide a simple way to register port used by your node application without using a big fat piece like Eureka.

# PortManagerServer

## How to use it
Here's a simple way to start the PortManagerServer
```javascript
let PortManagerServer = require("./component/portmanager.server");
(new PortManagerServer()).start();
```

This will start the server with the given configuration : 
```javascript
this.conf = {
    appPort: 8080,  //port used by the server
    portMin: 8081,  //starting port to manage
    portMax: 9999   //ending port to manage
};
```
Some exemple will be available as soon as possible in a given folder.

## Current instance informations

Informations about the server state could be found on http://localhost:8080/health (if you started the server on port 8080)


# PortManagerClient

## How to use it
Client are simple too. Here's the fast way : 
```javascript
let PortManagerClient = require("./component/portmanager.client");

(new PortManagerClient("APPLICATION","SERVERHOST",8080).register(8081).then(data => {
    console.log("Client- Successfully registered : ", data);
}).catch(err => {
    console.error("Client - Error during registering : ", err);
});
```
The PortManagerClient will try to register on the server at ``"SERVERHOST"`` listening on port 8080, and will asked for the slot on port ``8081``.

## Error cases
In some cases, the server will refuses to register your application, there are some reasons possible : 

- Application is already registered on another port
- Port is already in use by another application
- Server is not started or not available

...