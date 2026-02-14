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
      .setName("welcome")
      .setDescription("このチャンネルにミートパイかクッキーを送る"),

    new SlashCommandBuilder()
      .setName("voice")
      .setDescription("このチャンネルをVCログ送信先に設定する"),

    new SlashCommandBuilder()
      .setName("stamsg")
      .setDescription("このチャンネルをVCステータスメッセージ変更通知の送信先に設定する"),

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

    // 無視設定
    new SlashCommandBuilder()
      .setName("ignore")
      .setDescription("現在参加しているVCを通知対象外にする"),

    // 抽出元設定
    new SlashCommandBuilder()
      .setName("meshitero")
      .setDescription("このチャンネルからめしてろをする")
    ,

    new SlashCommandBuilder()
      .setName("sake")
      .setDescription("このチャンネルからガハハ！をする")
    ,
    
    new SlashCommandBuilder()
      .setName("welroll")
      .setDescription("入室時に付与するロールを追加する")
      .addRoleOption(opt =>
      opt.setName("role").setDescription("付与するロール").setRequired(true)
    ),

    new SlashCommandBuilder()
      .setName("dewelroll")
      .setDescription("入室時に付与するロールを解除する")
    .addRoleOption(opt =>
      opt.setName("role").setDescription("解除するロール").setRequired(true)
    ),

    new SlashCommandBuilder()
      .setName("status")
      .setDescription("現在のサーバ設定を表示"),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(token);

  /*
  await rest.put(Routes.applicationCommands(appId), { body: [] });
  await rest.put(
    Routes.applicationCommands(appId),
    { body: commands }
  );
  */
  await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
  await rest.put(
    Routes.applicationGuildCommands(appId, guildId),
    { body: commands },
  );

};
