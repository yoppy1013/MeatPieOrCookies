const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");


const {
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

module.exports = async function registerCommands(token, appId, guildId) {

console.log("--- コマンド登録プロセス開始 ---");
  console.log("AppID:", appId);
  console.log("GuildID:", guildId);
const rest = new REST({ 
  version: "10",
  timeout: 15000 // 15秒でタイムアウトさせる設定を追加
}).setToken(token);
    if (!guildId) {
      throw new Error("guildIdが不明です\n環境変数DISCORD_GUILD_IDを確認してください");
    }

 const commands = [
  new SlashCommandBuilder().setName("welcome").setDescription("このチャンネルにミートパイかクッキーを送る"),
  new SlashCommandBuilder().setName("stamsg").setDescription("このチャンネルをVCステータスメッセージ変更通知の送信先に設定する"),
  new SlashCommandBuilder().setName("voicelog").setDescription("このチャンネルをVCログ送信先に設定する"),
  new SlashCommandBuilder().setName("roll").setDescription("コマンド実行を許可するロール/ユーザーを追加する")
    .addMentionableOption(opt => opt.setName("target").setDescription("対象のロールまたはユーザー").setRequired(true)),
  new SlashCommandBuilder().setName("deroll").setDescription("コマンド実行の許可をロール/ユーザーから剥奪する")
    .addMentionableOption(opt => opt.setName("target").setDescription("対象のロールまたはユーザー").setRequired(true)),
  new SlashCommandBuilder().setName("ignore").setDescription("現在参加しているVCを通知対象外にする"),
  new SlashCommandBuilder().setName("meshitero").setDescription("このチャンネルからめしてろをする"),
  new SlashCommandBuilder().setName("sake").setDescription("このチャンネルからガハハ！をする"),
  new SlashCommandBuilder().setName("welroll").setDescription("入室時に付与するロールを追加する")
    .addRoleOption(opt => opt.setName("role").setDescription("付与するロール").setRequired(true)),
  new SlashCommandBuilder().setName("dewelroll").setDescription("入室時に付与するロールを解除する")
    .addRoleOption(opt => opt.setName("role").setDescription("解除するロール").setRequired(true)),
  new SlashCommandBuilder().setName("status").setDescription("現在のサーバ設定を表示"),
  new SlashCommandBuilder().setName("yokoso").setDescription("入室時メッセージを表示する"),
  
  new SlashCommandBuilder()
    .setName("timer")
    .setDescription("VC切断タイマー")
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("タイマーを設定する")
        .addStringOption(opt => opt.setName("time").setDescription("時刻 HH:MM").setRequired(true))
    )
    .addSubcommand(sub => sub.setName("cancel").setDescription("タイマーを解除する"))
    .addSubcommand(sub => sub.setName("status").setDescription("残り時間を表示する"))
].map(c => c.toJSON());

try {
  console.log(`${commands.length} 個のコマンドを送信します...`);
  const data = await rest.put(
    Routes.applicationGuildCommands(appId, guildId),
    { body: commands }
  );
  console.log("すべてのコマンドの登録に成功しました");
} catch (error) {
  console.error("登録中にエラーが発生しました:");
  if (error.rawError && error.rawError.errors) {
    console.error(JSON.stringify(error.rawError.errors, null, 2));
  } else {
    console.error(error);
  }
}

  /*
  await rest.put(Routes.applicationCommands(appId), { body: [] });
  await rest.put(
    Routes.applicationCommands(appId),
    { body: commands }
  );
  */
 /*
  console.log("commands delete start");
await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
console.log("commands delete ok");
*/

/*
try {
    // ギルドコマンドを一旦空にする
    console.log("既存のコマンドをクリアしています...");
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });

    // 新しいリストを一括で登録する
    console.log(`${commands.length} 個のコマンドを送信中...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(appId, guildId),
      { body: commands }
    );

    console.log(`成功しました！ ${data.length} 個のコマンドが有効です。`);
  } catch (error) {
    console.error(" 登録失敗:");
    if (error.response) {
      // APIからの詳細なエラー応答がある場合
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
  }

   try {
    console.log("接続テスト：空の配列を送信します...");
    await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: [] }
    );
    console.log("空の配列の登録に成功しました！接続は生きています。");
} catch (e) {
    console.error("接続自体に失敗しました:", e.message);
}
        */
};


