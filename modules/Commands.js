const JSONSender = require("./JSONSender");
const VRHandler = require("./VRHandler");
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
                new VRHandler(client, server.vrSocket);
            },

            test: async (sender, args) => {
                while (true) {
                    console.log((await JSONSender.getChunk(client, new Vec3(0,0,0)))[0][0]);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
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
