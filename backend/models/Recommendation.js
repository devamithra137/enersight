const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema(
  {
    recommendationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "applied"],
      default: "pending",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    impactReductionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", RecommendationSchema);
