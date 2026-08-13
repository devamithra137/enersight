// models/EnergyData.js
// MongoDB schema for storing energy consumption readings

const mongoose = require("mongoose");

const EnergyDataSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
    },

    units: {
      type: Number,
      required: [true, "Energy units (kWh) are required"],
      min: [0, "Energy units cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["AC", "Lighting", "Appliances", "HVAC", "Computers", "Other"],
        message: "{VALUE} is not a recognized energy category",
      },
      trim: true,
    },

    deviceId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    // Automatically manage createdAt / updatedAt
    timestamps: true,

    // Lean queries return plain JS objects — faster for read-heavy analytics
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary index: time-series queries (trends, peak detection, impact)
EnergyDataSchema.index({ timestamp: -1 });

// Compound index: category breakdown over a time window
EnergyDataSchema.index({ category: 1, timestamp: -1 });

// Compound index: per-device analysis over time
EnergyDataSchema.index({ deviceId: 1, timestamp: -1 });

// ── Static helpers (used by aggregation pipelines) ────────────────────────────

/**
 * Returns a $match stage that filters to the last N days from now.
 * @param {number} days
 */
EnergyDataSchema.statics.matchLastNDays = function (days) {
  return {
    $match: {
      timestamp: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
  };
};

module.exports = mongoose.model("EnergyData", EnergyDataSchema);
