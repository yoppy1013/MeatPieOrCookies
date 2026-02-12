const {
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
require("dotenv").config();
const guildId = process.env.DISCORD_GUILD_ID;

module.exports = async function registerCommands(token, appId) {

    console.log("registerCommands appId=", appId);

  const commands = [
    new SlashCommandBuilder()
      .setName("yokoso")
      .setDescription("このチャンネルにミートパイかクッキーを送る"),

    new SlashCommandBuilder()
      .setName("voice")
      .setDescription("このチャンネルをVCログ送信先に設定する"),

    // 許可追加
    new SlashCommandBuilder()
      .setName("roll")
      .setDescription("コマンド実行を許可するロール/ユーザーを追加する")
      .addMentionableOption(opt =>
        opt.setName("target").setDescription("ロール or ユーザー").setRequired(true)
      ),

    // 許可剥奪
    new SlashCommandBuilder()
      .setName("deroll")
      .setDescription("コマンド実行の許可をロール/ユーザーから剥奪する")
      .addMentionableOption(opt =>
        opt.setName("target").setDescription("ロール or ユーザー").setRequired(true)
      ),

    // 抽出元設定
    new SlashCommandBuilder()
      .setName("meshitero")
      .setDescription("このチャンネルからめしてろをする")
      .addChannelOption(opt =>
        opt
          .setName("channel")
          .setDescription("抽出元チャンネル")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("sake")
      .setDescription("このチャンネルからガハハ！をする")
      .addChannelOption(opt =>
        opt
          .setName("channel")
          .setDescription("抽出元チャンネル")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      ),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(token);
  /*
  await rest.put(
  Routes.applicationGuildCommands(appId, process.env.DISCORD_GUILD_ID),
  { body: commands }
);
*/
await rest.put(Routes.applicationCommands(appId), { body: [] });
//await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
//await rest.put(Routes.applicationCommands(appId), { body: commands });

};
