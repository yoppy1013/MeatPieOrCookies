module.exports = function onVoiceChannelStatusUpdate({
  VOICE_LOG_CHANNEL_ID,
  voiceStatusCache,
}) {
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

      const logChannel = guild.channels.cache.get(VOICE_LOG_CHANNEL_ID);
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
        "```"
      ].join("\n");

      await logChannel.send(message);
    } catch (err) {
      console.error("VCステータスメッセージ変更の通知に失敗しました", err);
    }
  };
};
