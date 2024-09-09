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

async function queryTarget(ws, target, extra) {
    var response = await commandWithResponse(ws, `/querytarget ${target}`)
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
        var blocks = [];
        var coords = [];
    
        var xIterator = end.x < start.x ? -1 : 1;
        var yIterator = end.y < start.y ? -1 : 1;
        var zIterator = end.z < start.z ? -1 : 1;
    
        // Collect all coordinates within the given start and end bounds
        for (let x = start.x; (xIterator > 0 ? x <= end.x : x >= end.x); x += xIterator) {
            for (let y = start.y; (yIterator > 0 ? y <= end.y : y >= end.y); y += yIterator) {
                for (let z = start.z; (zIterator > 0 ? z <= end.z : z >= end.z); z += zIterator) {
                    coords.push(new Vec3(x, y, z));
                }
            }
        }
    
        for (let i = 0; i < coords.length; i++) {
            for (let j = 0; j < 99; j++) {
                if (coords[(i * 99) + j] != undefined) {
                    blocks.push(getBlock(ws, coords[(i * 99) + j]));
                } else {
                    resolve([await Promise.all(blocks), coords]);
                }
            }
    
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    })
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

async function makeDisplayBlock(ws, pos, block, id, full = true) {
    return new Promise(async (resolve, reject) => {
        var commands;

        if (full) {
            commands = [
                `/summon armor_stand Grumm ${pos.x} ${pos.y} ${pos.z}`,
                `/tag @e[type=armor_stand,name=Grumm,tag=!"set",c=1] add "${id}"`,
                `/tag @e[type=armor_stand,name=Grumm,tag=!"set",c=1] add set`,
                `/execute as @e[tag="${id}"] at @s run tp @s ~~~ 260`,
                `/effect @e[tag="${id}"] invisibility 999999 255 true`,
                `/replaceitem entity @e[tag="${id}"] slot.weapon.mainhand 0 ${block}`,
                `/playanimation @e[tag="${id}"] animation.armor_stand.entertain_pose null 0 "0" align.arms`,
                `/playanimation @e[tag="${id}"] animation.player.move.arms.zombie null 0 "0" size.mini_block`,
                `/playanimation @e[tag="${id}"] animation.ghast.scale null 0 "0" size.full_block`,
                `/playanimation @e[tag="${id}"] animation.fireworks_rocket.move null 0 "0" align.full_block`,
                `/execute as @e[tag="${id}"] at @s run tp ~~~`
            ];
        } else {
            commands = [
                `/summon armor_stand Grumm ${pos.x} ${pos.y} ${pos.z}`,
                `/tag @e[type=armor_stand,name=Grumm,tag=!"set",c=1] add "${id}"`,
                `/tag @e[type=armor_stand,name=Grumm,tag=!"set",c=1] add set`,
                `/execute as @e[tag="${id}"] at @s run tp @s ~~~ 260`,
                `/effect @e[tag="${id}"] invisibility 999999 255 true`,
                `/replaceitem entity @e[tag="${id}"] slot.weapon.mainhand 0 ${block}`,
                `/playanimation @e[tag="${id}"] animation.armor_stand.entertain_pose null 0 "0" align.arms`,
                `/playanimation @e[tag="${id}"] animation.player.move.arms.zombie null 0 "0" size.mini_block`,
                `/execute as @e[tag="${id}"] at @s run tp ~~~`
            ];
        }

        await (async function cmdLoop(i) {
            setTimeout(async () => {
                await commandWithResponse(ws, commands[commands.length - i]);
                if (--i) {
                    cmdLoop(i)
                } else {
                    resolve("Finished.");
                }
            }, 20)
        })(commands.length);
    })
}

module.exports = { sendCommand, commandWithResponse, sendSubscribe, subscribeAll, sayText, sendTitle, queryTarget, getBlock, getChunk, raycastBlock, makeDisplayBlock }
