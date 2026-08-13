const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["warning", "critical", "info"],
    },
    sourceType: {
      type: String,
      required: true,
      enum: ["spike", "sustained", "info"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    readingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EnergyData",
      default: null,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    category: {
      type: String,
      default: null,
    },
    value: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
