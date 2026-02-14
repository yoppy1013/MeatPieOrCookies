const getRandomImageUrlFromChannel = require("../utils/getRandomImageUrlFromChannel");
const { findMembersByContainedName } = require("../utils/memberMatch");
const { getGuildSettings } = require("../store/guildSettings");

module.exports = function onMessageCreate({
  client,
  MENTION_IMAGE,
  YONDENAI_IMAGE,
  lastMemberFetchAt,
}) {
  return async (message) => {
    if (message.author.bot) return;

    let flag = 0;

    // メンション
    if (message.mentions.has(client.user)) {
      await message.channel.send({ files: [MENTION_IMAGE] }).catch(() => null);
      return;
    }

    // 文字列反応
    const ofurosuki_words = ["オフロスキ","おふろすき","ｵﾌﾛｽｷ","ofurosuki","ohurosuki","offrosky","OFUROSUKI","Ofurosuki","Ohurosuki","OHUROSUKI"];
    if (ofurosuki_words.some(w => message.content.includes(w))) {
      await message.channel.send({ files: [MENTION_IMAGE] }).catch(() => null);
      flag = 1;
    }

    const yondenai_words = ["呼んでな","よんでな","ﾖﾝﾃﾞﾅ","yondena","Yondena","yomdena","YONDENA"];
    if (yondenai_words.some(w => message.content.includes(w))) {
      await message.channel.send({ files: [YONDENAI_IMAGE] }).catch(() => null);
      flag = 1;
    }

    // めしてろ
 if (message.content.includes("めしてろ")) {
  if (!message.guild) {
    await message.channel.send("本機能はサーバでのみで使用できます。");
    return;
  }

  const settings = getGuildSettings(message.guild.id);
  const srcId = settings.meshiSourceChannelId;

  if (!srcId) {
    await message.channel.send("めしてろ画像抽出元が未設定です。管理者に問い合わせてください。");
    return;
  }

  try {
    const picked = await getRandomImageUrlFromChannel(message.guild, srcId);
    if (!picked) {
      await message.channel.send("めしてろ画像が見つかりませんでした。");
      return;
    }

    flag = 1;
    await message.channel.send({
      content: "めしてろします。",
      files: [picked.url],
    });
  } catch (err) {
    console.error("めしてろに失敗しました。", err);
    await message.channel.send("めしてろに失敗しました。");
  }
}


    // 酒
if (message.content.includes("酒")) {
  if (!message.guild) {
    await message.channel.send("本機能はサーバでのみで使用できます。");
    return;
  }

  const settings = getGuildSettings(message.guild.id);
  const srcId = settings.sakeSourceChannelId;

  if (!srcId) {
    await message.channel.send("酒画像抽出元が未設定です。管理者に問い合わせてください。");
    return;
  }

  try {
    const picked = await getRandomImageUrlFromChannel(message.guild, srcId);
    if (!picked) {
      await message.channel.send("ガハハ！失敗…");
      return;
    }

    flag = 1;
    await message.channel.send({
      content: "ガハハ！",
      files: [picked.url],
    });
  } catch (err) {
    console.error("酒の送信に失敗しました。", err);
    await message.channel.send("ガハハ！失敗…");
  }
}
  

    // 名前検知→アイコン
    if (message.guild) {
      try {
        const hits = await findMembersByContainedName(message.guild, message.content, lastMemberFetchAt);
        const filtered = hits.filter(h => !h.member.user.bot);

        if (filtered.length > 0) {
          const shown = filtered.slice(0, 10);
          flag = 1;

          await message.channel.send({
            content:
              shown.length === filtered.length
                ? `検知: ${shown.map(h => h.member.displayName).join(" / ")}`
                : `検知: ${shown.map(h => h.member.displayName).join(" / ")} （上位10人を表示）`,
            embeds: shown.map(h => ({
              title: h.member.displayName,
              description: `@${h.member.user.username}（${h.matched}）`,
              thumbnail: { url: h.member.displayAvatarURL({ size: 256 }) }
            }))
          });
        }
      } catch (e) {
        console.error("名前検知→アイコン表示でエラーが発生しました。", e);
      }
    }

    // DM: 何か送った直後なら返信しない
    if (!message.guild && flag === 1) return;

    // DM返信
    if (!message.guild) {
      await message.channel.send(
        "ようこそいらいっしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？"
      );
    }
  };
};
