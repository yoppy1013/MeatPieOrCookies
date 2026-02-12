module.exports = function onGuildMemberAdd({ WELCOME_CHANNEL_ID, ROLE_ID }) {
  return async (member) => {
    console.log(`${member.user.tag} がサーバーに参加しました`);

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) {
      await channel.send(
        "ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
      );
      console.log(`${member.user.tag}に提案しました。`);
    } else {
      console.error("WELCOME_CHANNEL_ID のチャンネルが見つかりません");
    }

    try {
      await member.roles.add(ROLE_ID);
      console.log(`ロールID「${ROLE_ID}」を ${member.user.tag} に付与しました`);
    } catch (err) {
      console.error(`ロール付与に失敗しました`, err);
    }
  };
};
