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
  const JST = 9 * 60 * 60 * 1000;
  const d = new Date(msUtc + JST);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
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
        const vcText = vc ? `現在VC: **${vc.name}**` : "現在VC: （未参加）";

        await member.send(
          `⏰ <@${userId}> タイマー通知：あと **10分** でVCから切断されます。\n` +
          `予定時刻: **${formatJst(fireAtMs)} (JST)**\n` +
          `${vcText}\n` +
          `解除するならサーバで \`/timer cancel\` を実行してください。`
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
