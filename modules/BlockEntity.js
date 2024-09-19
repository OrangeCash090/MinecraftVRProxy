const { Vec3 } = require("vec3");
const JSONSender = require("./JSONSender");

function getOffset(scale) {
    // Coefficients for Y offset quadratic function
    const a_y = -2.33333333;
    const b_y = 16.5;
    const c_y = -14.16666667;

    // Coefficients for Z offset quadratic function
    const a_z = 5.0;
    const b_z = -29.5;
    const c_z = 24.5;

    // Calculate Y and Z offsets using the quadratic functions
    const y_offset = a_y * Math.pow(scale, 2) + b_y * scale + c_y;
    const z_offset = a_z * Math.pow(scale, 2) + b_z * scale + c_z;

    // The X offset remains 0, as no change in X was observed
    const x_offset = 0;

    // Return a Vec3 object with the calculated offsets
    return new Vec3(x_offset, y_offset, z_offset);
}

class BlockEntity {
    constructor(ws, block, name, position) {
        this.ws = ws;
        this.block = block;
        this.name = name;

        this.position = position;
        this.rotation = new Vec3(0,0,0);

        this.offset = new Vec3(0,0,0);
        this.size = 1;

        this.tick = 0;
        this.updating = false;

        JSONSender.makeDisplayBlock(this.ws, this.position, this.block, this.name).then(() => {
            this.mainLoop = setInterval(() => {
                if (this.updating) {
                    JSONSender.sendCommand(this.ws, `/tp @e[type=fox,name=${this.name}] ${this.position.x} ${this.position.y} ${this.position.z}`);
                    JSONSender.sendCommand(this.ws, `/playanimation @e[type=fox,name=${this.name}] animation.creeper.swelling none 0 "v.tick=${this.tick};v.xbasepos=${this.offset.x};v.ybasepos=${this.offset.y};v.zbasepos=${this.offset.z};v.xrot=${this.rotation.x};v.yrot=${this.rotation.y};v.zrot=${this.rotation.z};v.scale=${this.size};v.xzscale=1.0;v.yscale=1.0;v.swelling_scale1=2.1385*math.sqrt(v.xzscale)*math.sqrt(v.scale);v.swelling_scale2=2.1385*math.sqrt(v.yscale)*math.sqrt(v.scale);" scale`);
                    this.tick++;
                }
            }, 20);
        });

        this.scale = (num) => {
            this.size = num;
            this.offset = getOffset(num);
        }

        this.destroy = () => {
            clearInterval(this.mainLoop);
        };
    }
}

module.exports = BlockEntity;