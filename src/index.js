const { Client, GatewayIntentBits, Partials } = require("discord.js");
const cfg = require("./config");
const state = require("./state");

const onGuildMemberAdd = require("./handlers/onGuildMemberAdd");
const onVoiceStateUpdate = require("./handlers/onVoiceStateUpdate");
const onVoiceChannelStatusUpdate = require("./handlers/onVoiceChannelStatusUpdate");
const onMessageCreate = require("./handlers/onMessageCreate");
const registerCommands = require("./registerCommands");
const onInteractionCreate = require("./handlers/onInteractionCreate");
const timerManager = require("./utils/timerManager");

console.log("TOKENの読込に成功しました");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

client.once("ready", async () => {
  console.log(`サーバに接続しました: ${client.user.tag}`);
  console.log("registerCommands guildId=", cfg.GUILD_ID, "appId=", cfg.APP_ID);


  await registerCommands(cfg.TOKEN, cfg.APP_ID);
  await timerManager.restoreAll(client);
});
client.on("interactionCreate", onInteractionCreate(client));

client.on("guildMemberAdd", onGuildMemberAdd());

client.on("voiceStateUpdate", onVoiceStateUpdate({
  VOICE_LOG_CHANNEL_ID: cfg.VOICE_LOG_CHANNEL_ID,
  vcJoinTimes: state.vcJoinTimes,
}));

const handleStatus = onVoiceChannelStatusUpdate({
  VOICE_LOG_CHANNEL_ID: cfg.VOICE_LOG_CHANNEL_ID,
  voiceStatusCache: state.voiceStatusCache,
});
client.on("raw", (packet) => handleStatus(client, packet));

client.on("messageCreate", onMessageCreate({
  client,
  MENTION_IMAGE: cfg.MENTION_IMAGE,
  YONDENAI_IMAGE: cfg.YONDENAI_IMAGE,
  MESHI_CHANNEL_ID: cfg.MESHI_CHANNEL_ID,
  SAKE_CHANNEL_ID: cfg.SAKE_CHANNEL_ID,
  lastMemberFetchAt: state.lastMemberFetchAt,
}));


client.login(cfg.TOKEN);
