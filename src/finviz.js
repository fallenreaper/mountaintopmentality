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

const getNegativeChangeData = async () => {
  const querySelector = "#homepage > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr:not(:first-child)";
  const page = await downloadPage(url);
  const $ = cheerio.load(page);
  const data = $(querySelector)
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
  return rows;
}

const getPositiveChangeData = async () => {
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
  return rows;
};

exports.newHigh = async (message) => {
  const rows = await getPositiveChangeData();
  const newHighs = rows.filter(
    (obj) => obj.signal.toLowerCase() === "New High".toLowerCase()
  );
  let e = createEmbed(
    newHighs.map((obj) => ({
      key: obj.ticker,
      value: `Change: ${obj.change}, Volume: ${obj.volume}`,
    }))
  );
  e.setTitle("New Highs");
  e.setFooter("Live Data from the FinViz website.");
  e.setURL("https://finviz.com/screener.ashx?v=340&s=ta_newhigh");
  console.log("Embed Created");
  message.channel.send({
    embed: e,
  });
};

exports.newLow = async (message) => {
  const rows = await getNegativeChangeData();
  const lows = rows.filter(
    (obj) => obj.signal.toLowerCase() === "New Low".toLowerCase()
  );
  let e = createEmbed(
    lows.map((obj) => ({
      key: obj.ticker,
      value: `Change: ${obj.change}, Volume: ${obj.volume}`,
    }))
  );
  e.setTitle("New Lows");
  e.setFooter("Live Data from the FinViz website.");
  e.setURL("https://finviz.com/screener.ashx?v=340&s=ta_newlows");
  console.log("Embed Created");
  message.channel.send({
    embed: e,
  });

}


exports.gainers = async (message) => {
  const rows = await getPositiveChangeData();
  console.log(rows);
  const gainers = rows.filter(
    (obj) => obj.signal.toLowerCase() === "Top Gainers".toLowerCase()
  );
  let e = createEmbed(
    gainers.map((obj) => ({
      key: obj.ticker,
      value: `Change: ${obj.change}, Volume: ${obj.volume}`,
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

exports.losers = async (message) => {
  const rows = await getNegativeChangeData();
  console.log(rows);
  const losers = rows.filter(
    (obj) => obj.signal.toLowerCase() === "Top Losers".toLowerCase()
  );
  let e = createEmbed(
    losers.map((obj) => ({
      key: obj.ticker,
      value: `Change: ${obj.change}, Volume: ${obj.volume}`,
    }))
  );
  e.setTitle("Top Losers");
  e.setFooter("Live Data from the FinViz website.");
  e.setURL("https://finviz.com/screener.ashx?v=340&s=ta_toplosers");
  console.log("Embed Created");
  message.channel.send({
    embed: e,
  });
}

exports.chart = (message, args) => {
  const [ticker, interval, ta] = args
  const bar = interval.substr(0,1).toLowerCase()
  const s = new Set(['d','m','w', 'y'])
  if (!s.has(bar)){
    message.channel.send("Invalid Interval selection.  Needs to be: [d]aily, [w]eekly, [m]onthly, [y]early")
    return
  }
  if (bar != 'd' && ta) {
    message.channel.send("You Currently cant have Weekly Traveling Average from Source Imagery.");
    return;
  }
  const _url = `https://charts2.finviz.com/chart.ashx?t=${ticker.toUpperCase()}&ty=c&ta=${ta?1:0}&p=${bar}&s=l`
  
  const embed = new MessageEmbed()
  embed.setImage(_url)
  message.channel.send({embed})
}