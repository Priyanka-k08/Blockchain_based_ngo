const { query } = require("../config/db");

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length > 8) return digits;
  return null;
}

async function sendWhatsApp({ userId, phone, kind, body, videoUrl, meta }) {
  const to = normalizePhone(phone);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let status = "demo";
  let providerId = null;

  if (to && token && phoneId) {
    try {
      const payload = videoUrl
        ? {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: `${body}\n\nVideo: ${videoUrl}` },
          }
        : {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body },
          };
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        status = "sent";
        providerId = data.messages?.[0]?.id || null;
      } else {
        status = "failed";
        providerId = data.error?.message || "whatsapp_error";
      }
    } catch (error) {
      status = "failed";
      providerId = error.message;
    }
  }

  await query(
    `INSERT INTO notifications (user_id, channel, recipient_phone, kind, body, video_url, status, provider_id, meta_json)
     VALUES (?, 'whatsapp', ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      to || phone || null,
      kind,
      body,
      videoUrl || null,
      status,
      providerId,
      meta ? JSON.stringify(meta) : null,
    ]
  );

  return { status, to, demo: status === "demo" };
}

function donationConfirmText({ name, amount, campaign, receipt, paymentId }) {
  return [
    `KindLedger Trust: thank you ${name}.`,
    `We received ₹${Number(amount).toLocaleString("en-IN")} for ${campaign}.`,
    `Receipt ${receipt}. Payment ${paymentId}.`,
    "This gift stays private on the public ledger until our admin publishes the record.",
  ].join(" ");
}

function utilizationText({ name, campaign, title, amount, videoUrl, impact }) {
  return [
    `KindLedger Trust: ${name}, your gift toward ${campaign} has been used.`,
    `${title} · ₹${Number(amount).toLocaleString("en-IN")}.`,
    impact,
    `Watch the field video: ${videoUrl}`,
  ]
    .filter(Boolean)
    .join(" ");
}

module.exports = {
  normalizePhone,
  sendWhatsApp,
  donationConfirmText,
  utilizationText,
};
