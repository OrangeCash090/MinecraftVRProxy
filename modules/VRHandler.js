const JSONSender = require("./JSONSender");
const PlayerHandler = require("./PlayerHandler");
const BlockEntity = require("./BlockEntity");
const { Vec3 } = require("vec3");

class VRHandler {
    constructor (ws, vrSocket) {
        this.loadingWorld = false;
        this.trackingPlayers = true;
        this.rendering = false;
        this.pickedBlock = "stone";

        this.makeBody = async () => {
            this.headCube = new BlockEntity(ws, "gold_block", "head", new Vec3(0,0,0));
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.leftCube = new BlockEntity(ws, "gold_block", "left", new Vec3(0,0,0));
            this.leftCube.scale(0.5);
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.rightCube = new BlockEntity(ws, "gold_block", "right", new Vec3(0,0,0));
            this.rightCube.scale(0.5);
            await new Promise(resolve => setTimeout(resolve, 1000));
    
            this.headCube.updating = true;
            this.leftCube.updating = true;
            this.rightCube.updating = true;
            this.rendering = true;
        }

        this.makeBody();

        vrSocket.on("VRTrackingData", (vrTrackers) => {
            if (this.rendering) {
                var head = vrTrackers.head;
                var leftHand = vrTrackers.lefthand;
                var rightHand = vrTrackers.righthand;
    
                this.headCube.position = new Vec3(head.position.x * 4, head.position.y * 4, head.position.z * 4);
                this.headCube.rotation = new Vec3(head.rotation.x, head.rotation.y, head.rotation.z);

                this.leftCube.position = new Vec3(leftHand.position.x * 4, leftHand.position.y * 4, leftHand.position.z * 4);
                this.leftCube.rotation = new Vec3(leftHand.rotation.x, leftHand.rotation.y, leftHand.rotation.z);

                this.rightCube.position = new Vec3(rightHand.position.x * 4, rightHand.position.y * 4, rightHand.position.z * 4);
                this.rightCube.rotation = new Vec3(rightHand.rotation.x, rightHand.rotation.y, rightHand.rotation.z);
            }
        });

        vrSocket.on("RequestChunks", async () => {
            if (!this.loadingWorld) {
                var data = [];

                this.loadingWorld = true;
                this.trackingPlayers = false;

                this.rendering = false;
                this.headCube.updating = false;
                this.leftCube.updating = false;
                this.rightCube.updating = false;

                await new Promise(resolve => setTimeout(resolve, 1000));
                data = await JSONSender.getChunk(ws, this.headCube.position);

                this.loadingWorld = false;
                this.trackingPlayers = true;

                this.rendering = true;
                this.headCube.updating = true;
                this.leftCube.updating = true;
                this.rightCube.updating = true;

                vrSocket.send(JSON.stringify({
                    blockCoords: data
                }));
            }
        })

        vrSocket.on("PlaceBlock", async () => {
            if (!this.loadingWorld) {
                JSONSender.setBlock(ws, this.rightCube.position, this.pickedBlock);
                vrSocket.send(JSON.stringify({
                    blockCoords: [[this.pickedBlock], [this.rightCube.position.floored()]]
                }));
            }
        })

        vrSocket.on("BreakBlock", async () => {
            if (!this.loadingWorld) {
                JSONSender.setBlock(ws, this.rightCube.position, "air");
                vrSocket.send(JSON.stringify({
                    blockCoords: [["minecraft:air"], [this.rightCube.position.floored()]]
                }));
            }
        })

        vrSocket.on("PickBlock", async () => {
            this.pickedBlock = (await JSONSender.getBlock(ws, this.rightCube.position.floored()));
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
