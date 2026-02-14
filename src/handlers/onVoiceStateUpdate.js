const { getGuildSettings } = require("../store/guildSettings");
const { EmbedBuilder } = require("discord.js");

const formatTime = () => {
  const d = new Date();
  return d.toLocaleString("ja-JP", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

module.exports = function onVoiceStateUpdate({ vcJoinTimes }) {
  return async (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member) return;

    const settings = getGuildSettings(member.guild.id);
    const logChannelId = settings.voiceLogChannelId;
    if (!logChannelId) return;

    const logChannel = await member.guild.channels
      .fetch(logChannelId)
      .catch(() => null);

    if (!logChannel || !logChannel.isTextBased()) return;

    const userName = member.displayName || member.user.username;
    const userId = member.id;

    const calculateDuration = (startTime) => {
      const durationMs = Date.now() - startTime;
      const seconds = Math.floor(durationMs / 1000);
      if (seconds <= 0) return "0秒";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours}時間`);
      if (minutes > 0) parts.push(`${minutes}分`);
      parts.push(`${remainingSeconds}秒`);
      return parts.join("");
    };

    const makeEmbed = ({ title, description, color,thumbnail, fields = [] }) => {
      const emb = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(thumbnail ? thumbnail.url : null)
        .setColor(color)
        .setTimestamp(formatTime())

      if (fields.length) emb.addFields(fields);
      return emb;
    };

    // ===== VC間移動 =====
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const oldCh = oldState.channel;
      const newCh = newState.channel;

      let durationField = null;
      if (vcJoinTimes.has(userId)) {
        const d = calculateDuration(vcJoinTimes.get(userId));
        durationField = { name: "通話時間", value: d, inline: true };
      }

      await logChannel.send({
        embeds: [
          makeEmbed({
            title: "VCを移動しました",
            description: `${oldCh} から ${newCh} へ移動しました`,
            thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
            color: 0x3498db, // 青
            fields: [
              { name: "ユーザー", value: `<@${userId}>`, inline: true },
              ...(durationField ? [durationField] : []),
            ],
          }),
        ],
      }).catch(() => null);

      // 移動なので計測開始時間を更新
      vcJoinTimes.set(userId, Date.now());
      return;
    }

    // ===== 参加 =====
    if (!oldState.channelId && newState.channelId) {
      const ch = newState.channel;
      vcJoinTimes.set(userId, Date.now());

      await logChannel.send({
        embeds: [
          makeEmbed({
            title: "VCに参加しました",
            description: `${ch} に参加しました`,
            thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
            color: 0x2ecc71, // 緑
            fields: [{ name: "ユーザー", value: `<@${userId}>`, inline: true }],
          }),
        ],
      }).catch(() => null);
      return;
    }

    // ===== 退出 =====
    if (oldState.channelId && !newState.channelId) {
      const ch = oldState.channel;

      let duration = "計測失敗";
      if (vcJoinTimes.has(userId)) {
        duration = calculateDuration(vcJoinTimes.get(userId));
        vcJoinTimes.delete(userId);
      }

      await logChannel.send({
        embeds: [
          makeEmbed({
            title: "VCから退出しました",
            description: `${ch} から退出しました`,
            thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
            color: 0xe74c3c, // 赤
            fields: [
              { name: "ユーザー", value: `<@${userId}>`, inline: true },
              { name: "通話時間", value: duration, inline: true },
            ],
          }),
        ],
      }).catch(() => null);
    }
  };
};
