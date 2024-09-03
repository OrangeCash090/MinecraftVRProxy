const WebSocket = require('ws');
const CommandHandler = require("./Commands")
const JSONSender = require("./JSONSender");

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

class Server {
    constructor(port) {
        this.websocket = new WebSocket.Server({
            port: port
        });

        this.connectedSockets = [];
        this.vrSocket = null;
        this.lastId = 0;

        this.websocket.on("connection", async (conn) => {
            var playerName = `Guest ${this.lastId}`;

            var client = { owner: { username: playerName }, socket: conn, id: this.lastId };
            var socket = client.socket;
            var commandRunner = new CommandHandler(this, socket);

            socket.responseResolvers = new Map();

            JSONSender.sendSubscribe(socket, "PlayerMessage");
            JSONSender.sendSubscribe(socket, "SlashCommandExecuted");
            JSONSender.sendSubscribe(socket, "ItemInteracted");
            JSONSender.sendCommand(socket, "/getlocalplayername");

            socket.on("message", (msg) => {
                if (msg == "keepalive") { return };

                if (msg == "RequestChunks" && this.vrSocket != null) {
                    this.vrSocket.emit("RequestChunks");
                }

                var parsedMsg = JSON.parse(msg);

                if (parsedMsg.head != undefined) {
                    if (this.vrSocket == null) {
                        this.vrSocket = socket;
                    };
                    
                    this.vrSocket.emit("VRTrackingData", parsedMsg);
                } else {
                    var reqID = parsedMsg.header.requestId;
                    var resolver = socket.responseResolvers.get(reqID);

                    if (resolver) {
                        if (parsedMsg.header.messagePurpose == "error") {
                            //console.log(parsedMsg);
                        }

                        resolver.resolve(parsedMsg);
                        socket.responseResolvers.delete(reqID);
                    }

                    if (parsedMsg.header.eventName == "PlayerMessage" && parsedMsg.body.sender != "External") {
                        var msgArgs = parsedMsg.body.message.split(" ");

                        if (parsedMsg.body.message.includes(`'`)) {
                            msgArgs[1] = parsedMsg.body.message.slice(getPosition(parsedMsg.body.message, `'`, 1), getPosition(parsedMsg.body.message, `'`, 2) + 1);
                        }

                        console.log(`<${parsedMsg.body.sender} (Websocket ${client.id})> ${parsedMsg.body.message}`)

                        if (parsedMsg.body.sender == client.owner.username) {
                            var cmdName = msgArgs[0].substring(1, msgArgs[0].length).toLowerCase();

                            if (msgArgs[0].substring(0, 1) == "!") {
                                commandRunner.runCommand(cmdName, parsedMsg.body.sender, msgArgs.splice(1, msgArgs.length));
                            }
                        }
                    }

                    if (parsedMsg.body.localplayername != undefined) {
                        client.owner.username = parsedMsg.body.localplayername;
                    }

                    if (parsedMsg.header.eventName == "ItemInteracted") {
                        socket.emit("itemInteracted", parsedMsg.body.item.id, parsedMsg.body.item.enchantments[0]);
                    }
                }
            })

            socket.on("close", () => {
                delete this.connectedSockets[client.id];
            })

            this.connectedSockets.push(client);
            this.lastId += 1;
            console.log(`Websocket ${client.id} Connected.`);

            setInterval(() => {
                socket.send("keepalive");
            }, 3000);
        })

        this.websocket.on("close", () => {
            console.log(`Server Closed.`);
        })
    }
}

module.exports = Server
