
const process = require("process");

const _METADATA = {
	"token": process.env.DISCORD_TOKEN || ""
}

exports.get = () => _METADATA;
