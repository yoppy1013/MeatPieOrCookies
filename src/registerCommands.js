const {
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");

module.exports = async function registerCommands(token, appId) {

    console.log("registerCommands appId=", appId);
    
  const commands = [
    new SlashCommandBuilder()
      .setName("yokoso")
      .setDescription("このチャンネルにミートパイかクッキーを送る"),

    new SlashCommandBuilder()
      .setName("voice")
      .setDescription("このチャンネルをVCログ送信先に設定する"),

    new SlashCommandBuilder()
      .setName("meshitero")
      .setDescription("このチャンネルにめしてろ画像を投稿する"),

    new SlashCommandBuilder()
      .setName("sake")
      .setDescription("このチャンネルに酒画像を投稿する"),

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
      .setName("source_meshi")
      .setDescription("めしてろの抽出元チャンネルを設定")
      .addChannelOption(opt =>
        opt
          .setName("channel")
          .setDescription("抽出元チャンネル")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("source_sake")
      .setDescription("酒の抽出元チャンネルを設定")
      .addChannelOption(opt =>
        opt
          .setName("channel")
          .setDescription("抽出元チャンネル")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      ),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(appId), { body: commands });
};
