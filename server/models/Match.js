const mongoose = require("mongoose");

const matchPlayerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
    team: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    coinContribution: {
      type: Number,
      default: 0,
    },
    balanceAfterEntry: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["waiting", "coding", "submitted", "accepted", "defeated", "disconnected"],
      default: "coding",
    },
    latestLanguage: {
      type: String,
      enum: ["cpp", "java", "python"],
      default: "cpp",
    },
    isTyping: {
      type: Boolean,
      default: false,
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },
    passedTests: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    lastSubmissionAt: Date,
    lastSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    mode: {
      type: String,
      enum: ["1v1", "2v2", "4v4"],
      default: "1v1",
    },
    teamSize: {
      type: Number,
      enum: [1, 2, 4],
      default: 1,
    },
    players: {
      type: [matchPlayerSchema],
      validate: {
        validator(players) {
          return [2, 4, 8].includes(players.length);
        },
        message: "A match must have 2, 4, or 8 players",
      },
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "lobby", "active", "completed", "cancelled"],
      default: "lobby",
    },
    lobbyEndsAt: {
      type: Date,
      required: true,
    },
    matchStartsAt: {
      type: Date,
      required: true,
    },
    countdownEndsAt: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    winnerTeam: {
      type: Number,
      enum: [1, 2],
      default: null,
    },
    entryCoins: {
      type: Number,
      default: 0,
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    prizeDistributed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);
