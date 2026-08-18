const SITE =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://cradlink.com");

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "cradlink";

const BOT =
  /bot|crawl|slurp|spider|facebook|whatsapp|telegram|discord|slack|linkedin|twitter|pinterest|skype|viber|preview|embed|whatsapp|applebot|bingpreview/i;

function field(value) {
  if (!value || typeof value !== "object") return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue?.values) return value.arrayValue.values.map(field);
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(src, type) {
  if (src && /^(https?:|data:)/i.test(src)) return src;
  if (src && src.startsWith("/")) return `${SITE}${src}`;
  if (src && /^[a-z0-9-]+$/i.test(src)) return `${SITE}/defaults/${src}.jpg`;
  const fallback = type ? `/defaults/${type}.jpg` : "/images/cradlink_banner_moto.png";
  return `${SITE}${fallback}`;
}

function htmlPage({ title, description, image, url }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const u = escapeHtml(url);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${u}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cradlink" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:image" content="${i}" />
  <meta property="og:image:alt" content="${t}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${i}" />
</head>
<body>
  <p><a href="${u}">${t}</a></p>
</body>
</html>`;
}

async function loadActivity(id) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/activities/${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const doc = await res.json();
  const fields = doc.fields || {};
  const images = field(fields.images);
  return {
    title: field(fields.title) || "Cradlink activity",
    description: field(fields.description) || "Find humans. Do human things.",
    type: field(fields.type) || "other",
    image: Array.isArray(images) ? images.find(Boolean) : null,
    visibility: field(fields.visibility) || "public",
  };
}

module.exports = async function handler(req, res) {
  const id = String(req.query.id || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const pageUrl = `${SITE}/activities/${id}`;
  const ua = String(req.headers["user-agent"] || "");

  if (!id) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(htmlPage({
      title: "Cradlink",
      description: "Find humans. Do human things.",
      image: `${SITE}/images/cradlink_banner_moto.png`,
      url: SITE,
    }));
    return;
  }

  if (!BOT.test(ua)) {
    res.statusCode = 302;
    res.setHeader("Location", pageUrl);
    res.end();
    return;
  }

  let activity = null;
  try {
    activity = await loadActivity(id);
  } catch {
    activity = null;
  }

  const title = activity?.title || "Cradlink";
  const description = String(activity?.description || "Find humans. Do human things.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const image = absoluteUrl(activity?.image, activity?.type);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  res.end(htmlPage({ title, description, image, url: pageUrl }));
};
