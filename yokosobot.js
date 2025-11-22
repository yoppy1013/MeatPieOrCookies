const { Client, GatewayIntentBits,Partials} = require("discord.js");
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
  // ボットが接続しているギルド内のVCの変更を処理
  const member = newState.member || oldState.member;
  
  // ログを送信するテキストチャンネルを取得
  const logChannel = member.guild.channels.cache.get(VOICE_LOG_CHANNEL_ID);
  if (!logChannel) {
    console.error(`VOICE_LOG_CHANNEL_ID (${VOICE_LOG_CHANNEL_ID}) のチャンネルが見つかりません。`);
    return;
  }
  
  const userName = member.user.tag; //ユーザ名
  const userId = member.id; // ユーザーIDをキーとして使用
 // const userMention = member.toString();


  //VC滞在時間を処理  
  const calculateDuration = (startTime) => {
    const durationMs = Date.now() - startTime;
    const seconds = Math.floor(durationMs / 1000);

    // 0秒未満
    if (seconds < 0) return "0秒"; 

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let timeString = [];
    if (hours > 0) timeString.push(`${hours}時間`);
    if (minutes > 0) timeString.push(`${minutes}分`);
    
    // VC滞在時間が0分0秒の場合は秒を表示し、それ以外で秒が0の場合は表示しない
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
        timeString.push(`${remainingSeconds}秒`);
    }
    
    return timeString.join('');
  };

  // ===VC間の移動 (oldStateとnewState両方にチャンネルIDがあり、IDが異なる場合)===
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    // VCを退出したメッセージを送信
    const oldVcName = oldState.channel.name;
    const leaveMessage = `${oldVcLink}から**${userName}**が退出しました。\n(通話時間: ${duration})`;
    logChannel.send(leaveMessage);
    console.log(`${oldVcName}から${userName}が退出しました。`);

    // VCに参加したメッセージを送信
    vcJoinTimes.set(userId, Date.now()); //時間測定開始

    const newVcLink = newState.channel.toString();
    const newVcName = newState.channel.name;

    const joinMessage = `${newVcLink}に**${userName}**が参加しました。`;
    logChannel.send(joinMessage);
    console.log(`${newVcName}に${userName}が参加しました。`);
  } 

  // ===VCへの参加 (oldStateにチャンネルがなく、newStateにチャンネルがある)===
  else if (!oldState.channelId && newState.channelId) {
    vcJoinTimes.set(userId, Date.now()); //時間測定開始

    const vcName = newState.channel.name;
    const vcLink = newState.channel.toString();

    const message = `${vcLink}に**${userName}**が参加しました。`;
    
    logChannel.send(message);
    console.log(`${vcName}に${userName}が参加しました。`);
  } 

  // ===VCからの退出 (oldStateにチャンネルがあり、newStateにチャンネルがない)===
  else if (oldState.channelId && !newState.channelId) {
    if (vcJoinTimes.has(userId)) {
      const startTime = vcJoinTimes.get(userId);
      const duration = calculateDuration(startTime);
      
      const vcLink = oldState.channel.toString(); 
      const vcName = oldState.channel.name;


      const message = `${vcLink}から**${userName}**が退出しました。\n(通話時間: ${duration})`;
      
      logChannel.send(message);
      console.log(`${vcName}から${userName}が退出しました。`);
      
      vcJoinTimes.delete(userId); // 記録を削除
    } else {
        // 記録がない場合は時間なしで退出メッセージのみ
        const vcName = oldState.channel.name;
        const message = `${vcLink}から$**${userName}**が退出しました。 `;
        logChannel.send(message);
        console.log(`${vcName}から${userName}が退出しました。`);
    }
  }
});

// ~~~DM処理~~~

// DM で話しかけられたときの処理
client.on("messageCreate", async (message) => {
  // Bot 自身や他の Bot のメッセージには反応しない
  if (message.author.bot) return;


  // メンションされたかチェック
  if (message.mentions.has(client.user)) {
    try {
      await message.channel.send({
        files: [MENTION_IMAGE],
      });
      console.log(`${message.author.tag}からのメンションによりオフロスキーを送信しました`);
	    return;
    } catch (err) {
      console.error(`${message.author.tag}からのメンションによるオフロスキーの送信に失敗しました`, err);
    }
  }

 //文字列に反応
 //文字列定義
	const ofurosuki_words = ["オフロスキ","おふろすき","ｵﾌﾛｽｷ","ofurosuki","ohurosuki","offrosky","OFUROSUKI","Ofurosuki","Ohurosuki","OHUROSUKI"];
  if (ofurosuki_words.some(w => message.content.includes(w))) {
	try {
		await message.channel.send({
			files: [MENTION_IMAGE],
		});
    flag = 1;
		console.log(`${message.author.tag}からの文字列により呼ばれたオフロスキーを送信しました`);
	} catch (err) {
		console.error(`${message.author.tag}からの文字列による呼ばれたオフロスキーの送信に失敗しました`, err);
	}
}


  const yondenai_words = ["呼んでな","よんでな","ﾖﾝﾃﾞﾅ","yondena","Yondena","yomdena","YONDENA"];
  if (yondenai_words.some(w => message.content.includes(w))) {
	try {
		await message.channel.send({
			files: [YONDENAI_IMAGE],
		});
    flag = 1;
		console.log(`${message.author.tag}からの文字列により呼んでないオフロスキーを送信しました`);
	} catch (err) {
		console.error(`${message.author.tag}からの文字列による呼んでないオフロスキーの送信に失敗しました`, err);
	}
}

if (!message.guild && flag == 1){
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

