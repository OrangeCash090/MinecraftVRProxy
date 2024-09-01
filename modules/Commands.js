const JSONSender = require("./JSONSender");
const PlayerHandler = require("./PlayerHandler");
const BlockEntity = require("./BlockEntity");
const { CFrame, CFAngles } = require("./CFrame");
const {Mesh, Cube} = require("./Mesh");
const { Vec3 } = require("vec3");

var currentAnimation = null;

String.prototype.insert = function (index, string) {
    if (index > 0) {
        return this.substring(0, index) + string + this.substring(index, this.length);
    }

    return string + this;
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

class CommandHandler {
    constructor(server, client) {
        this.help = [
            "!cmds <page?> - Shows all of the commands you can use.",
        ];

        this.commands = {
            cmds: (sender, args) => {
                var pageSize = 4; // Number of commands per page
                var page = args.length > 0 ? parseInt(args[0]) : 1;
                var totalPages = Math.ceil(this.help.length / pageSize);
            
                if (isNaN(page) || page < 1 || page > totalPages) {
                    JSONSender.sayText(client, "§cInvalid page number.", sender);
                    return;
                }
            
                var message = `§6List of commands (Page ${page}/${totalPages}):\n`;
                var startIndex = (page - 1) * pageSize;
                var endIndex = Math.min(startIndex + pageSize, this.help.length);
            
                for (let i = startIndex; i < endIndex; i++) {
                    var cmd = this.help[i];
                    cmd = cmd.insert(0, "§g");
                    cmd = cmd.insert(cmd.indexOf("<"), "§6");
                    cmd = cmd.insert(cmd.indexOf("-"), "§6");
                    cmd = cmd.insert(cmd.indexOf("- ") + 2, "§d");
                    message += `${cmd}\n`;
                }
            
                JSONSender.sayText(client, message, sender);
            },

            start: async (sender, args) => {
                var headCube = new Cube(client);
                headCube.size = new Vec3(2, 2, 2);
                
                var leftCube = new BlockEntity(client, "gold_block", "LC", new Vec3(10,10,10));
                await new Promise(resolve => setTimeout(resolve, 2000));
                var rightCube = new BlockEntity(client, "gold_block", "RC", new Vec3(-10,-10,-10));
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                server.vrSocket.on("VRTrackingData", async (vrTrackers) => {
                    var head = vrTrackers.head;
                    var leftHand = vrTrackers.lefthand;
                    var rightHand = vrTrackers.righthand;

                    headCube.cframe = new CFrame(head.position.x * 10, head.position.y * 10, head.position.z * 10).multiply(CFAngles(toRadians(head.rotation.x), toRadians(head.rotation.y), 0));
                    leftCube.position = new Vec3(leftHand.position.x * 10, leftHand.position.y * 10, leftHand.position.z * 10);
                    rightCube.position = new Vec3(rightHand.position.x * 10, rightHand.position.y * 10, rightHand.position.z * 10);

                    headCube.update();
                });

                setInterval(async () => {
                    var currentPlayers = await PlayerHandler.onlinePlayers(client);
                    var playerTransforms = {};
                    
                    for (let [name, player] of Object.entries(currentPlayers)) {
                        var transform = await player.getTransform();
                        playerTransforms[player.username] = transform;
                    }
                    
                    server.vrSocket.send(JSON.stringify({
                        playerTransforms: playerTransforms
                    }));
                }, 250)
            }
        }

        this.runCommand = (name, sender, args) => {
            if (this.commands[name] != undefined) {
                this.commands[name](sender, args);
            }
        }
    }
}

module.exports = CommandHandler
