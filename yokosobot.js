const { Client, GatewayIntentBits, Partials, ChannelType} = require("discord.js");
require("dotenv").config();
console.log("TOKENの読込に成功しました");

// ==== 設定 ====
// Botトークン
const TOKEN = process.env.DISCORD_BOT_TOKEN;;

// チャンネルID
const WELCOME_CHANNEL_ID = "1439923741588193415";
const VOICE_LOG_CHANNEL_ID = "1440345393249648721";

// ロールID
const ROLE_ID = "1439924125685649459";

// 画像URI
const MENTION_IMAGE = "/home/yoppy3/discord-bot/images/mention.png";
const YONDENAI_IMAGE = "/home/yoppy3/discord-bot/images/yondenai.png";

//変数
let flag = 0; //画像送信フラグ
const vcJoinTimes = new Map();
const voiceStatusCache = new Map();
// ===================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, //入室イベント
    GatewayIntentBits.GuildMessages, //サーバ内メッセージ
    GatewayIntentBits.DirectMessages, // DM を受け取る
    GatewayIntentBits.MessageContent,  // メッセージ内容を読む
    GatewayIntentBits.GuildVoiceStates // VCの状態変化を検知
  ],
  partials: [Partials.Channel]        // DM チャンネル用
});

// Bot ログイン完了時
client.once("ready", () => {
  console.log(`サーバに接続しました: ${client.user.tag}`);
});

//~~~参加処理~~~

// サーバー参加イベント
client.on("guildMemberAdd", async (member) => {
  console.log(`${member.user.tag} がサーバーに参加しました`);

  // 挨拶を送る
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (channel) {
    await channel.send(
      "ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
    );
    console.log(`${member.user.tag}に提案しました。`);
  } else {
    console.error("WELCOME_CHANNEL_ID のチャンネルが見つかりません");
  }

  //  ロールを付与
  try {
    await member.roles.add(ROLE_ID);
    console.log(`ロールID「${ROLE_ID}」を ${member.user.tag} に付与しました`);
  } catch (err) {
    console.error(`ロールID「${ROLE_ID}」の ${member.user.tag} への付与に失敗しました`, err);
  }
});

//~~~VC処理~~~

// VC状態変化イベント
client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member) return;
  
  const logChannel = member.guild.channels.cache.get(VOICE_LOG_CHANNEL_ID);
  if (!logChannel) {
    console.error(`VOICE_LOG_CHANNEL_ID (${VOICE_LOG_CHANNEL_ID}) のチャンネルが見つかりません。`);
    return;
  }
  
  const userName = member.user.tag; //ユーザ名
  const userId = member.id; // ユーザーIDをキーとして使用

  // VC滞在時間を処理  
  const calculateDuration = (startTime) => {
    const durationMs = Date.now() - startTime;
    const seconds = Math.floor(durationMs / 1000);

    if (seconds < 0) return "0秒"; 

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let timeString = [];
    if (hours > 0) timeString.push(`${hours}時間`);
    if (minutes > 0) timeString.push(`${minutes}分`);
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      timeString.push(`${remainingSeconds}秒`);
    }
    return timeString.join('');
  };

  // ===VC間の移動===
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const oldVcLink = oldState.channel.toString();
    const oldVcName = oldState.channel.name;

    let durationText = "";
    if (vcJoinTimes.has(userId)) {
      const startTime = vcJoinTimes.get(userId);
      const duration = calculateDuration(startTime);
      durationText = `\n(通話時間: ${duration})`;
    }

    const leaveMessage = `${oldVcLink}から**${userName}**が移動しました。${durationText}`;
    logChannel.send(leaveMessage);
    console.log(`${oldVcName}から${userName}が移動しました。`);

    // 新しいVCでの時間計測を開始
    vcJoinTimes.set(userId, Date.now());

    const newVcLink = newState.channel.toString();
    const newVcName = newState.channel.name;

    const joinMessage = `${newVcLink}に**${userName}**が参加しました。`;
    logChannel.send(joinMessage);
    console.log(`${newVcName}に${userName}が参加しました。`);
  } 

  // ===VCへの参加===
  else if (!oldState.channelId && newState.channelId) {
    vcJoinTimes.set(userId, Date.now()); //時間測定開始

    const vcName = newState.channel.name;
    const vcLink = newState.channel.toString();
    const message = `${vcLink}に**${userName}**が参加しました。`;
    
    logChannel.send(message);
    console.log(`${vcName}に${userName}が参加しました。`);
  } 

  // ===VCからの退出===
