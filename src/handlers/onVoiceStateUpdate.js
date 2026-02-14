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
const PRIVATE_VC_IDS = new Set([
  "1440349567634899014",
  "1472185306760478772",
]);

const isPrivateVc = (ch) => !!ch && PRIVATE_VC_IDS.has(ch.id);

module.exports = function onVoiceStateUpdate({ vcJoinTimes }) {
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

    const makeEmbed = ({ title, description, color, thumbnail, fields = [] }) => {
      const emb = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(thumbnail ? thumbnail.url : null)
        .setColor(color)
        .setFooter({ text: formatDateTime() });
      if (fields.length) emb.addFields(fields);
      return emb;
    };

    // ===== ここが肝：プライベートVCの扱いを先に正規化する =====
    const oldCh = oldState.channel; // null の可能性あり
    const newCh = newState.channel;

    const oldIsPrivate = isPrivateVc(oldCh);
    const newIsPrivate = isPrivateVc(newCh);

    // private<->privateは無視
    if (oldIsPrivate && newIsPrivate) return;

    // none->privateは無視
    if (!oldCh && newIsPrivate) return;

    // private->noneは無視
    if (oldIsPrivate && !newCh) return;

    // normal->privateはnormalからの退出として扱う
    if (oldCh && !oldIsPrivate && newIsPrivate) {
      // 退出イベントにするためにnew を null 扱いにする
      newState = { ...newState, channelId: null, channel: null };
    }

    // normal->privateはnormalへの参加として扱う
    if (oldIsPrivate && newCh && !newIsPrivate) {
      // 参加イベントにするために old を null 扱いにする
      oldState = { ...oldState, channelId: null, channel: null };
    }


    // 移動
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const fromCh = oldState.channel;
      const toCh = newState.channel;

      let durationField = null;
      if (vcJoinTimes.has(userId)) {
        const d = calculateDuration(vcJoinTimes.get(userId));
        durationField = { name: "通話時間", value: d, inline: true };
      }

      await logChannel
        .send({
          embeds: [
            makeEmbed({
              title: "VCを移動しました",
              description: `${fromCh} から ${toCh} へ移動しました`,
              thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
              color: 0x3498db,
              fields: [
                { name: "ユーザー", value: `<@${userId}>`, inline: true },
                ...(durationField ? [durationField] : []),
              ],
            }),
          ],
        })
        .catch(() => null);

      vcJoinTimes.set(userId, Date.now());
      return;
    }

    // 参加
    if (!oldState.channelId && newState.channelId) {
      const ch = newState.channel;
      vcJoinTimes.set(userId, Date.now());

      await logChannel
        .send({
          embeds: [
            makeEmbed({
              title: "VCに参加しました",
              description: `${ch} に参加しました`,
              thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
              color: 0x2ecc71,
              fields: [{ name: "ユーザー", value: `<@${userId}>`, inline: true }],
            }),
          ],
        })
        .catch(() => null);
      return;
    }

    // 退出
    if (oldState.channelId && !newState.channelId) {
      const ch = oldState.channel;

      let duration = "計測失敗";
      if (vcJoinTimes.has(userId)) {
        duration = calculateDuration(vcJoinTimes.get(userId));
        vcJoinTimes.delete(userId);
      }

      await logChannel
        .send({
          embeds: [
            makeEmbed({
              title: "VCから退出しました",
              description: `${ch} から退出しました`,
              thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
              color: 0xe74c3c,
              fields: [
                { name: "ユーザー", value: `<@${userId}>`, inline: true },
                { name: "通話時間", value: duration, inline: true },
              ],
            }),
          ],
        })
        .catch(() => null);
    }
  };
};
