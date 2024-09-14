const JSONSender = require("./JSONSender");
const PlayerHandler = require("./PlayerHandler");
const { CFrame, CFAngles } = require("./CFrame");
const {Mesh, Cube} = require("./Mesh");
const { Vec3 } = require("vec3");

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

class VRHandler {
    constructor (ws, vrSocket) {
        this.loadingWorld = false;
        this.trackingPlayers = true;
        this.rendering = true;

        this.headCube = new Cube(ws, 3);
        this.leftCube = new Cube(ws, 1);
        this.rightCube = new Cube(ws, 1);
        
        this.headCube.size = new Vec3(1, 1, 1);
        this.leftCube.size = new Vec3(0.5, 0.5, 0.5);
        this.rightCube.size = new Vec3(0.5, 0.5, 0.5);

        vrSocket.on("VRTrackingData", (vrTrackers) => {
            if (this.rendering) {
                var head = vrTrackers.head;
                var leftHand = vrTrackers.lefthand;
                var rightHand = vrTrackers.righthand;
    
                this.headCube.cframe = new CFrame(head.position.x * 4, head.position.y * 4, head.position.z * 4).multiply(CFAngles(toRadians(head.rotation.x), toRadians(head.rotation.y), 0));
                this.leftCube.cframe = new CFrame(leftHand.position.x * 4, leftHand.position.y * 4, leftHand.position.z * 4).multiply(CFAngles(toRadians(leftHand.rotation.x), toRadians(leftHand.rotation.y), 0));
                this.rightCube.cframe = new CFrame(rightHand.position.x * 4, rightHand.position.y * 4, rightHand.position.z * 4).multiply(CFAngles(toRadians(rightHand.rotation.x), toRadians(rightHand.rotation.y), 0));
    
                this.headCube.update();
                this.leftCube.update();
                this.rightCube.update();
            }
        });

        vrSocket.on("RequestChunks", async () => {
            if (!this.loadingWorld) {
                var data = [];

                this.loadingWorld = true;
                this.trackingPlayers = false;
                this.rendering = false;

                await new Promise(resolve => setTimeout(resolve, 1000));
                data = await JSONSender.getChunk(ws, this.headCube.cframe.position);

                this.loadingWorld = false;
                this.trackingPlayers = true;
                this.rendering = true;

                vrSocket.send(JSON.stringify({
                    blockCoords: data
                }));
            }
        })

        vrSocket.on("PlaceBlock", async () => {
            if (!this.loadingWorld) {
                JSONSender.setBlock(ws, this.headCube.cframe.position, "stone");
                vrSocket.send(JSON.stringify({
                    blockCoords: [["minecraft:stone"], [this.headCube.cframe.position]]
                }));
            }
        })

        vrSocket.on("BreakBlock", async () => {
            if (!this.loadingWorld) {
                JSONSender.setBlock(ws, this.headCube.cframe.position, "air");
                vrSocket.send(JSON.stringify({
                    blockCoords: [["minecraft:air"], [this.headCube.cframe.position]]
                }));
            }
        })

        setInterval(async () => {
            if (this.trackingPlayers) {
                var currentPlayers = await PlayerHandler.onlinePlayers(ws);
                var playerTransforms = {};
                
                for (let [name, player] of Object.entries(currentPlayers)) {
                    var transform = await player.getTransform();
                    playerTransforms[player.username] = transform;
                }
                
                vrSocket.send(JSON.stringify({
                    playerTransforms: playerTransforms
                }));
            }
        }, 150);
    }
}

module.exports = VRHandler;
