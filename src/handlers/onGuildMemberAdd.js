const { getGuildSettings } = require("../store/guildSettings");

module.exports = function onGuildMemberAdd() {
  return async (member) => {
    const settings = getGuildSettings(member.guild.id);

    //welcomeメッセージ送信先
    const chId = settings.welcomeChannelId;
    if (chId) {
      const channel = member.guild.channels.cache.get(chId);
      if (channel && channel.isTextBased()) {
        try {
          await channel.send(
            "ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
          );
        } catch (err) {
          console.error(`welcomeメッセージ送信に失敗しました channelId=${chId} user=${member.user.tag}`, err);
        }
      }
    }

    //入室時ロール付与
    const roleIds = Array.isArray(settings.welcomeRoleIds) ? settings.welcomeRoleIds : [];
    if (roleIds.length === 0) return;

    for (const roleId of roleIds) {
      try {
        await member.roles.add(roleId);
        console.log(`welcome role: ${roleId} を ${member.user.tag} に付与しました`);
      } catch (err) {
        console.error(`welcome role付与に失敗しました roleId=${roleId} user=${member.user.tag}`, err);
      }
    }
  };
};
