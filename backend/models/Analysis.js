const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
  {
    currentUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    previousUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    familyMembers: {
      type: Number,
      required: true,
      min: 1,
    },
    houseType: {
      type: String,
      required: true,
      enum: ["1BHK", "2BHK", "3BHK", "Villa"],
    },
    estimatedBill: {
      type: Number,
      required: true,
    },
    changePercent: {
      type: Number,
      required: true,
    },
    efficiencyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    efficiencyLevel: {
      type: String,
      required: true,
      enum: ["efficient", "moderate", "high"],
    },
    carbonFootprint: {
      type: Number,
      required: true,
    },
    suggestedSavings: {
      type: Number,
      required: true,
    },
    savingsPercent: {
      type: Number,
      required: true,
    },
    perPersonUsage: {
      type: Number,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    categoryBreakdown: {
      type: [
        {
          category: String,
          percentage: Number,
          units: Number,
        },
      ],
      default: [],
    },
    assumptions: {
      rate: {
        type: Number,
        required: true,
      },
      emissionFactor: {
        type: Number,
        required: true,
      },
      categorySplit: {
        type: [
          {
            category: String,
            percentage: Number,
          },
        ],
        required: true,
      },
    },
  },
  { timestamps: true }
);

AnalysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Analysis", AnalysisSchema);
