const getRandomImageUrlFromChannel = require("../utils/getRandomImageUrlFromChannel");
const isAllowed = require("../utils/isAllowed");
const {
  setGuildSetting,
  getGuildSettings,
  addToGuildList,
  removeFromGuildList,
} = require("../store/guildSettings");

module.exports = function onInteractionCreate({ MESHI_CHANNEL_ID, SAKE_CHANNEL_ID }) {
  return async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.guild) {
      await interaction.reply({ content: "サーバ内で使ってください。", ephemeral: true });
      return;
    }

    const ch = interaction.channel;

// 権限コマンド
    const needsAllow = new Set([
        "yosokoso",
      "voice",
      "roll",
      "deroll",
      "source_meshi",
      "source_sake",
      "meshitero",
      "sake",
    ]);

    if (needsAllow.has(interaction.commandName) && !isAllowed(interaction)) {
      await interaction.reply({ content: "このコマンドを実行する権限がありません。", ephemeral: true });
      return;
    }

    // /yokoso
    if (interaction.commandName === "yokoso") {
      await interaction.reply({ content: "送信しました。", ephemeral: true });
      await ch.send("ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？");
      return;
    }

    // VCログ先
    if (interaction.commandName === "voice") {
      setGuildSetting(interaction.guildId, "voiceLogChannelId", ch.id);
      await interaction.reply({ content: `このチャンネルをVCログ送信先に設定しました: ${ch}`, ephemeral: true });
      return;
    }

    // 許可 / 剥奪
    if (interaction.commandName === "roll" || interaction.commandName === "deroll") {
      const target = interaction.options.getMentionable("target", true);

      // Role か User か確認
      const isRole = !!target?.id && target?.constructor?.name === "Role";
      const isUser = !!target?.id && (target?.constructor?.name === "User");

      if (!isRole && !isUser) {
        await interaction.reply({ content: "ロールまたはユーザーを指定してください。", ephemeral: true });
        return;
      }

      const guildId = interaction.guildId;

      if (interaction.commandName === "roll") {
        if (isRole) {
          const arr = addToGuildList(guildId, "allowRoleIds", target.id);
          await interaction.reply({ content: `許可ロールに追加しました: <@&${target.id}>\n現在の許可ロール数: ${arr.length}`, ephemeral: true });
        } else {
          const arr = addToGuildList(guildId, "allowUserIds", target.id);
          await interaction.reply({ content: `許可ユーザーに追加しました: <@${target.id}>\n現在の許可ユーザー数: ${arr.length}`, ephemeral: true });
        }
        return;
      }

      // deroll
      if (isRole) {
        const arr = removeFromGuildList(guildId, "allowRoleIds", target.id);
        await interaction.reply({ content: `許可ロールから削除しました: <@&${target.id}>\n現在の許可ロール数: ${arr.length}`, ephemeral: true });
      } else {
        const arr = removeFromGuildList(guildId, "allowUserIds", target.id);
        await interaction.reply({ content: `許可ユーザーから削除しました: <@${target.id}>\n現在の許可ユーザー数: ${arr.length}`, ephemeral: true });
      }
      return;
    }

    // 抽出元
    if (interaction.commandName === "source_meshi") {
      const src = interaction.options.getChannel("channel", true);
      setGuildSetting(interaction.guildId, "sourceMeshiChannelId", src.id);
      await interaction.reply({ content: `めしてろ抽出元を設定しました: ${src}`, ephemeral: true });
      return;
    }

    if (interaction.commandName === "source_sake") {
      const src = interaction.options.getChannel("channel", true);
      setGuildSetting(interaction.guildId, "sourceSakeChannelId", src.id);
      await interaction.reply({ content: `酒抽出元を設定しました: ${src}`, ephemeral: true });
      return;
    }

    // meshitero / sake
    if (interaction.commandName === "meshitero") {
      await interaction.deferReply({ ephemeral: true });

      const s = getGuildSettings(interaction.guildId);
      const srcId = s.sourceMeshiChannelId || MESHI_CHANNEL_ID;

      const picked = await getRandomImageUrlFromChannel(interaction.guild, srcId);
      if (!picked) {
        await interaction.editReply("めしてろ画像が見つかりませんでした。");
        return;
      }

      await ch.send({ content: "めしてろします。", files: [picked.url] });
      await interaction.editReply("送信しました。");
      return;
    }

    if (interaction.commandName === "sake") {
      await interaction.deferReply({ ephemeral: true });

      const s = getGuildSettings(interaction.guildId);
      const srcId = s.sourceSakeChannelId || SAKE_CHANNEL_ID;

      const picked = await getRandomImageUrlFromChannel(interaction.guild, srcId);
      if (!picked) {
        await interaction.editReply("ガハハ！失敗…");
        return;
      }

      await ch.send({ content: "ガハハ！", files: [picked.url] });
      await interaction.editReply("送信しました。");
      return;
    }
  };
};
