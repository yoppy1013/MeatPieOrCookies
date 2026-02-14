const {
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
require("dotenv").config();

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

module.exports = async function registerCommands(token, appId, guildId) {

    console.log("registerCommands appId=", appId);

    if (!guildId) {
      throw new Error("guildIdが不明です\n環境変数DISCORD_GUILD_IDを確認してください");
    }

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

    new SlashCommandBuilder()
      .setName("yokoso")
      .setDescription("入室時メッセージを表示する"),

    new SlashCommandBuilder()
     .setName("timer")
      .setDescription("指定時刻に自分をVCから切断するタイマー")
      .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("タイマーを設定する")
      .addStringOption((opt) =>
        opt
          .setName("time")
          .setDescription("時刻（HH:MM または HH:MM:SS）JST")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) => sub.setName("cancel").setDescription("タイマーを解除する"))
  .addSubcommand((sub) => sub.setName("status").setDescription("タイマーの残り時間を表示する"))
  ].map(c => c.toJSON());


  const rest = new REST({ version: "10" }).setToken(token);

  /*
  await rest.put(Routes.applicationCommands(appId), { body: [] });
  await rest.put(
    Routes.applicationCommands(appId),
    { body: commands }
  );
  */
  console.log("commands delete start");
await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
console.log("commands delete ok");

const timeout = (ms) =>
  new Promise((_, rej) => setTimeout(() => rej(new Error("REST timeout")), ms));

console.log("commands register start", commands.length);

try {
  const res = await Promise.race([
    rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands }),
    timeout(15000),
  ]);

  console.log("commands register ok", Array.isArray(res) ? res.length : res);
} catch (e) {
  console.error("commands register FAILED", e);
}



};
