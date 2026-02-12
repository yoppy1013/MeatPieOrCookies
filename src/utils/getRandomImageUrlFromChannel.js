const pickRandom = require("./pickRandom");
const extractImageUrls = require("./extractImageUrls");

module.exports = async function getRandomImageUrlFromChannel(guild, channelId) {
  const ch = await guild.channels.fetch(channelId).catch(() => null);
  if (!ch || !ch.isTextBased()) return null;

  const MAX_PAGES = 10;
  const PAGE_SIZE = 100;

  let before;
  const candidates = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const messages = await ch.messages.fetch({ limit: PAGE_SIZE, before }).catch(() => null);
    if (!messages || messages.size === 0) break;

    for (const msg of messages.values()) {
      const urls = extractImageUrls(msg);
      for (const url of urls) candidates.push({ url, jumpLink: msg.url });
    }

    before = messages.last().id;
    if (candidates.length >= 200) break;
  }

  if (candidates.length === 0) return null;
  return pickRandom(candidates);
};
