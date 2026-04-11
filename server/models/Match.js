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
    players: {
      type: [matchPlayerSchema],
      validate: {
        validator(players) {
          return players.length === 2;
        },
        message: "A match must have exactly two players",
      },
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "active",
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);
