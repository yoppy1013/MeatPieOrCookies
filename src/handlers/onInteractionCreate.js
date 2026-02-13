const isAllowed = require("../utils/isAllowed");
const {
  getGuildSettings,
  setGuildSetting,
  addToGuildList,
  removeFromGuildList,
} = require("../store/guildSettings");
const { Role, User, GuildMember, MessageFlags } = require("discord.js");


module.exports = function onInteractionCreate({  }) {
  return async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.guild) {
      await interaction.reply({ content: "コマンドはサーバ内でのみ使用できます。", flags: MessageFlags.Ephemeral });
      return;
    }

    const ch = interaction.channel;

// 権限コマンド
    const needsAllow = new Set([
      "yosokoso",
      "voice",
      "roll",
      "deroll",
      "meshitero",
      "sake",
      "welroll",
      "dewelroll",
      "status",
    ]);

    if (needsAllow.has(interaction.commandName) && !isAllowed(interaction)) {
      await interaction.reply({ content: "このコマンドを実行する権限がありません", flags: MessageFlags.Ephemeral });
      return;
    }

    // /yokoso
    if (interaction.commandName === "yokoso") {
      setGuildSetting(interaction.guildId, "welcomeChannelId", interaction.channelId);
      await interaction.reply({
        content: `入室時のメッセージの送信を${interaction.channel}に設定しました`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // VCログ先
    if (interaction.commandName === "voice") {
      setGuildSetting(interaction.guildId, "voiceLogChannelId", ch.id);
      await interaction.reply({ content: ` ${ch}をVCログ送信先に設定しました`, flags: MessageFlags.Ephemeral });
      return;
    }

// 許可追加・剥奪
if (interaction.commandName === "roll" || interaction.commandName === "deroll") {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getMentionable("target", true);
  const guildId = interaction.guildId;

  const isAdd = interaction.commandName === "roll";
  const add = (key, val) => addToGuildList(guildId, key, val);
  const del = (key, val) => removeFromGuildList(guildId, key, val);

  const isRole = !!target?.name && !target?.user;
  const isMember = !!target?.user;

  if (isRole) {
    const arr = isAdd ? add("allowRoleIds", target.id) : del("allowRoleIds", target.id);
    await interaction.editReply(
      isAdd
        ? `許可ロールに追加しました: <@&${target.id}>（現在 ${arr.length}件）`
        : `許可ロールから削除しました: <@&${target.id}>（現在 ${arr.length}件）`
    );
    return;
  }

  if (isMember) {
    const uid = target.user.id;
    const arr = isAdd ? add("allowUserIds", uid) : del("allowUserIds", uid);
    await interaction.editReply(
      isAdd
        ? `許可ユーザーに追加しました: <@${uid}>（現在 ${arr.length}件）`
        : `許可ユーザーから削除しました: <@${uid}>（現在 ${arr.length}件）`
    );
    return;
  }

  await interaction.editReply("ロールまたはユーザーを指定してください。");
  return;
}

    // 抽出元
    if (interaction.commandName === "meshitero") {
      setGuildSetting(interaction.guildId, "meshiSourceChannelId", interaction.channelId);
      await interaction.reply({ content: `めしてろ抽出元を${interaction.channel}に設定しました`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (interaction.commandName === "sake") {
      setGuildSetting(interaction.guildId, "sakeSourceChannelId", interaction.channelId);
      await interaction.reply({ content: `酒抽出元を${interaction.channel}に設定しました`, flags: MessageFlags.Ephemeral });
      return;
    }

    //入室時付与ロールを追加
    if (interaction.commandName === "welroll") {
       if (!isAllowed(interaction)) {
        await interaction.reply({ content: "このコマンドを実行する権限がありません。", flags: MessageFlags.Ephemeral });
        return;
      }

    const role = interaction.options.getRole("role", true);
    const arr = addToGuildList(interaction.guildId, "welcomeRoleIds", role.id);

    await interaction.reply({
      content: `入室時付与ロールに追加しました: <@&${role.id}>（現在 ${arr.length}件）`,
      flags: MessageFlags.Ephemeral,
      });
      return;
    }

    //入室時付与ロールを解除
    if (interaction.commandName === "dewelroll") {
      if (!isAllowed(interaction)) {
        await interaction.reply({ content: "このコマンドを実行する権限がありません。", flags: MessageFlags.Ephemeral });
        return;
      }

    const role = interaction.options.getRole("role", true);
    const arr = removeFromGuildList(interaction.guildId, "welcomeRoleIds", role.id);

    await interaction.reply({
      content: `入室時付与ロールから解除しました: <@&${role.id}>（現在 ${arr.length}件）`,
      flags: MessageFlags.Ephemeral,
    });
    return;
    }

    // /status
    if (interaction.commandName === "status") {

      if (!isAllowed(interaction)) {
        await interaction.reply({
        content: "このコマンドを実行する権限がありません。",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const s = getGuildSettings(interaction.guildId);
    const allowRoles = s.allowRoleIds ?? [];
    const allowUsers = s.allowUserIds ?? [];

    const allowText = [
      allowRoles.length ? `ロール: ${allowRoles.map(id => `<@&${id}>`).join(" ")}` : null,
      allowUsers.length ? `ユーザー: ${allowUsers.map(id => `<@${id}>`).join(" ")}` : null,
    ].filter(Boolean).join("\n") || "なし";

    const fmtChannel = id => id ? `<#${id}>` : "未設定";
    const fmtRole = id => `<@&${id}>`;
    const fmtUser = id => `<@${id}>`;
    const allow = s.allowIds ?? [];
    const welcomeRoles = s.welcomeRoleIds ?? [];
    const text = [
    "**現在の設定**",
    "",
    `入室メッセージ: ${fmtChannel(s.welcomeChannelId)}`,
    `VCログ: ${fmtChannel(s.voiceLogChannelId)}`,
    `めしてろ画像元: ${fmtChannel(s.meshiSourceChannelId)}`,
    `酒画像元: ${fmtChannel(s.sakeSourceChannelId)}`,
    "",
    `コマンド実行許可対象:`,
     allowText,
    "",
    `入室時付与ロール: ${
      welcomeRoles.length
        ? welcomeRoles.map(fmtRole).join(" ")
        : "なし"
    }`,
  ].join("\n");

  await interaction.reply({
    content: text,
    flags: MessageFlags.Ephemeral,
  });

    return;
    }

  };
};
