const { getAllGuildSettings, getGuildSettings, setGuildSetting } = require("../store/guildSettings");

const userTimers = new Map();
// key `${guildId}:${userId}` -> { disconnectId, remindId }

const KEY = "timers";
const REMIND_BEFORE_MS = 10 * 60 * 1000;

function makeKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function formatRemaining(ms) {
  if (ms <= 0) return "0秒";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const parts = [];
  if (h) parts.push(`${h}時間`);
  if (m) parts.push(`${m}分`);
  parts.push(`${r}秒`);
  return parts.join("");
}

function formatJst(msUtc) {
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

function clearOne(key) {
  const t = userTimers.get(key);
  if (!t) return;
  if (t.remindId) clearTimeout(t.remindId);
  if (t.disconnectId) clearTimeout(t.disconnectId);
  userTimers.delete(key);
}

function scheduleOne(client, guildId, userId, fireAtMs) {
  const key = makeKey(guildId, userId);
  clearOne(key);

  const now = Date.now();
  const delayDisconnect = fireAtMs - now;
  if (delayDisconnect <= 0) return false;

  // 10分前リマインド
  let remindId = null;
  const remindAtMs = fireAtMs - REMIND_BEFORE_MS;
  const delayRemind = remindAtMs - now;

  if (delayRemind > 0) {
    remindId = setTimeout(async () => {
      try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;

        const vc = member.voice?.channel;
        const vcText = vc ? `参加中のVC: **${vc.name}**` : "参加中のVC: （未参加）";

        await member.send(
          `<@${userId}> VC切断予告通知：あと **10分** でVCから切断されます。\n` +
          `予定時刻: **${formatJst(fireAtMs)}**\n` +
          `${vcText}\n` +
          `解除する場合、サーバ上で \`/timer cancel\` を実行してください。\n`+
          `現在の設定は、サーバ上で \`/timer status\` で確認できます。\n` +
          `※指定時刻にコマンドが実行されたサーバのVCに参加していない場合、この処理は行われません。\n`
        ).catch(() => null);
      } catch {
        // DM拒否などは無視
      }
    }, delayRemind);
  }

  // 切断本体
  const disconnectId = setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      if (!member.voice?.channelId) return; // VCにいなければ何もしない
      await member.voice.setChannel(null, "Timer disconnect").catch(() => null);
    } finally {
      clearOne(key);

      // 永続データから削除
      const s = getGuildSettings(guildId);
      const timers = s[KEY] || {};
      if (timers[userId]) {
        delete timers[userId];
        setGuildSetting(guildId, KEY, timers);
      }
    }
  }, delayDisconnect);

  userTimers.set(key, { disconnectId, remindId });
  return true;
}

async function restoreAll(client) {
  const all = getAllGuildSettings();

  for (const [guildId, settings] of Object.entries(all)) {
    const timers = settings?.[KEY];
    if (!timers || typeof timers !== "object") continue;

    let changed = false;
    for (const [userId, fireAtMs] of Object.entries(timers)) {
      if (typeof fireAtMs !== "number" || fireAtMs <= Date.now()) {
        delete timers[userId];
        changed = true;
        continue;
      }
      scheduleOne(client, guildId, userId, fireAtMs);
    }

    if (changed) setGuildSetting(guildId, KEY, timers);
  }
}

function setTimer(client, guildId, userId, fireAtMs) {
  const s = getGuildSettings(guildId);
  const timers = (s[KEY] && typeof s[KEY] === "object") ? s[KEY] : {};
  timers[userId] = fireAtMs;
  setGuildSetting(guildId, KEY, timers);

  return scheduleOne(client, guildId, userId, fireAtMs);
}

function cancelTimer(guildId, userId) {
  const key = makeKey(guildId, userId);
  clearOne(key);

  const s = getGuildSettings(guildId);
  const timers = s[KEY] || {};
  if (timers[userId]) {
    delete timers[userId];
    setGuildSetting(guildId, KEY, timers);
    return true;
  }
  return false;
}

function getTimer(guildId, userId) {
  const s = getGuildSettings(guildId);
  const timers = s[KEY] || {};
  const fireAtMs = timers[userId];
  if (typeof fireAtMs !== "number") return null;
  return { fireAtMs, remaining: formatRemaining(fireAtMs - Date.now()) };
}

module.exports = {
  restoreAll,
  setTimer,
  cancelTimer,
  getTimer,
};
