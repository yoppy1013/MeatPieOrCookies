const registerCommands = require("../registerCommands");
require("dotenv").config();

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const guildId = process.env.DISCORD_GUILD_ID;

(async () => {
  try {
    await registerCommands(token, appId, guildId);
    console.log("コマンドの更新が完了しました。");
  } catch (error) {
    console.error("更新中にエラーが発生しました:", error);
  }
})();