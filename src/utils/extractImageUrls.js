module.exports = function extractImageUrls(msg) {
  const urls = [];

  // 添付ファイル
  for (const att of msg.attachments.values()) {
    const ct = att.contentType || "";
    const name = (att.name || "").toLowerCase();
    const isImage =
      ct.startsWith("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp");
    if (isImage) urls.push(att.url);
  }

  // 埋め込み
  for (const emb of msg.embeds) {
    if (emb.image?.url) urls.push(emb.image.url);
    if (emb.thumbnail?.url) urls.push(emb.thumbnail.url);
  }

  // 本文直URL
  const text = msg.content || "";
  const re = /(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))(?:\?\S*)?/gi;
  let m;
  while ((m = re.exec(text)) !== null) urls.push(m[1]);

  return urls;
};
