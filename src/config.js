require("dotenv").config();
const path = require("path");

module.exports = {
  TOKEN: process.env.DISCORD_BOT_TOKEN,
  APP_ID: process.env.DISCORD_APP_ID,

  // ロールID
  ROLE_ID: "1439924125685649459",

  // 画像パス
    MENTION_IMAGE: path.join(__dirname, "..", "images", "mention.png"),
  YONDENAI_IMAGE: path.join(__dirname, "..", "images", "yondenai.png"),

};
