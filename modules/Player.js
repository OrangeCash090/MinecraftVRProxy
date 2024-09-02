const JSONSender = require("./JSONSender");
const { Vec3 } = require("vec3");
const Selector = require("./MCSelector");

class Player {
    constructor(ws, username) {
        this.username = username;
        this.gamemode = "survival";

        this.doesExist = async () => {
            var response = await JSONSender.commandWithResponse(ws, `/testfor ${this.username}`);

            if (response.statusCode == 0) {
                return true;
            } else {
                return false;
            }
        }

        this.addTag = (tagName) => {
            JSONSender.sendCommand(ws, `/tag ${username} add ${tagName}`);
        }

        this.teleport = (coords, relative) => {
            if (relative) {
                JSONSender.sendCommand(ws, `/tp ${username} ~${coords.x} ~${coords.y} ~${coords.z}`);
            } else {
                JSONSender.sendCommand(ws, `/tp ${username} ${coords.x} ${coords.y} ${coords.z}`);
            }
        }

        this.freeze = (coords) => {
            this.freezeInterval = setInterval(() => {
                this.teleport(coords, false);
            }, 20);
        }

        this.thaw = () => {
            clearInterval(this.freezeInterval);
        }

        this.kill = () => {
            JSONSender.sendCommand(ws, `/kill ${username}`);
        }

        this.damage = (amount, cause) => {
            JSONSender.sendCommand(ws, `/damage ${username} ${amount} ${cause}`);
        }

        this.giveEffect = (effectName, duration, power, visible) => {
            JSONSender.sendCommand(ws, `/effect ${username} ${effectName} ${duration} ${power} ${visible}`);
        }

        this.giveItem = (itemName, amount, data) => {
            JSONSender.sendCommand(ws, `/give ${username} ${itemName} ${amount} ${data}`);
        }

        this.clearEffects = () => {
            JSONSender.sendCommand(ws, `/effect ${username} clear`);
        }

        this.clearInventory = () => {
            JSONSender.sendCommand(ws, `/clear ${username}`);
        }

        this.getPosition = async () => {
            var data = await JSONSender.queryTarget(ws, this.username);

            if (data.position) {
                return (await JSONSender.queryTarget(ws, this.username)).position;
            }
        }

        this.getRotation = async () => {
            var data = await JSONSender.queryTarget(ws, this.username, true);

            if (data.xRot) {
                return new Vec3(data.xRot, data.yRot, 0);
            }
        }

        this.getTransform = async () => {
            var data = await JSONSender.queryTarget(ws, this.username);

            if (data.id) {
                return {
                    position: data.position,
                    rotation: new Vec3(0, data.yRot, 0)
                }
            }
        }

        this.getLookVector = async () => {
            var data = await JSONSender.queryTarget(ws, this.username, true);

            if (data.lookVector) {
                return data.lookVector;
            }
        }

        this.getScores = async () => {
            var scores = {};

            var response = await JSONSender.commandWithResponse(client, `/scoreboard players list ${this.username}`);
            response = response.statusMessage.split(" ");
            response = response.splice(6, response.length);

            for (let i = 0; i < response.length; i++) {
                if (response[i].indexOf(":") != -1) {
                    scores[response[i].replace(":", "")] = Number(response[i + 1]);
                }
            }

            return scores;
        }

        this.getTags = async () => {
            var response = await JSONSender.commandWithResponse(ws, `/tag ${username} list`);

            if (response.statusMessage.includes(": ")) {
                response = response.statusMessage.split(": ")[1];
                response = response.split(", ");
    
                return response;
            } else {
                return [];
            }
        }

        this.hasItem = async (parameters) => {
            var selector = new Selector("@a", {
                name: this.username,
                hasitem: parameters
            });

            var response = await JSONSender.commandWithResponse(ws, `/testfor ${selector.toString()}`);

            if (response.statusCode == 0) {
                return true
            } else {
                return false;
            }
        }

        this.isInRegion = async (min, max) => {
            const point = await this.getPosition();

            if (point) {
                const minX = Math.min(min.x, max.x);
                const minY = Math.min(min.y, max.y);
                const minZ = Math.min(min.z, max.z);
                const maxX = Math.max(min.x, max.x);
                const maxY = Math.max(min.y, max.y);
                const maxZ = Math.max(min.z, max.z);
            
                const isInXRange = point.x >= minX && point.x <= maxX;
                const isInYRange = point.y >= minY && point.y <= maxY;
                const isInZRange = point.z >= minZ && point.z <= maxZ;

                return isInXRange && isInYRange && isInZRange;
            }

            return false;
        }        
    }
}

module.exports = Player;
