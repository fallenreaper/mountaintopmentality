const { Client, MessageEmbed } = require("discord.js");
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
    case "help":
      const em = new MessageEmbed();
      em.setTitle("Help Menu");
      em.setFooter("This will continually be updated over time.");
      const types = [
        { t: "!help", d: "Help menu" },
        { t: "!nh", d: "Top New Highs" },
        { t: "!nl", d: "Top New Lows" },
        { t: "!gainers", d: "Top Gainers" },
        { t: "!losers", d: "Top Losers" },
        {
          t: "!chart",
          d:
            "allows you to look up charts. !chart [ticker] [d|w|m] [ta]\nExample: `!chart aapl d`, `!chart ba m`, `!chart aapl d ta`\n If you want to see a ta, use 'd' only.",
        },
      ].forEach((i) => {
        em.addField(i.t, i.d);
      });
			message.channel.send({embed: em})
      break;
    case "nh":
      FINVIZ.newHigh(message);
      break;
    case "nl":
      FINVIZ.newLow(message);
      break;
    case "gainers":
      FINVIZ.gainers(message);
      break;
    case "losers":
      FINVIZ.losers(message);
      break;
    case "chart":
      FINVIZ.chart(message, args);
      break;
  }
});

client.login(_METADATA.token);
