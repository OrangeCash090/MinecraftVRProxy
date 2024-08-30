const JSONSender = require("./JSONSender");
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

            start: (sender, args) => {
                var headCube = new Cube(client);
                headCube.size = new Vec3(1, 1, 1);
                
                server.websocket.on("VRTrackingData", (vrTrackers) => {
                    var head = vrTrackers.head;
                    var leftHand = vrTrackers.lefthand;
                    var rightHand = vrTrackers.righthand;

                    headCube.cframe = new CFrame(head.position.x, head.position.y, head.position.z).multiply(CFAngles(toRadians(head.rotation.x), toRadians(head.rotation.y), toRadians(head.rotation.z)));
                    JSONSender.sendCommand(client, `/particle minecraft:balloon_gas_particle ${leftHand.position.x} ${leftHand.position.y} ${leftHand.position.z}`);
                    JSONSender.sendCommand(client, `/particle minecraft:balloon_gas_particle ${rightHand.position.x} ${rightHand.position.y} ${rightHand.position.z}`);

                    headCube.update();
                });
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
