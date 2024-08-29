const BedrockWS = require("./modules/BedrockWS")

console.log(process.env.PORT)
new BedrockWS(process.env.PORT || 80);

// Possible Ideas
// - Controls using ItemInteracted and different items
// - mesh maker for worldedit
// - brush for worldedit
// - other shapes for worldedit
