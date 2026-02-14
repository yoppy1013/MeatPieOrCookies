const { getGuildSettings } = require("../store/guildSettings");
const { EmbedBuilder } = require("discord.js");

const formatDateTime = () => {
  const d = new Date();
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 通知例外チャンネル（プライベートVC）
const isIgnoredVc = (settings, ch) =>
  !!ch && Array.isArray(settings.ignoredVoiceChannelIds)
    && settings.ignoredVoiceChannelIds.includes(ch.id);


module.exports = function onVoiceStateUpdate({
  vcJoinTimes,
}) {
  return async (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member) return;

    const settings = getGuildSettings(member.guild.id);
    const logChannelId = settings.voiceLogChannelId;
    if (!logChannelId) return;

    const logChannel = await member.guild.channels.fetch(logChannelId).catch(() => null);
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

    const makeEmbed = ({ title, description, color, thumbnailUrl, fields = [] }) => {
      const emb = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: formatDateTime() });

      if (thumbnailUrl) emb.setThumbnail(thumbnailUrl);
      if (fields.length) emb.addFields(fields);
      return emb;
    };

    // ローカル画像を添付してサムネにする
    const sendEmbedWithLocalThumb = async ({ title, description, color, imagePath, imageName, fields }) => {
      // 画像パスが未設定ならサムネ無しで送る
      if (!imagePath) {
        await logChannel.send({
          embeds: [makeEmbed({ title, description, color, fields })],
        }).catch(() => null);
        return;
      }

      await logChannel.send({
        files: [{ attachment: imagePath, name: imageName }],
        embeds: [
          makeEmbed({
            title,
            description,
            color,
            thumbnailUrl: `attachment://${imageName}`,
            fields,
          }),
        ],
      }).catch(() => null);
    };

    // ===== プライベートVCの扱いを先に正規化する =====
    const oldCh = oldState.channel;
    const newCh = newState.channel;

    const oldIsPrivate = isIgnoredVc(settings, oldCh);
    const newIsPrivate = isIgnoredVc(settings, newCh);

    // private<->privateは無視
    if (oldIsPrivate && newIsPrivate) return;

    // none->privateは無視
    if (!oldCh && newIsPrivate) return;

    // private->noneは無視
    if (oldIsPrivate && !newCh) return;

    // normal->privateはnormalからの退出として扱う
    if (oldCh && !oldIsPrivate && newIsPrivate) {
      newState = { ...newState, channelId: null, channel: null };
    }

    // private->normalはnormalへの参加として扱う
    if (oldIsPrivate && newCh && !newIsPrivate) {
      oldState = { ...oldState, channelId: null, channel: null };
    }

    // ===== 配信/ビデオ開始終了=====
    if (oldState.channelId && newState.channelId && oldState.channelId === newState.channelId) {
      const ch = newState.channel;
        if (!isIgnoredVc(settings, ch)) {
          const thumb = member.displayAvatarURL({ size: 256 });

    // 配信
    if (oldState.streaming !== newState.streaming) {
      await logChannel.send({
        embeds: [
          makeEmbed({
            title: newState.streaming ? "配信を開始しました" : "配信を終了しました",
            description: `${ch}`,
            color: newState.streaming ? 0xf1c40f : 0xf39c12,
            thumbnailUrl: thumb,
            fields: [{ name: "ユーザー", value: `<@${userId}>`, inline: true }],
          }),
        ],
      }).catch(() => null);
    }

    // ビデオ
    if (oldState.selfVideo !== newState.selfVideo) {
      await logChannel.send({
        embeds: [
          makeEmbed({
            title: newState.selfVideo ? "ビデオを開始しました" : "ビデオを終了しました",
            description: `${ch}`,
            color: newState.selfVideo ? 0x9b59b6 : 0x8e44ad,
            thumbnailUrl: thumb,
            fields: [{ name: "ユーザー", value: `<@${userId}>`, inline: true }],
          }),
        ],
      }).catch(() => null);
    }
  }
}


    // ===== 移動 =====
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const fromCh = oldState.channel;
      const toCh = newState.channel;

      let durationField = null;
      if (vcJoinTimes.has(userId)) {
        const d = calculateDuration(vcJoinTimes.get(userId));
        durationField = { name: "通話時間", value: d, inline: true };
      }

      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("VCを移動しました")
            .setDescription(`${fromCh} から ${toCh} へ移動しました`)
            .setColor(0x3498db)
            .setThumbnail(member.displayAvatarURL({ size: 256 }))
            .setFooter({ text: formatDateTime() })
            .addFields([
              { name: "ユーザー", value: `<@${userId}>`, inline: true },
              ...(durationField ? [durationField] : []),
            ]),
        ],
      }).catch(() => null);

      vcJoinTimes.set(userId, Date.now());
      return;
    }

    // ===== 参加 =====
    if (!oldState.channelId && newState.channelId) {
      const ch = newState.channel;
      vcJoinTimes.set(userId, Date.now());

      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("VCに参加しました")
            .setDescription(`${ch} に参加しました`)
            .setColor(0x2ecc71)
            .setThumbnail(member.displayAvatarURL({ size: 256 }))
            .setFooter({ text: formatDateTime() })
            .addFields([{ name: "ユーザー", value: `<@${userId}>`, inline: true }]),
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
          new EmbedBuilder()
            .setTitle("VCから退出しました")
            .setDescription(`${ch} から退出しました`)
            .setColor(0xe74c3c)
            .setThumbnail(member.displayAvatarURL({ size: 256 }))
            .setFooter({ text: formatDateTime() })
            .addFields([
              { name: "ユーザー", value: `<@${userId}>`, inline: true },
              { name: "通話時間", value: duration, inline: true },
            ]),
        ],
      }).catch(() => null);
    }
  };
};