else if (oldState.channelId && !newState.channelId) {
  const vcLink = oldState.channel.toString();
  const vcName = oldState.channel.name;

  if (vcJoinTimes.has(userId)) {
    const startTime = vcJoinTimes.get(userId);
    const duration = calculateDuration(startTime);

    const message = `${vcLink}から**${userName}**が退出しました。\n(通話時間: ${duration})`;
    logChannel.send(message);
    console.log(`${vcName}から${userName}が退出しました。(通話時間: ${duration})`);

    vcJoinTimes.delete(userId); // 記録を削除
  } else {
    // 記録がない場合は時間なしで退出メッセージのみ
    const message = `${vcLink}から**${userName}**が退出しました。\n(通話時間: 計測失敗)`;
    logChannel.send(message);
    console.log(`${vcName}から${userName}が退出しました。(時間計測失敗)`);
  }
}
});

// === VCステータスメッセージ変更検知 ===
client.on("raw", async (packet) => {

  if (packet.t !== "VOICE_CHANNEL_STATUS_UPDATE") return;

  try {
    const data = packet.d;
    const guildId = data.guild_id;
    const channelId = data.id;
    const newStatus = data.status ?? "（未設定）";

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const logChannel = guild.channels.cache.get(VOICE_LOG_CHANNEL_ID);
    if (!logChannel || !logChannel.isTextBased()) {
      console.error(
        `VOICE_LOG_CHANNEL_ID (${VOICE_LOG_CHANNEL_ID}) のテキストチャンネルが見つかりません。`
      );
      return;
    }

    const vcChannel = guild.channels.cache.get(channelId);
    const vcLink = vcChannel ? vcChannel.toString() : `<#${channelId}>`;
    const vcName = vcChannel ? vcChannel.name : `ID: ${channelId}`;

    // 直前のステータス
    const oldStatus = voiceStatusCache.get(channelId) ?? "（未設定）";

    // 変化がないなら何もしない
    if (oldStatus === newStatus) return;

    // キャッシュを更新
    voiceStatusCache.set(channelId, newStatus);

    // ログメッセージ
    const message = [
      `${vcLink} のステータスメッセージが変更されました。`,
      "```diff",
      `- ${oldStatus}`,
      `+ ${newStatus}`,
      "```"
    ].join("\n");

    await logChannel.send(message);
    console.log(
      `${vcName} のステータスメッセージが 「${oldStatus}」から「${newStatus}」に変更されました`
    );
  } catch (err) {
    console.error("VCステータスメッセージ変更の通知に失敗しました", err);
  }
});

// ~~~DM処理~~~

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // メンションされたかチェック
  if (message.mentions.has(client.user)) {
    try {
      await message.channel.send({ files: [MENTION_IMAGE] });
      console.log(`${message.author.tag}からのメンションによりオフロスキーを送信しました`);
      return;
    } catch (err) {
      console.error(`${message.author.tag}からのメンションによるオフロスキーの送信に失敗しました`, err);
    }
  }

  // 文字列に反応
  const ofurosuki_words = ["オフロスキ","おふろすき","ｵﾌﾛｽｷ","ofurosuki","ohurosuki","offrosky","OFUROSUKI","Ofurosuki","Ohurosuki","OHUROSUKI"];
  if (ofurosuki_words.some(w => message.content.includes(w))) {
    try {
      await message.channel.send({ files: [MENTION_IMAGE] });
      flag = 1;
      console.log(`${message.author.tag}からの文字列により呼ばれたオフロスキーを送信しました`);
    } catch (err) {
      console.error(`${message.author.tag}からの文字列による呼ばれたオフロスキーの送信に失敗しました`, err);
    }
  }

  const yondenai_words = ["呼んでな","よんでな","ﾖﾝﾃﾞﾅ","yondena","Yondena","yomdena","YONDENA"];
  if (yondenai_words.some(w => message.content.includes(w))) {
    try {
      await message.channel.send({ files: [YONDENAI_IMAGE] });
      flag = 1;
      console.log(`${message.author.tag}からの文字列により呼んでないオフロスキーを送信しました`);
    } catch (err) {
      console.error(`${message.author.tag}からの文字列による呼んでないオフロスキーの送信に失敗しました`, err);
    }
  }

  if (!message.guild && flag === 1) {
    flag = 0; 
    return;
  }

  // guild が null = DM チャット
  if (!message.guild) {
    await message.channel.send(
      "ようこそいらいっしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
    );
    console.log(`${message.author.tag}のDMで反応しました`);
    flag = 0;
  }
});

// Bot ログイン
client.login(TOKEN);
