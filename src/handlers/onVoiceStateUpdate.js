const { getGuildSettings } = require("../store/guildSettings");

module.exports = function onVoiceStateUpdate({ vcJoinTimes }) {
  return (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member) return;

    const settings = getGuildSettings(member.guild.id);
    const logChannelId = settings.voiceLogChannelId;

    if (!logChannelId) return; // /voice で設定されるまでログを送らない

    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    if (!logChannel) {
      console.error(`${logChannelId}が見つかりません。`);
      return;
    }

    const userName = member.user.tag;
    const userId = member.id;

    const calculateDuration = (startTime) => {
      const durationMs = Date.now() - startTime;
      const seconds = Math.floor(durationMs / 1000);
      if (seconds < 0) return "0秒";

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours}時間`);
      if (minutes > 0) parts.push(`${minutes}分`);
      if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${remainingSeconds}秒`);
      return parts.join("");
    };

    // VC間移動
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const oldVcLink = oldState.channel.toString();

      let durationText = "";
      if (vcJoinTimes.has(userId)) {
        durationText = `\n(通話時間: ${calculateDuration(vcJoinTimes.get(userId))})`;
      }

      logChannel.send(`${oldVcLink}から**${userName}**が移動しました。${durationText}`);

      vcJoinTimes.set(userId, Date.now());

      const newVcLink = newState.channel.toString();
      logChannel.send(`${newVcLink}に**${userName}**が参加しました。`);
      return;
    }

    // 参加
    if (!oldState.channelId && newState.channelId) {
      vcJoinTimes.set(userId, Date.now());
      const vcLink = newState.channel.toString();
      logChannel.send(`${vcLink}に**${userName}**が参加しました。`);
      return;
    }

    // 退出
    if (oldState.channelId && !newState.channelId) {
      const vcLink = oldState.channel.toString();

      if (vcJoinTimes.has(userId)) {
        const duration = calculateDuration(vcJoinTimes.get(userId));
        logChannel.send(`${vcLink}から**${userName}**が退出しました。\n(通話時間: ${duration})`);
        vcJoinTimes.delete(userId);
      } else {
        logChannel.send(`${vcLink}から**${userName}**が退出しました。\n(通話時間: 計測失敗)`);
      }
    }
  };
};
