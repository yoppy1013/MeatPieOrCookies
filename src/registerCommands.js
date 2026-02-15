const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

module.exports = async function registerCommands(token, appId, guildId) {
  console.log("--- コマンド登録プロセス開始 ---");
  
  const rest = new REST({ version: "10", timeout: 10000 }).setToken(token);

  const commands = [
    new SlashCommandBuilder().setName("welcome").setDescription("このチャンネルにミートパイかクッキーを送る"),
    new SlashCommandBuilder().setName("stamsg").setDescription("このチャンネルをVCステータスメッセージ変更通知の送信先に設定する"),
    new SlashCommandBuilder().setName("voicelog").setDescription("このチャンネルをVCログ送信先に設定する"),
    new SlashCommandBuilder().setName("roll").setDescription("コマンド実行を許可するロール/ユーザーを追加する").addMentionableOption(opt => opt.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName("deroll").setDescription("コマンド実行の許可を剥奪する").addMentionableOption(opt => opt.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName("ignore").setDescription("現在参加しているVCを通知対象外にする"),
    new SlashCommandBuilder().setName("meshitero").setDescription("このチャンネルからめしてろをする"),
    new SlashCommandBuilder().setName("sake").setDescription("このチャンネルからガハハ！をする"),
    new SlashCommandBuilder().setName("welroll").setDescription("入室時に付与するロールを追加する").addRoleOption(opt => opt.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("dewelroll").setDescription("入室時に付与するロールを解除する").addRoleOption(opt => opt.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("status").setDescription("現在のサーバ設定を表示"),
    new SlashCommandBuilder().setName("yokoso").setDescription("入室時メッセージを表示する"),
    new SlashCommandBuilder().setName("timer").setDescription("VC切断タイマー")
      .addSubcommand(sub => sub.setName("set").setDescription("タイマー設定").addStringOption(opt => opt.setName("time").setDescription("HH:MM").setRequired(true)))
      .addSubcommand(sub => sub.setName("cancel").setDescription("タイマー解除"))
      .addSubcommand(sub => sub.setName("status").setDescription("残り時間確認"))
  ].map(c => c.toJSON());

  try {
    console.log(`${commands.length} 個のコマンドを送信中... (10秒以内に応答がない場合はタイムアウトします)`);
    
    const data = await rest.put(
      Routes.applicationGuildCommands(appId, guildId),
      { body: commands }
    );

    console.log(`成功: ${data.length} 個のコマンドが有効になりました！`);
  } catch (error) {
    console.error("登録プロセスでエラーが発生しました:");
    
    if (error.rawError && error.rawError.errors) {
      console.error("【詳細エラー原因】:", JSON.stringify(error.rawError.errors, null, 2));
    } else {
      console.error("【メッセージ】:", error.message);
    }
  }
};