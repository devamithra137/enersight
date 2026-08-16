const assert = require("node:assert/strict");

const Recommendation = require("../models/Recommendation");
const EnergyData = require("../models/EnergyData");

let updateArgs;
let energyDataTouched = false;
const appliedAt = new Date("2026-08-16T00:00:00.000Z");

Recommendation.findOneAndUpdate = async (...args) => {
  updateArgs = args;
  return { status: "applied", appliedAt };
};
EnergyData.findOne = () => {
  energyDataTouched = true;
  throw new Error("EnergyData must not be read when applying a recommendation");
};
EnergyData.create = async () => {
  energyDataTouched = true;
  throw new Error("EnergyData must not be created when applying a recommendation");
};

const emitted = [];
const { applyRecommendation } = require("../services/optimizationService");

async function run() {
  const result = await applyRecommendation("shift_peak_load", {
    emit: (...args) => emitted.push(args),
  });

  assert.equal(updateArgs[0].recommendationId, "shift_peak_load");
  assert.equal(updateArgs[1].$set.status, "applied");
  assert.equal(updateArgs[1].$set.appliedAt instanceof Date, true);
  assert.equal(typeof updateArgs[1].$set.impactReductionPercent, "number");
  assert.deepEqual(updateArgs[2], {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  assert.equal(result.recommendation.status, "applied");
  assert.equal(result.optimizedReading, null);
  assert.equal(energyDataTouched, false);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0][0], "recommendation:applied");
  assert.equal(emitted[0][1].optimizedReading, null);

  console.log(
    "Focused optimization application test passed: Recommendation state persisted; EnergyData untouched."
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
