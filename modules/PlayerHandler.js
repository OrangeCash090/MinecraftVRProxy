const JSONSender = require("./JSONSender");
const Player = require("./Player");

async function getPlayer(ws, username) {
    var response = await JSONSender.commandWithResponse(ws, `/testfor @e[type=player,name=${username}]`);
    
    if (response.statusCode == 0) {
        return new Player(ws, username);
    }
}

async function onlinePlayers(ws) {
    var players = {};
    
    var response = await JSONSender.commandWithResponse(ws, `/testfor @a`);
    response = response.statusMessage.split(", ");
    response[0] = response[0].slice(6, response[0].length);

    for (let i = 0; i < response.length; i++) {
        players[response[i]] = new Player(ws, response[i]);
    }

    return players;
}

module.exports = { getPlayer, onlinePlayers }