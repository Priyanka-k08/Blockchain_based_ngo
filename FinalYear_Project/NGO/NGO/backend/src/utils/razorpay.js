const crypto = require("crypto");

function configured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function demoOrder(amountInr, receipt) {
  const paise = Math.round(Number(amountInr) * 100);
  return {
    id: `order_demo_${crypto.randomBytes(6).toString("hex")}`,
    amount: paise,
    currency: "INR",
    receipt,
    status: "created",
  };
}

async function createOrder(amountInr, receipt) {
  if (!configured()) {
    return { order: demoOrder(amountInr, receipt), demo: true, keyId: "rzp_demo_kindledger" };
  }
  const paise = Math.round(Number(amountInr) * 100);
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: paise,
      currency: "INR",
      receipt,
      notes: { project: "kindledger" },
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.description || "Could not create Razorpay order.");
    error.status = 502;
    throw error;
  }
  return { order: body, demo: false, keyId: process.env.RAZORPAY_KEY_ID };
}

function verifySignature({ orderId, paymentId, signature }) {
  if (!configured()) {
    return Boolean(orderId && paymentId && signature === `demo_${orderId}`);
  }
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

module.exports = { configured, createOrder, verifySignature };
