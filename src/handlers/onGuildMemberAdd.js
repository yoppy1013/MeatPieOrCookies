
const { getGuildSettings } = require("../store/guildSettings");
module.exports = function onGuildMemberAdd(ROLE_ID) {
  return async (member) => {
    const settings = getGuildSettings(member.guild.id);
    const chId = settings.welcomeChannelId;
    if (!chId) return; // 未設定なら何もしない

    const channel = member.guild.channels.cache.get(chId);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      "ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
    );

    try {
      await member.roles.add(ROLE_ID);
      console.log(`ロールID「${ROLE_ID}」を ${member.user.tag} に付与しました`);
    } catch (err) {
      console.error(`ロール付与に失敗しました`, err);
    }
  };
};
