const { MessageEmbed } = require("discord.js");
const cheerio = require("cheerio");
const request = require("request");

const url = "https://finviz.com/";

const createEmbed = (rowData) => {
  /* Creates a MessageEmbed Object, for display Purposed.
  rowData:  List of objects with `key`: `value` pairs to display header and content of each field
  */
  const e = new MessageEmbed();
  console.log("Row Data", rowData);
  rowData.forEach((row) => {
    e.addField(row.key, row.value);
  });
  return e;
};

const downloadPage = (url) => {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        console.error("Failed to Fetch URL:", error);
        reject(error);
      }
      if (response.statusCode != 200) {
        console.error(`Invalid Status Code <${response.statusCode}>`);
        reject("Invalid status code <" + response.statusCode + ">");
      }
      resolve(body);
    });
  });
};

exports.process = async (message) => {
  const page = await downloadPage(url);
  const $ = cheerio.load(page);
  const data = $(
    "#homepage > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:first-child > table > tbody > tr:not(:first-child)"
  );
  const rows = Array.from(data).map((r) => {
    const $$ = cheerio.load(r);
    // [TODO]: May need to format these strings.
    const ticker = $$("td:first-child > a").text();
    const last = $$("td:nth-child(2)").text();
    const change = $$("td:nth-child(3) > span").text();
    const volume = $$("td:nth-child(4)").text();
    const signal = $$("td:last-child > a").text();
    return {
      ticker: ticker,
      signal: signal,
      change: change,
      last: last,
      volume: volume,
    };
  });
  console.log(rows);
  const gainers = rows.filter(
    (obj) => obj.signal.toLowerCase() === "Top Gainers".toLowerCase()
  );
  let e = createEmbed(
    gainers.map((g) => ({
      key: g.ticker,
      value: `Change: ${g.change}, Volume: ${g.volume}`,
    }))
  );
  e.setTitle("Top Gainers");
  e.setFooter("Live Data from the FinViz website.");
  e.setURL("https://finviz.com/screener.ashx?v=340&s=ta_topgainers");
  console.log("Embed Created");
  message.channel.send({
    embed: e,
  });
};
