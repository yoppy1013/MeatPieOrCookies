require("dotenv").config();

module.exports = {
  TOKEN: process.env.DISCORD_BOT_TOKEN,

  // チャンネルID
  WELCOME_CHANNEL_ID: "1439923741588193415",
  VOICE_LOG_CHANNEL_ID: "1440345393249648721",

  // ロールID
  ROLE_ID: "1439924125685649459",

  // 画像パス（ローカルファイル）
    MENTION_IMAGE: path.join(__dirname, "..", "images", "mention.png"),
  YONDENAI_IMAGE: path.join(__dirname, "..", "images", "yondenai.png"),

  // 画像抽出元チャンネルID
  MESHI_CHANNEL_ID: "1439927223590195262",
  SAKE_CHANNEL_ID: "1461713509044850728",
};
