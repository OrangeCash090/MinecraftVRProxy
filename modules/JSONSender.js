const uuid4 = require("uuid4");
const { Vec3 } = require("vec3");
const fs = require("fs");

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

const events = [
    "AwardAchievement",
    "BlockBroken",
    "BlockPlaced",
    "BookEdited",
    "EndOfDay",
    "GameRulesLoaded",
    "GameRulesUpdated",
    "ItemAcquired",
    "ItemCrafted",
    "ItemDropped",
    "ItemEquipped",
    "ItemInteracted",
    "ItemNamed",
    "ItemSmelted",
    "ItemUsed",
    "MobBorn",
    "MobInteracted",
    "MobKilled",
    "PlayerMessage",
    "PlayerTeleported",
    "PlayerTransform",
    "PlayerTravelled",
    "ScreenChanged",
    "ScriptLoaded",
    "ScriptRan",
    "SignInToXBOXLive",
    "SignOutOfXBOXLive",
    "SignedBookOpened",
    "SlashCommandExecuted",
    "StartWorld",
    "VehicleExited",
    "WorldGenerated",
    "WorldLoaded"
]

async function sendWithResponse(ws, data, reqID, cmd) {
    return new Promise((resolve, reject) => {
        ws.responseResolvers.set(reqID, { resolve, reject, cmd: cmd });

        ws.send(data, (error) => {
            if (error) {
                ws.responseResolvers.delete(reqID); // Clean up on error
                reject(error);
            }
        });
    });
}

function sendCommand(ws, cmd) {
    ws.send(JSON.stringify({
        header: {
            version: 1,
            requestId: uuid4(),
            messageType: "commandRequest",
            messagePurpose: "commandRequest"
        },
        body: {
            version: 70,
            commandLine: cmd,
            origin: {
                type: "server"
            }
        }
    }))
}

async function commandWithResponse(ws, cmd) {
    var reqID = uuid4();

    var response = await sendWithResponse(ws, JSON.stringify({
        header: {
            version: 1,
            requestId: reqID,
            messageType: "commandRequest",
            messagePurpose: "commandRequest"
        },
        body: {
            version: 70,
            commandLine: cmd,
            origin: {
                type: "server"
            }
        }
    }), reqID, cmd)

    return response.body;
}

function sendSubscribe(ws, event) {
    ws.send(JSON.stringify({
        header: {
            version: 1,
            requestId: uuid4(),
            messagePurpose: "subscribe"
        },
        body: {
            eventName: event
        }
    }))
}

function subscribeAll(ws) {
    // I would not recommend using this.
    for (let i = 0; i < events.length; i++) {
        sendSubscribe(ws, events[i]);
    }
}

function sayText(ws, text, player = "@a", messageType) {
    var messageSound = "";

    switch (messageType) {
        case "generic":
            text = "§7" + text;
            messageSound = "note.hat";
            break;

        case "error":
            text = "§c" + text;
            messageSound = "note.bass";
            break;

        case "log":
            text = "§n" + text;
            messageSound = "note.bd";
            break;

        case "warning":
            text = "§g" + text;
            messageSound = "note.banjo";
            break;
    }

    sendCommand(ws, `/tellraw ${player} {"rawtext":[{"text":"${text}"}]}`);
    sendCommand(ws, `/execute as ${player} at @s run playsound ${messageSound} @s ~~~ 1`);
}

function sendTitle(ws, text, player, type = "actionbar") {
    sendCommand(ws, `/titleraw ${player} ${type} {"rawtext":[{"text":"${text}"}]}`);
}

function setBlock(ws, pos, block) {
    sendCommand(ws, `/setblock ${pos.x} ${pos.y} ${pos.z} ${block}`);
}

async function queryTarget(ws, target, extra) {
    var response = await commandWithResponse(ws, `/querytarget ${target}`);
    var data = {}

    if (response.details != undefined && response.statusCode != -2147352576) {
        var parsed = JSON.parse(response.details)[0];

        data.position = new Vec3(parsed.position.x, parsed.position.y - 1.6200103759765625, parsed.position.z);
        data.roundedPosition = new Vec3(Math.floor(parsed.position.x), Math.floor(parsed.position.y - 1.6200103759765625), Math.floor(parsed.position.z));
        data.yRot = parsed.yRot;
        data.id = parsed.id;

        if (extra) {
            var tag = "__LOOKMARKER";

            sendCommand(ws, `/execute at ${target} run summon armor_stand ${tag} ^ ^+1.62 ^+10`);
            sendCommand(ws, `/effect @e[name="${tag}"] invisibility 99999 255 true`);

            await queryTarget(ws, `@e[name="${tag}"]`).then(async (properties) => {
                sendCommand(ws, `/kill @e[name="${tag}"]`);

                if (properties.position != undefined) {
                    var otherPos = properties.position;

                    var dx = otherPos.x - data.position.x
                    var dy = otherPos.y - data.position.y
                    var dz = otherPos.z - data.position.z

                    var distanceXZ = Math.sqrt(dx * dx + dz * dz);
                    var pitch = Math.atan2(dy, distanceXZ);

                    data.xRot = (pitch * 180) / Math.PI
                    data.lookVector = new Vec3(-(Math.cos(pitch) * Math.sin(toRadians(data.yRot))), Math.sin(pitch), Math.cos(pitch) * Math.cos(toRadians(data.yRot)));
                }
            })
        }
    }

    return data;
}

