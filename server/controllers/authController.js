const bcrypt = require("bcrypt");

const User = require("../models/User");
const {
  createRazorpayContact,
  createRazorpayFundAccount,
  createRazorpayOrder,
  createRazorpayPayout,
  ensureRazorpayConfigured,
  getRazorpayConfig,
  verifyRazorpaySignature,
} = require("../utils/razorpay");
const { buildTokenPayload, signToken } = require("../utils/jwt");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");
const { coinsToRupees, MIN_WITHDRAW_COINS, rupeesToCoins } = require("../utils/wallet");
const STRICT_SINGLE_SESSION = process.env.STRICT_SINGLE_SESSION === "true";

function sanitizeUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    totalMatches: user.totalMatches,
    coinBalance: user.coinBalance,
    activeMatchId: user.activeMatchId,
    activeMatchStatus: user.activeMatchStatus,
    upiId: user.upiId,
  };
}

function formatWalletTransaction(transaction) {
  return {
    id: transaction._id,
    type: transaction.type,
    rupeesAmount: transaction.rupeesAmount,
    coinsAmount: transaction.coinsAmount,
    status: transaction.status,
    note: transaction.note,
    provider: transaction.provider,
    referenceId: transaction.referenceId,
    paymentId: transaction.paymentId,
    createdAt: transaction.createdAt,
  };
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email and password are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists with that email or username" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = signToken(buildTokenPayload(user));
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (STRICT_SINGLE_SESSION) {
      user.sessionVersion += 1;
      await user.save();
    }

    const token = signToken(buildTokenPayload(user));
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
}

