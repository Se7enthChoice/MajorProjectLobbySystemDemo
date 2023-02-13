//http server setup
const http = require("http");
const app = require("express")(); //serves html page
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.listen(8081, ()=>console.log("Listening on http port 8081"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(8080, () => console.log("Listening.. on 8080")) 

const clients = {};//hashmap of connected clients
const games = {};
const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect to server
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("connection opened"))
    connection.on("close", () => console.log("connection closed"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)//should work as long as only JSON is sent
        console.log(result)
        //message received from client
        //user wants to create new game
        if(result.method === "create"){
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "clients": []
            }

            const payload = {
                "method": "create",
                "game": games[gameId]
            }

            const connect = clients[clientId].connection;
            connect.send(JSON.stringify(payload));
        }
        //client wants to join game
        if(result.method === "join"){
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            game.clients.push({
                "clientId": clientId
            })

            const payLoad = {
                "method": "join",
                "game": game
            }
            //tell all clients new client has joined
            game.clients.forEach(c=> {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
    })

    //generate clientId (clients mapped with connection)
    const clientId = guid();
    clients[clientId] = {
    "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connection
    connection.send(JSON.stringify(payLoad)) //must be a string to send
})



//Generates unique ID (guid) for clients
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 
