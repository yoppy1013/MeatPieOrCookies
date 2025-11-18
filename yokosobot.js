const { Client, GatewayIntentBits,Partials} = require("discord.js");
require("dotenv").config();
console.log("TOKENの読込に成功しました");

// ==== 設定 ====
// Botトークン
const TOKEN = process.env.DISCORD_BOT_TOKEN;;

// 挨拶を送るチャンネルID
const WELCOME_CHANNEL_ID = "1439923741588193415";

// 付与するロールID
const ROLE_ID = "1439924125685649459";

// 画像URI
const MENTION_IMAGE = "/home/yoppy3/discord-bot/images/mention.png";
const YONDENAI_IMAGE = "/home/yoppy3/discord-bot/images/yondenai.png";

//変数
let flag = 0;
// ===================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, //入室イベント
    GatewayIntentBits.GuildMessages, //サーバ内メッセージ
    GatewayIntentBits.DirectMessages, // DM を受け取る
    GatewayIntentBits.MessageContent  // メッセージ内容を読む
  ],
  partials: [Partials.Channel]        // DM チャンネル用
});

// Bot ログイン完了時
client.once("ready", () => {
  console.log(`サーバに接続しました: ${client.user.tag}`);
});

// サーバー参加イベント
client.on("guildMemberAdd", async (member) => {
  console.log(`${member.user.tag} がサーバーに参加しました`);

  // 挨拶を送る（メンションなし）
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