async function getBlock(ws, pos) {
    return new Promise(async (resolve, reject) => {
        var response = await commandWithResponse(ws, `/testforblock ${pos.x} ${pos.y} ${pos.z} structure_void`);
        var block = "minecraft:" + response.statusMessage.split(" is ")[1];
        block = block.substring(0, block.indexOf(" (")).toLowerCase().replace(" ", "_").replace(" ", "_").replace(" ", "_");

        resolve(block);
    })
}

async function getArea(ws, start, end) {
    return new Promise(async (resolve, reject) => {
        let blocks = new Map();  // Use a map to store blocks and their positions
        let coords = [];
    
        let xIterator = end.x < start.x ? -1 : 1;
        let yIterator = end.y < start.y ? -1 : 1;
        let zIterator = end.z < start.z ? -1 : 1;
    
        for (let x = start.x; (xIterator > 0 ? x <= end.x : x >= end.x); x += xIterator) {
            for (let y = start.y; (yIterator > 0 ? y <= end.y : y >= end.y); y += yIterator) {
                for (let z = start.z; (zIterator > 0 ? z <= end.z : z >= end.z); z += zIterator) {
                    coords.push(new Vec3(x, y, z));
                }
            }
        }

        // Send all the commands without waiting for each one to finish
        for (let i = 0; i < coords.length; i++) {
            if (i % 90 == 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            getBlock(ws, coords[i]).then(async block => {
                blocks.set(`${coords[i].x},${coords[i].y},${coords[i].z}`, block);
                
                // If all blocks have been received, resolve the promise
                if (blocks.size === coords.length) {
                    resolve([Array.from(blocks.values()), coords]);
                }
            }).catch(error => {
                console.error(`Error fetching block at ${coords[i]}:`, error);
            });
        }
    });
}

async function getChunk(ws, pos) {
    var start = new Vec3(Math.floor(pos.x / 16) * 16, Math.floor(pos.y / 16) * 16, Math.floor(pos.z / 16) * 16);
    var end = new Vec3(start.x + 15, start.y + 15, start.z + 15);
    
    return await getArea(ws, start, end);
}

async function raycastBlock(ws, origin, direction, range=5) {
    return new Promise(async (resolve, reject) => {
        var blocks = [];

        for (let i = 0; i < range; i++) {
            var pos = new Vec3(Math.floor(origin.x + (direction.x * (i))), Math.floor(origin.y + (direction.y * (i))), Math.floor(origin.z + (direction.z * (i))));
            blocks.push({
                name: getBlock(ws, pos),
                pos: pos
            });
        }

        for (let i = 0; i < blocks.length; i++) {
            if (await blocks[i].name != "minecraft:air") {
                resolve([await blocks[i].name, blocks[i].pos])
            }
        }

        resolve(["minecraft:air", new Vec3(69420, 0, 0)]);
    });
}

async function makeDisplayBlock(ws, pos, block, id) {
    return new Promise(async (resolve, reject) => {
        var commands = [
            `/summon fox ${id} ${pos.x} ${pos.y} ${pos.z}`,
            `/replaceitem entity @e[type=fox,name=${id}] slot.weapon.mainhand 0 ${block}`,
            `/effect @e[type=fox,name=${id}] instant_health 9999999 255 true`,
            `/effect @e[type=fox,name=${id}] resistance 999999 255 true`,
            `/playanimation @e[type=fox,name=${id}] animation.player.sleeping none 0 "" controller.animation.fox.move`,
            `/playanimation @e[type=fox,name=${id}] animation.creeper.swelling none 0 "v.xbasepos=0;v.ybasepos=0;v.zbasepos=0;v.xpos=0;v.ypos=0;v.zpos=0;v.xrot=0;v.yrot=0;v.zrot=0;v.scale=1;v.xzscale=1;v.yscale=1;v.swelling_scale1=2.1385*math.sqrt(v.xzscale)*math.sqrt(v.scale);v.swelling_scale2=2.1385*math.sqrt(v.yscale)*math.sqrt(v.scale);" scale`,
            `/playanimation @e[type=fox,name=${id}] animation.ender_dragon.neck_head_movement none 0 "v.head_rotation_x=0;v.head_rotation_y=0;v.head_rotation_z=0;v.head_position_x=v.xbasepos*3741/8000;v.head_position_y=10.6925+v.ybasepos*3741/8000;v.head_position_z=17.108-v.zbasepos*3741/8000;" posshift`,
            `/playanimation @e[type=fox,name=${id}] animation.warden.move none 0 "v.body_x_rot=90+v.xrot;v.body_z_rot=90+v.yrot;" xyrot`,
            `/playanimation @e[type=fox,name=${id}] animation.player.attack.rotations none 0 "v.attack_body_rot_y=-v.zrot;" zrot`,
            `/playanimation @e[type=fox,name=${id}] animation.parrot.moving none 0 "v.wing_flap=(16-v.xpos)/0.3;" xpos`,
            `/playanimation @e[type=fox,name=${id}] animation.minecart.move.v1.0 none 0 "v.rail_offset.x=0;v.rail_offset.y=1.6562+v.ypos/16+(math.cos(v.yrot)-1)*0.00769;v.rail_offset.z=0;" ypos`,
            `/playanimation @e[type=fox,name=${id}] animation.parrot.dance none 0 "v.dance.x=-v.zpos-math.sin(v.yrot)*0.123;v.dance.y=0;" zpos`
        ];

        for (let i = 0; i < commands.length; i++) {
            sendCommand(ws, commands[i]);
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        resolve();
    })
}

module.exports = { sendCommand, commandWithResponse, sendSubscribe, subscribeAll, sayText, sendTitle, setBlock, queryTarget, getBlock, getChunk, raycastBlock, makeDisplayBlock }
