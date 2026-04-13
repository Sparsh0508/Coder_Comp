const crypto = require("crypto");

function getRazorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    payoutsAccountNumber: process.env.RAZORPAYX_ACCOUNT_NUMBER || "",
  };
}

function ensureRazorpayConfigured() {
  const config = getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    throw new Error("Razorpay is not configured");
  }

  return config;
}

function ensureRazorpayPayoutConfigured() {
  const config = ensureRazorpayConfigured();

  if (!config.payoutsAccountNumber) {
    throw new Error("Razorpay payouts account is not configured");
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

async function createRazorpayContact({ name, email, contact, referenceId, notes = {} }) {
  const { keyId, keySecret } = ensureRazorpayConfigured();
  const response = await fetch("https://api.razorpay.com/v1/contacts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      contact,
      type: "customer",
      reference_id: referenceId,
      notes,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Razorpay contact: ${message}`);
  }

  return response.json();
}

async function createRazorpayFundAccount({ contactId, upiId }) {
  const { keyId, keySecret } = ensureRazorpayConfigured();
  const response = await fetch("https://api.razorpay.com/v1/fund_accounts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contact_id: contactId,
      account_type: "vpa",
      vpa: {
        address: upiId,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Razorpay fund account: ${message}`);
  }

  return response.json();
}

async function createRazorpayPayout({ fundAccountId, amountInRupees, referenceId, notes = {} }) {
  const { keyId, keySecret, payoutsAccountNumber } = ensureRazorpayPayoutConfigured();
  const response = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_number: payoutsAccountNumber,
      fund_account_id: fundAccountId,
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: "CodeCamp Arena payout",
      notes,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to create Razorpay payout: ${message}`);
  }

  return response.json();
}

module.exports = {
  createRazorpayOrder,
  createRazorpayContact,
  createRazorpayFundAccount,
  createRazorpayPayout,
  ensureRazorpayConfigured,
  ensureRazorpayPayoutConfigured,
  getRazorpayConfig,
  verifyRazorpaySignature,
};
