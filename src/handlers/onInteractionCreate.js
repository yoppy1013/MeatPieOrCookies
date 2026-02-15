const isAllowed = require("../utils/isAllowed");
const {
  getGuildSettings,
  setGuildSetting,
  addToGuildList,
  removeFromGuildList,
} = require("../store/guildSettings");
const {MessageFlags,ChannelType } = require("discord.js");
const timerManager = require("../utils/timerManager");

function parseTimeToNextJstDate(timeStr) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeStr);
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] ? Number(m[3]) : 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;

  const now = new Date();

  const jstNowStr = now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
  const targetJst = new Date(jstNowStr);

  targetJst.setHours(hh, mm, ss, 0);

  const currentJst = new Date(jstNowStr);

  if (targetJst.getTime() <= currentJst.getTime()) {
    targetJst.setDate(targetJst.getDate() + 1);
  }

  const diffMs = targetJst.getTime() - currentJst.getTime();
  return new Date(Date.now() + diffMs);
}

function formatJstDateTime(msUtc) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(msUtc)).replace(/\//g, "/");
}




module.exports = function onInteractionCreate({ client}) {
  return async (interaction) => {
    try {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.guild) {
      await interaction.reply({ content: "コマンドはサーバ内でのみ使用できます。", flags: MessageFlags.Ephemeral });
      return;
    }

    const ch = interaction.channel;

// 権限コマンド
    const needsAllow = new Set([
      "welcome",
      "voicelog",
      "stamsg",
      "roll",
      "deroll",
      "meshitero",
      "sake",
      "welroll",
      "dewelroll",
      "ignore",
    ]);

    if (needsAllow.has(interaction.commandName) && !isAllowed(interaction)) {
      await interaction.reply({ content: "このコマンドを実行する権限がありません", flags: MessageFlags.Ephemeral });
      return;
    }

    // /yokoso
    if (interaction.commandName === "welcome") {
      setGuildSetting(interaction.guildId, "welcomeChannelId", interaction.channelId);
      await interaction.reply({
        content: `入室時のメッセージの送信を${interaction.channel}に設定しました`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // VCログ先
    if (interaction.commandName === "voicelog") {
      setGuildSetting(interaction.guildId, "voiceLogChannelId", ch.id);
      await interaction.reply({ content: ` ${ch}をVCログ送信先に設定しました`, flags: MessageFlags.Ephemeral });
      return;
    }

    // VCステータス通知先
if (interaction.commandName === "stamsg") {
  setGuildSetting(interaction.guildId, "voiceStatusLogChannelId", ch.id);
  await interaction.reply({
    content: `${ch} をVCステータス通知先に設定しました`,
    flags: MessageFlags.Ephemeral,
  });
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

    
    // status
    if (interaction.commandName === "status") {

      if (!isAllowed(interaction)) {
        await interaction.reply({
        content: "このコマンドを実行する権限がありません。",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const s = getGuildSettings(interaction.guildId);
    const ignoredVCs = s.ignoredVoiceChannelIds ?? [];
    const ignoredText =
      ignoredVCs.length
      ? ignoredVCs.map(id => `<#${id}>`).join(" ")
      : "なし";
    const allowRoles = s.allowRoleIds ?? [];
    const allowUsers = s.allowUserIds ?? [];

    const allowText = [
      allowRoles.length ? `ロール: ${allowRoles.map(id => `<@&${id}>`).join(" ")}` : null,
      allowUsers.length ? `ユーザー: ${allowUsers.map(id => `<@${id}>`).join(" ")}` : null,
    ].filter(Boolean).join("\n") || "なし";

    const fmtChannel = id => id ? `<#${id}>` : "未設定";
    const fmtRole = id => `<@&${id}>`;
    const welcomeRoles = s.welcomeRoleIds ?? [];
    const text = [
    "**現在の設定**",
    "",
    `入室メッセージ: ${fmtChannel(s.welcomeChannelId)}`,
    `VCログ: ${fmtChannel(s.voiceLogChannelId)}`,
    `VCステータス通知: ${fmtChannel(s.voiceStatusLogChannelId)}`,
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
    "",
   `通知除外VC: ${ignoredText}`,
  ].join("\n");

  await interaction.editReply({
    content: text,
  });

    return;
    }

    // ignore 
if (interaction.commandName === "ignore") {
  const guildId = interaction.guildId;

  const targetChannel = interaction.options.getChannel('channel');

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
    await interaction.editReply({
      content: "無効なチャンネルです。ボイスチャンネルを指定してください。",
    });
    return;
  }
  const arr = addToGuildList(guildId, "ignoredVoiceChannelIds", targetChannel.id);

  await interaction.editReply({
    content: `VC「${targetChannel.name}」を通知除外対象に設定しました。（現在 ${arr.length}件）`,
  });

  return;
}
    // ようこそ
    if (interaction.commandName === "yokoso") {
      await interaction.reply({ content: "ようこそいらいしゃい！みんな来ると思ってミートパイを焼いてたの！それともクッキーがいいかしら？" });
      return;
    }


// タイマー
if (interaction.commandName === "timer") {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // ---- cancel ----
  if (sub === "cancel") {
    const ok = timerManager.cancelTimer(guildId, userId);
    await interaction.editReply(ok ? "タイマーを解除しました" : "タイマーは設定されていません");
    return;
  }

  // ---- status ----
  if (sub === "status") {
    const t = timerManager.getTimer(guildId, userId);
    if (!t) {
      await interaction.editReply("タイマーは設定されていません。");
      return;
    }
    await interaction.editReply(
      `タイマー設定中です\n実行予定: **${formatJstDateTime(t.fireAtMs)}**\n残り: **${t.remaining}**`
    );
    return;
  }

  // ---- set ----
  if (sub === "set") {
    const timeStr = interaction.options.getString("time", true);
    const fireAt = parseTimeToNextJstDate(timeStr);
    if (!fireAt) {
      await interaction.editReply("時刻は `HH:MM` または `HH:MM:SS` で指定してください");
      return;
    }

    // 実行者がVCにいるか確認
    const member = interaction.member;
    if (!member?.voice?.channelId) {
      await interaction.editReply("まずVCに参加してから `/timer set` を実行してください");
      return;
    }

    const fireAtMs = fireAt.getTime();
    const delayMs = fireAtMs - Date.now();
    if (delayMs <= 0 || delayMs > 24 * 60 * 60 * 1000) {
      await interaction.editReply("時刻が不正です");
      return;
    }

    //永続化、10分前DM、再起動復元
    timerManager.setTimer(client, guildId, userId, fireAtMs);

    await interaction.editReply(
      `**${formatJstDateTime(fireAtMs)}** にVCから切断します\n DMを許可している場合、10分前にDMで通知します \n取り消すとき: \`/timer cancel\`\n確認するとき: \`/timer status\``
    );
    return;
  }
}
} catch (e) {
    console.error("onInteractionCreate.jsでエラーが発生しました:", e);
  }

  };
};
