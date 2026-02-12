function norm(s) {
  return (s ?? "").toString().normalize("NFKC").toLowerCase();
}

async function findMembersByContainedName(guild, content, lastMemberFetchAt) {
  if (!guild || !content) return [];

  const text = norm(content);
  const MIN_LEN = 0;

  const matchFromCollection = (collection) => {
    const hits = [];
    for (const m of collection.values()) {
      const names = [
        m.nickname,
        m.displayName,
        m.user?.globalName,
        m.user?.username,
      ].filter(Boolean).map(norm);

      const uniqNames = [...new Set(names)];
      const matched = uniqNames.find(n => n.length >= MIN_LEN && text.includes(n));
      if (matched) hits.push({ member: m, matched });
    }
    return hits;
  };

  // キャッシュ検索
  let hits = matchFromCollection(guild.members.cache);
  if (hits.length > 0) {
    const uniq = new Map();
    for (const h of hits) if (!uniq.has(h.member.id)) uniq.set(h.member.id, h);
    return [...uniq.values()];
  }

  // 見つからない時だけ全員fetch
  const now = Date.now();
  const last = lastMemberFetchAt.get(guild.id) ?? 0;
  const COOLDOWN_MS = 60_000;
  if (now - last < COOLDOWN_MS) return [];
  lastMemberFetchAt.set(guild.id, now);

  const fetched = await guild.members.fetch().catch(() => null);
  if (!fetched) return [];

  hits = matchFromCollection(fetched);

  const uniq = new Map();
  for (const h of hits) if (!uniq.has(h.member.id)) uniq.set(h.member.id, h);
  return [...uniq.values()];
}

module.exports = { findMembersByContainedName };
