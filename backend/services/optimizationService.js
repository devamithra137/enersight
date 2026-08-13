const EnergyData = require("../models/EnergyData");
const Recommendation = require("../models/Recommendation");
const { emitEnergyUpdate } = require("../sockets/socketHandler");

const MIN_REDUCTION = 10;
const MAX_REDUCTION = 20;

let activeReductionPercent = 0;

function clampReduction(value) {
  return Math.min(MAX_REDUCTION, Math.max(MIN_REDUCTION, value));
}

function deterministicReduction(recommendationId) {
  const seed = String(recommendationId || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return clampReduction(10 + (seed % 11));
}

function getOptimizationMultiplier() {
  return parseFloat((1 - activeReductionPercent / 100).toFixed(4));
}

function applyOptimizationToUnits(units) {
  const optimized = Number(units) * getOptimizationMultiplier();
  return parseFloat(Math.max(0, optimized).toFixed(4));
}

async function applyRecommendation(recommendationId, io) {
  const impactReductionPercent = deterministicReduction(recommendationId);
  activeReductionPercent = Math.max(activeReductionPercent, impactReductionPercent);

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

  const latest = await EnergyData.findOne().sort({ timestamp: -1 });
  let optimizedReading = null;

  if (latest) {
    optimizedReading = await EnergyData.create({
      timestamp: new Date(),
      units: applyOptimizationToUnits(latest.units),
      category: latest.category,
      deviceId: latest.deviceId,
    });

    if (io) {
      emitEnergyUpdate(io, optimizedReading, {
        optimized: true,
        recommendationId,
        impactReductionPercent,
      });
    }
  }

  if (io) {
    io.emit("recommendation:applied", {
      event: "recommendation:applied",
      recommendationId,
      status: recommendation.status,
      appliedAt: recommendation.appliedAt,
      impactReductionPercent,
      optimizedReading,
      timestamp: new Date().toISOString(),
    });
  }

  return { recommendation, optimizedReading, impactReductionPercent };
}

module.exports = {
  applyRecommendation,
  applyOptimizationToUnits,
  getOptimizationMultiplier,
};
