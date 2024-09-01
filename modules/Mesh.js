const { Vec3 } = require("vec3")
const { CFrame, CFAngles, CFVec3 } = require("./CFrame");
const JSONSender = require("./JSONSender");

function getSize(verts) {
    var min = new Vec3(999, 999, 999);
    var max = new Vec3(-999, -999, -999);

    for (let i = 0; i < verts.length; i++) {
        var vertex = verts[i];

        min = new Vec3(Math.min(min.x, vertex.x), Math.min(min.y, vertex.y), Math.min(min.z, vertex.z));
        max = new Vec3(Math.max(max.x, vertex.x), Math.max(max.y, vertex.y), Math.max(max.z, vertex.z));
    }

    return max.minus(min);
}

class Mesh {
    constructor(ws, verticies, connections = [], detail = 3) {
        this.ws = ws;

        this.name = "Shape"
        this.detail = detail
        this.connections = connections;

        this.origVerticies = structuredClone(verticies);
        this.verticies = verticies;

        this.cframe = new CFrame(0, 0, 0);
        this.size = getSize(this.origVerticies);
    }

    scaleTo(x, y, z) {
        var scale = new Vec3(x / this.size.x, y / this.size.y, z / this.size.z);

        for (let i = 0; i < this.verticies.length; i++) {
            this.verticies[i] = new Vec3(
                this.verticies[i].x * scale.x,
                this.verticies[i].y * scale.y,
                this.verticies[i].z * scale.z
            )
        }

        this.size = new Vec3(x, y, z);
    }

    setCFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22) {
        var originalSize = getSize(this.origVerticies);
        var scale = new Vec3(this.size.x / originalSize.x, this.size.y / originalSize.y, this.size.z / originalSize.z);

        var scaledMatrix = [
            [r00 * scale.x, r01 * scale.y, r02 * scale.z, x],
            [r10 * scale.x, r11 * scale.y, r12 * scale.z, y],
            [r20 * scale.x, r21 * scale.y, r22 * scale.z, z],
            [0, 0, 0, 1]
        ];

        for (let i = 0; i < this.verticies.length; i++) {
            var origVertex = this.origVerticies[i];

            var transformedMatrix = new Vec3(
                scaledMatrix[0][0] * origVertex.x + scaledMatrix[0][1] * origVertex.y + scaledMatrix[0][2] * origVertex.z + scaledMatrix[0][3],
                scaledMatrix[1][0] * origVertex.x + scaledMatrix[1][1] * origVertex.y + scaledMatrix[1][2] * origVertex.z + scaledMatrix[1][3],
                scaledMatrix[2][0] * origVertex.x + scaledMatrix[2][1] * origVertex.y + scaledMatrix[2][2] * origVertex.z + scaledMatrix[2][3]
            )

            this.verticies[i] = transformedMatrix;
        }

        this.cframe = new CFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22);
    }

    render() {
        if (this.connections.length > 0 && this.detail > 1) {
            for (let i = 0; i < this.connections.length; i++) {
                var pos1 = this.verticies[this.connections[i][0]];
                var pos2 = this.verticies[this.connections[i][1]];
    
                for (let j = 0; j < this.detail; j++) {
                    var t = j / (this.detail - 1); // Parameterization between 0 and 1
                    var x = pos1.x + t * (pos2.x - pos1.x);
                    var y = pos1.y + t * (pos2.y - pos1.y);
                    var z = pos1.z + t * (pos2.z - pos1.z);
    
                    JSONSender.sendCommand(this.ws, `/particle minecraft:electric_spark_particle ${x} ${y} ${z}`);
                }
            }
        } else {
            for (let i = 0; i < this.verticies.length; i++) {
                var vertex = this.verticies[i];
                JSONSender.sendCommand(this.ws, `/particle minecraft:electric_spark_particle ${vertex.x} ${vertex.y} ${vertex.z}`);
            }
        }
    }

    update() {
        var c = this.cframe.components();

        this.setCFrame(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11]);
        this.scaleTo(this.size.x, this.size.y, this.size.z);
        this.render();
    }
}

class Cube extends Mesh {
    constructor(ws, detail = 3) {
        super(ws, [
            new Vec3(1,1,1),
            new Vec3(-1,1,1),
            new Vec3(-1,-1,1),
            new Vec3(-1,-1,-1),
            new Vec3(1,-1,-1),
            new Vec3(1,1,-1),
            new Vec3(-1,1,-1),
            new Vec3(1,-1,1),
        ], [
            [0, 7],
            [0, 1],
            [0, 5],
            [1, 6],
            [1, 2],
            [6, 3],
            [6, 5],
            [5, 4],
            [4, 3],
            [4, 7],
            [2, 3],
            [2, 7]
        ], detail);
    }
}

module.exports = {Mesh, Cube}
