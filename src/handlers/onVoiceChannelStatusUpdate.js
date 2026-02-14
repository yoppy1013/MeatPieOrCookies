const { getGuildSettings } = require("../store/guildSettings");

module.exports = function onVoiceChannelStatusUpdate({ voiceStatusCache }) {
  return async (client, packet) => {
    if (packet.t !== "VOICE_CHANNEL_STATUS_UPDATE") return;

    try {
      const data = packet.d;
      const guildId = data.guild_id;
      const channelId = data.id;
      const newStatus = data.status ?? "（未設定）";

      if (newStatus === "（未設定）") return;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const settings = getGuildSettings(guildId);

      const statusLogChannelId = settings.voiceStatusLogChannelId; // /stamsg で設定する
      if (!statusLogChannelId) return; // 未設定なら通知しない

      const logChannel = guild.channels.cache.get(statusLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) return;

      const vcChannel = guild.channels.cache.get(channelId);
      const vcLink = vcChannel ? vcChannel.toString() : `<#${channelId}>`;

      const oldStatus = voiceStatusCache.get(channelId) ?? "（未設定）";
      if (oldStatus === newStatus) return;

      voiceStatusCache.set(channelId, newStatus);

      const message = [
        `${vcLink} のステータスメッセージが変更されました。`,
        "```diff",
        `- ${oldStatus}`,
        `+ ${newStatus}`,
        "```",
      ].join("\n");

      await logChannel.send(message);
    } catch (err) {
      console.error("VCステータスメッセージ変更の通知に失敗しました", err);
    }
  };
};
