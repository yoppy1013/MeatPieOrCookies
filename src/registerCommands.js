const { REST, Routes, SlashCommandBuilder,ChannelType } = require("discord.js");

module.exports = async function registerCommands(token, appId, guildId) {
  console.log("--- 個別登録プロセス開始 ---");
  const rest = new REST({ version: "10" }).setToken(token);

  const commands = [
    new SlashCommandBuilder().setName("status").setDescription("現在の設定表示"),
    new SlashCommandBuilder().setName("welcome").setDescription("ミートパイかクッキーを送る"),
    new SlashCommandBuilder().setName("stamsg").setDescription("VCステータス通知先設定"),
    new SlashCommandBuilder().setName("roll").setDescription("許可追加").addMentionableOption(o => o.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName("deroll").setDescription("許可剥奪").addMentionableOption(o => o.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName('ignore').setDescription('指定したVCを通知除外対象にします')
      .addChannelOption(option => option.setName('channel')
      .setDescription('除外したいボイスチャンネルを選択してください')
      .addChannelTypes(ChannelType.GuildVoice)
      .setRequired(true)
  ),
    new SlashCommandBuilder().setName("meshitero").setDescription("めしてろ"),
    new SlashCommandBuilder().setName("sake").setDescription("ガハハ！"),
    new SlashCommandBuilder().setName("welroll").setDescription("入室時ロール追加").addRoleOption(o => o.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("dewelroll").setDescription("入室時ロール解除").addRoleOption(o => o.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("yokoso").setDescription("入室メッセージ表示"),
    new SlashCommandBuilder().setName("timer").setDescription("VC切断タイマー").addSubcommand(s => s.setName("set").setDescription("設定").addStringOption(o => o.setName("time").setDescription("HH:MM").setRequired(true))).addSubcommand(s => s.setName("cancel").setDescription("解除")).addSubcommand(s => s.setName("status").setDescription("確認")),
    new SlashCommandBuilder().setName("voicelog").setDescription("VCログ送信先設定"),
  ].map(c => c.toJSON());

  console.log(`全 ${commands.length} 個を一括登録します...`);
  await rest.put(
    Routes.applicationGuildCommands(appId, guildId),
    { body: commands }
  );
  console.log("--- 登録プロセス完了 ---");
};