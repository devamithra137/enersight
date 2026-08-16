const Recommendation = require("../models/Recommendation");

const MIN_REDUCTION = 10;
const MAX_REDUCTION = 20;

function clampReduction(value) {
  return Math.min(MAX_REDUCTION, Math.max(MIN_REDUCTION, value));
}

function deterministicReduction(recommendationId) {
  const seed = String(recommendationId || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return clampReduction(10 + (seed % 11));
}

async function applyRecommendation(recommendationId, io) {
  const impactReductionPercent = deterministicReduction(recommendationId);

  const recommendation = await Recommendation.findOneAndUpdate(
    { recommendationId },
    {
      $set: {
        status: "applied",
        appliedAt: new Date(),
        impactReductionPercent,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (io) {
    io.emit("recommendation:applied", {
      event: "recommendation:applied",
      recommendationId,
      status: recommendation.status,
      appliedAt: recommendation.appliedAt,
      impactReductionPercent,
      optimizedReading: null,
      timestamp: new Date().toISOString(),
    });
  }

  return { recommendation, optimizedReading: null, impactReductionPercent };
}

module.exports = {
  applyRecommendation,
};
