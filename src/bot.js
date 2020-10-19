const { Client, MessageEmbed } = require("discord.js");
const _METADATA = require("./config").get();
const FINVIZ = require("./finviz");

const client = new Client({
  partials: ["MESSAGE", "REACTION"],
});

const PREFIX = "!";

//Welcome Message:
client.on("guildMemberAdd", (member) => {
  /// This Requires a channel named "welcome"
  const rslt = member.guild.channels.cache.filter((channel) => {
    return channel.name.toLowerCase().startsWith("welcome");
  });
  if (rslt.size === 0) {
    console.log("Invalid Channel Lookup.");
    return;
  }
  const embed = new MessageEmbed();
  embed.setImage(
    "https://cdn.discordapp.com/attachments/750512393120907344/767551173628395540/image0.jpg"
  );
  embed.setAuthor("The Mountaintop Mentality Team.");
  embed.addField(
    "Message From The Team!",
    `Hey there @${member.nickname}, We wanted to welcome you to the team.  Here at Mountaintop Mentality, we are a team of people who want to make all of our dreams come true.  With practice, and patience, we are able to develop a solid trading plan and teach you enough to find great stocks and options yourself.  We hope you enjoy your time with us and remember! We will climb and make it up to the peak, together.`
  );
  embed.addField("Questions:", "Reach out to our team!", true);
  embed.addField(
    "Intros:",
    "Feel free to introduce yourself so we can gauge your interest and passions.",
    true
  );
  embed.addField(
    "What We Offer:",
    "daily trades, ai bots, live call outs and much more!"
  );
  rslt.first().send(`Welcome <@${member.id}>!`);
  rslt.first().send({ embed: embed });
});

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
      message.channel.send({ embed: em });
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
