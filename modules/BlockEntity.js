const { Vec3 } = require("vec3");
const JSONSender = require("./JSONSender");

class BlockEntity {
    constructor(ws, block, name, position) {
        this.ws = ws;
        this.block = block;
        this.name = name;

        this.position = position
        this.rotation = new Vec3(0, 0, 0);
        this.size = new Vec3(1,1,1)

        this.updating = false;

        JSONSender.makeDisplayBlock(this.ws, this.position, this.block, this.name).then(() => {
            this.mainLoop = setInterval(() => {
                if (this.updating) {
                    JSONSender.sendCommand(this.ws, `/tp @e[type=fox,name=${this.name}] ${this.position.x} ${this.position.y} ${this.position.z}`);
                    JSONSender.sendCommand(this.ws, `/playanimation @e[type=fox,name=${this.name}] animation.creeper.swelling none 0 "v.xrot=${this.rotation.x};v.yrot=${this.rotation.y};v.zrot=${this.rotation.z};v.scale=1;v.xzscale=1;v.yscale=1;" scale`);
                }
            }, 20);
        });

        this.destroy = () => {
            clearInterval(this.mainLoop);
        };
    }
}

module.exports = BlockEntity;