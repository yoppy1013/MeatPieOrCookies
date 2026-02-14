const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "..", "data", "guildSettings.json");

function ensureDir() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir();

function loadAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

function getAllGuildSettings() {
  return loadAll();
}

function saveAll(all) {
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}

function getGuildSettings(guildId) {
  const all = loadAll();
  return all[guildId] ?? {};
}

function setGuildSetting(guildId, key, value) {
  const all = loadAll();
  all[guildId] = all[guildId] ?? {};
  all[guildId][key] = value;
  saveAll(all);
}

function addToGuildList(guildId, key, value) {
  const all = loadAll();
  all[guildId] = all[guildId] ?? {};
  const arr = Array.isArray(all[guildId][key]) ? all[guildId][key] : [];
  if (!arr.includes(value)) arr.push(value);
  all[guildId][key] = arr;
  saveAll(all);
  return arr;
}

function removeFromGuildList(guildId, key, value) {
  const all = loadAll();
  all[guildId] = all[guildId] ?? {};
  const arr = Array.isArray(all[guildId][key]) ? all[guildId][key] : [];
  const next = arr.filter(v => v !== value);
  all[guildId][key] = next;
  saveAll(all);
  return next;
}

module.exports = {
  getGuildSettings,
  setGuildSetting,
  addToGuildList,
  removeFromGuildList,
  getAllGuildSettings
};
