const bcrypt = require("bcrypt");

const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");
const { coinsToRupees, MIN_WITHDRAW_COINS, rupeesToCoins } = require("../utils/wallet");

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

    const token = signToken({ userId: user._id.toString() });
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

    const token = signToken({ userId: user._id.toString() });
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
  return res.status(200).json({
    success: true,
    wallet: {
      coinBalance: req.user.coinBalance,
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

    if (!Number.isFinite(coinsAmount) || coinsAmount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid coin amount" });
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
    req.user.coinBalance -= coinsAmount;
    req.user.walletTransactions.unshift({
      type: "withdrawal",
      rupeesAmount,
      coinsAmount,
      status: "pending",
      note: `Withdrawal request for Rs ${rupeesAmount}`,
    });
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: `Withdrawal request placed for Rs ${rupeesAmount}`,
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

function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

module.exports = {
  register,
  login,
  me,
  logout,
  updateProfile,
  getWallet,
  depositCoins,
  withdrawCoins,
};