async function updateProfile(req, res, next) {
  try {
    const { username, email, avatarUrl = "", bio = "" } = req.body;

    if (!username || !email) {
      return res.status(400).json({ success: false, message: "Username and email are required" });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Username must be at least 3 characters long" });
    }

    if (bio.length > 240) {
      return res.status(400).json({ success: false, message: "Bio must be 240 characters or fewer" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Username or email is already in use" });
    }

    req.user.username = trimmedUsername;
    req.user.email = normalizedEmail;
    req.user.avatarUrl = avatarUrl.trim();
    req.user.bio = bio.trim();
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getWallet(req, res) {
  const paymentConfig = getRazorpayConfig();

  return res.status(200).json({
    success: true,
    wallet: {
      coinBalance: req.user.coinBalance,
      paymentProvider: paymentConfig.keyId ? "razorpay" : "manual",
      razorpayKeyId: paymentConfig.keyId || null,
      payoutsEnabled: Boolean(paymentConfig.payoutsAccountNumber),
      upiId: req.user.upiId || "",
      conversion: {
        rupeesPer100Coins: 10,
        coinsPer10Rupees: 100,
        minimumWithdrawalCoins: MIN_WITHDRAW_COINS,
      },
      transactions: [...req.user.walletTransactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(formatWalletTransaction),
    },
  });
}

async function createDepositOrder(req, res, next) {
  try {
    ensureRazorpayConfigured();

    const rupeesAmount = Number(req.body.rupeesAmount);

    if (!Number.isFinite(rupeesAmount) || rupeesAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid rupee amount" });
    }

    const coinsAmount = rupeesToCoins(rupeesAmount);
    const shortUser = req.user._id.toString().slice(-6);
    const receipt = `dep_${shortUser}_${Date.now().toString(36)}`;
    const order = await createRazorpayOrder({
      amountInRupees: rupeesAmount,
      receipt,
      notes: {
        userId: req.user._id.toString(),
        coinsAmount: String(coinsAmount),
      },
    });

    req.user.walletTransactions.unshift({
      type: "deposit",
      rupeesAmount,
      coinsAmount,
      status: "pending",
      note: `Awaiting payment verification for ${coinsAmount} coins`,
      provider: "razorpay",
      referenceId: order.id,
    });
    await req.user.save();

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyDepositOrder(req, res, next) {
  try {
    ensureRazorpayConfigured();

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment verification fields are required" });
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const transaction = req.user.walletTransactions.find(
      (entry) => entry.referenceId === razorpayOrderId && entry.type === "deposit"
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Pending payment transaction not found" });
    }

    if (transaction.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        user: sanitizeUser(req.user),
      });
    }

    transaction.status = "completed";
    transaction.paymentId = razorpayPaymentId;
    transaction.note = `Verified Razorpay payment for ${transaction.coinsAmount} coins`;
    req.user.coinBalance += transaction.coinsAmount;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: `${transaction.coinsAmount} coins added successfully`,
      user: sanitizeUser(req.user),
      wallet: {
        coinBalance: req.user.coinBalance,
        transaction: formatWalletTransaction(transaction),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function depositCoins(req, res, next) {
  try {
    const rupeesAmount = Number(req.body.rupeesAmount);

    if (!Number.isFinite(rupeesAmount) || rupeesAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid rupee amount" });
    }

    const coinsAmount = rupeesToCoins(rupeesAmount);

    if (coinsAmount <= 0) {
      return res.status(400).json({ success: false, message: "Deposit amount is too small to convert into coins" });
    }

    req.user.coinBalance += coinsAmount;
    req.user.walletTransactions.unshift({
      type: "deposit",
      rupeesAmount,
      coinsAmount,
      status: "completed",
      note: `Added ${coinsAmount} coins from Rs ${rupeesAmount}`,
    });
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: `${coinsAmount} coins added successfully`,
      user: sanitizeUser(req.user),
      wallet: {
        coinBalance: req.user.coinBalance,
        transaction: formatWalletTransaction(req.user.walletTransactions[0]),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function withdrawCoins(req, res, next) {
  try {
    const coinsAmount = Number(req.body.coinsAmount);
    const upiId = String(req.body.upiId || "").trim().toLowerCase();

    if (!Number.isFinite(coinsAmount) || coinsAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid coin amount" });
    }

    if (!upiId) {
      return res.status(400).json({ success: false, message: "UPI ID is required for withdrawals" });
    }

    if (coinsAmount < MIN_WITHDRAW_COINS) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${MIN_WITHDRAW_COINS} coins`,
      });
    }

    if (coinsAmount > req.user.coinBalance) {
      return res.status(400).json({ success: false, message: "Insufficient coin balance" });
    }

    const rupeesAmount = coinsToRupees(coinsAmount);
    const referenceId = `wd_${req.user._id.toString().slice(-6)}_${Date.now().toString(36)}`;

    if (!req.user.razorpayContactId || !req.user.razorpayFundAccountId || req.user.upiId !== upiId) {
      const contact = await createRazorpayContact({
        name: req.user.username,
        email: req.user.email,
        contact: "9999999999",
        referenceId,
        notes: { userId: req.user._id.toString() },
      });

      const fundAccount = await createRazorpayFundAccount({
        contactId: contact.id,
        upiId,
      });

      req.user.razorpayContactId = contact.id;
      req.user.razorpayFundAccountId = fundAccount.id;
      req.user.upiId = upiId;
    }

    const payout = await createRazorpayPayout({
      fundAccountId: req.user.razorpayFundAccountId,
      amountInRupees: rupeesAmount,
      referenceId,
      notes: { userId: req.user._id.toString(), coinsAmount: String(coinsAmount) },
    });

    req.user.coinBalance -= coinsAmount;
    req.user.walletTransactions.unshift({
      type: "withdrawal",
      rupeesAmount,
      coinsAmount,
      status: payout.status === "processed" ? "completed" : "pending",
      note: `Razorpay payout ${payout.status || "processing"} for Rs ${rupeesAmount}`,
      provider: "razorpay",
      referenceId: payout.id,
    });
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: `Withdrawal initiated for Rs ${rupeesAmount}. Status: ${payout.status || "processing"}.`,
      user: sanitizeUser(req.user),
      wallet: {
        coinBalance: req.user.coinBalance,
        transaction: formatWalletTransaction(req.user.walletTransactions[0]),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getSocketToken(req, res, next) {
  try {
    const token = signToken(buildTokenPayload(req.user), { expiresIn: "10m" });
    return res.status(200).json({ success: true, token });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user && STRICT_SINGLE_SESSION) {
      req.user.sessionVersion += 1;
      await req.user.save();
    }

  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  updateProfile,
  getWallet,
  createDepositOrder,
  verifyDepositOrder,
  depositCoins,
  withdrawCoins,
  getSocketToken,
};
