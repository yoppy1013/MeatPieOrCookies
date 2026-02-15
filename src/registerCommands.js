const { REST, Routes, SlashCommandBuilder } = require("discord.js");

module.exports = async function registerCommands(token, appId, guildId) {
  console.log("--- 個別登録プロセス開始 ---");
  const rest = new REST({ version: "10" }).setToken(token);

  const commands = [
    new SlashCommandBuilder().setName("welcome").setDescription("ミートパイかクッキーを送る"),
    new SlashCommandBuilder().setName("stamsg").setDescription("VCステータス通知先設定"),
    new SlashCommandBuilder().setName("voicelog").setDescription("VCログ送信先設定"),
    new SlashCommandBuilder().setName("roll").setDescription("許可追加").addMentionableOption(o => o.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName("deroll").setDescription("許可剥奪").addMentionableOption(o => o.setName("target").setDescription("対象").setRequired(true)),
    new SlashCommandBuilder().setName("ignore").setDescription("通知対象外設定"),
    new SlashCommandBuilder().setName("meshitero").setDescription("めしてろ"),
    new SlashCommandBuilder().setName("sake").setDescription("ガハハ！"),
    new SlashCommandBuilder().setName("welroll").setDescription("入室時ロール追加").addRoleOption(o => o.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("dewelroll").setDescription("入室時ロール解除").addRoleOption(o => o.setName("role").setDescription("ロール").setRequired(true)),
    new SlashCommandBuilder().setName("status").setDescription("現在の設定表示"),
    new SlashCommandBuilder().setName("yokoso").setDescription("入室メッセージ表示"),
    new SlashCommandBuilder().setName("timer").setDescription("VC切断タイマー").addSubcommand(s => s.setName("set").setDescription("設定").addStringOption(o => o.setName("time").setDescription("HH:MM").setRequired(true))).addSubcommand(s => s.setName("cancel").setDescription("解除")).addSubcommand(s => s.setName("status").setDescription("確認"))
  ].map(c => c.toJSON());

  // 現在のコマンドを一旦取得（比較用：任意）
  let currentCommands = [];
  try {
    console.log("DEBUG: 現在のコマンドリストを取得中...");
    currentCommands = await rest.get(Routes.applicationGuildCommands(appId, guildId));
  } catch (e) {
    console.log("取得失敗（無視して続行）:", e.message);
  }

  console.log(`全 ${commands.length} 個を順次登録します...`);

  // 【重要】ループで1つずつ送信するが、以前と違い「配列に詰めて」送る
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    // これまでのコマンド + 今回のコマンド を合体させて送る
    const payload = commands.slice(0, i + 1); 

    try {
      process.stdout.write(`登録中 (${i + 1}/${commands.length}): /${cmd.name} ... `);
      await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: payload }
      );
      console.log("OK");
    } catch (error) {
      console.log("FAILED");
      console.error(`エラー詳細 (/${cmd.name}):`, error.message);
      break; 
    }
    // APIへの負荷を避けるため少し待機
    await new Promise(res => setTimeout(res, 500));
  }
  console.log("--- 登録プロセス完了 ---");
};