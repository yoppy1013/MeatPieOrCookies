const { getGuildSettings } = require("../store/guildSettings");

module.exports = function isAllowed(interaction) {
  if (!interaction.guild) return false;

  // 管理者は常に許可
  if (interaction.memberPermissions?.has("Administrator")) return true;

  const s = getGuildSettings(interaction.guildId);
  const allowUsers = Array.isArray(s.allowUserIds) ? s.allowUserIds : [];
  const allowRoles = Array.isArray(s.allowRoleIds) ? s.allowRoleIds : [];

  // ユーザー許可
  if (allowUsers.includes(interaction.user.id)) return true;

  // ロール許可
  const memberRoleIds = interaction.member?.roles?.cache
    ? [...interaction.member.roles.cache.keys()]
    : [];

  return memberRoleIds.some(rid => allowRoles.includes(rid));
};
