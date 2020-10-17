const { Client } = require("discord.js");
const _METADATA = require("./config").get();
const FINVIZ = require("./finviz");

const client = new Client({
  partials: ["MESSAGE", "REACTION"],
});

const PREFIX = "!";

client.on("message", async (message) => {
  const [CMD, ...args] = message.content
    .trim()
    .substring(PREFIX.length)
    .split(/\s+/);

  switch (CMD) {
    case "gainers":
      FINVIZ.process(message);
      break;
  }
});

client.login(_METADATA.token);
