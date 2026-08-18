const FROM = process.env.REMINDER_FROM || "Cradlink <reminders@cradlink.com>";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    res.statusCode = 204;
    res.end();
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const to = String(body.to || "").trim();
  const title = String(body.title || "").trim();
  const activityUrl = String(body.activityUrl || "").trim();
  const unsubscribeUrl = String(body.unsubscribeUrl || "").trim();
  if (!to || !title || !activityUrl) {
    res.statusCode = 400;
    res.end("Missing fields");
    return;
  }

  const safeTitle = escapeHtml(title);
  const html = `
    <p>Your activity <strong>${safeTitle}</strong> starts in about an hour.</p>
    <p><a href="${escapeHtml(activityUrl)}">Open the activity</a></p>
    <p style="color:#71767b;font-size:13px">
      Don’t want these emails?
      <a href="${escapeHtml(unsubscribeUrl)}">Turn off reminder emails</a>
    </p>
  `;

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: `Starting in an hour: ${title}`,
      html,
    }),
  });

  res.statusCode = sent.ok ? 204 : 502;
  res.end();
};
