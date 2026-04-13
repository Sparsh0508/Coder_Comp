const crypto = require("crypto");

function getRazorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

function ensureRazorpayConfigured() {
  const config = getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    throw new Error("Razorpay is not configured");
  }

  return config;
}

async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }) {
  const { keyId, keySecret } = ensureRazorpayConfigured();
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Razorpay order: ${message}`);
  }

  return response.json();
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = ensureRazorpayConfigured();
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = {
  createRazorpayOrder,
  ensureRazorpayConfigured,
  getRazorpayConfig,
  verifyRazorpaySignature,
};
