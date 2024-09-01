const { Vec3 } = require("vec3");
const JSONSender = require("./JSONSender");

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

class BlockEntity {
    constructor(ws, block, tag, position, full = true) {
        this.ws = ws;
        this.block = block;
        this.tag = tag;
        this.isFull = full;
        this.posOffset = this.isFull ? new Vec3(1.1245, 0.7260, 0.097) : new Vec3(0.417, 0.5, 0.035);
        this.initialPosition = position.clone(); // Store the initial position
        this.position = position.clone(); // Current position
        this.rotation = new Vec3(0, 0, 0);
        this.updating = true;

        JSONSender.makeDisplayBlock(this.ws, this.position, this.block, this.tag, this.isFull).then(() => {
            this.mainLoop = setInterval(() => {
                if (this.updating) {
                    JSONSender.sendCommand(this.ws, `/tp @e[tag=${this.tag}] ${this.position.x + this.posOffset.x} ${this.position.y + this.posOffset.y} ${this.position.z + this.posOffset.z} ${this.rotation.y + 260} ${this.rotation.x}`);
                }
            }, 20);
        });

        this.setPosition = (position) => {
            this.initialPosition = position;
        }

        this.rotate = (rotation) => {
            var offset;

            if (this.isFull) {
                offset = new Vec3(-0.6245, -1.106, 0.403);
            } else {
                offset = new Vec3(0, 0, 0);
            }

            // Translate initial position to origin
            let translatedPosition = this.initialPosition.minus(offset);

            // Apply rotation around the y-axis
            let radiansY = (rotation.y * Math.PI) / 180;
            let cosThetaY = Math.cos(radiansY);
            let sinThetaY = Math.sin(radiansY);
            let rotatedX = translatedPosition.x * cosThetaY - translatedPosition.z * sinThetaY;
            let rotatedZ = translatedPosition.x * sinThetaY + translatedPosition.z * cosThetaY;

            translatedPosition = new Vec3(rotatedX, translatedPosition.y, rotatedZ);

            // Apply rotation around the x-axis
            let radiansX = (rotation.x * Math.PI) / 180;
            let cosThetaX = Math.cos(radiansX);
            let sinThetaX = Math.sin(radiansX);
            let rotatedY = translatedPosition.y * cosThetaX - translatedPosition.z * sinThetaX;
            rotatedZ = translatedPosition.y * sinThetaX + translatedPosition.z * cosThetaX;

            // Translate position back to its original location
            const finalPosition = new Vec3(translatedPosition.x, rotatedY, rotatedZ).plus(offset);

            // Update the current position and rotation
            this.position = finalPosition;
            this.rotation = rotation;
        };

        this.destroy = () => {
            clearInterval(this.mainLoop);
        };
    }
}

module.exports = BlockEntity;
