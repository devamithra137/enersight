const EnergyData = require("../models/EnergyData");
const anomalyService = require("../services/anomalyService");
const { emitEnergyUpdate, emitEnergyAlert } = require("../sockets/socketHandler");
const { applyOptimizationToUnits } = require("../services/optimizationService");

const CATEGORIES = ["AC", "Lighting", "Appliances", "HVAC", "Computers", "Other"];
const DEVICE_IDS = ["dev-001", "dev-002", "dev-003", "dev-004"];
const LIVE_WINDOW_SIZE = 20;
const SIMULATOR_INTERVAL_MS = 60000;

const BASE_UNITS = {
  AC: 0.8,
  HVAC: 0.6,
  Appliances: 0.4,
  Computers: 0.2,
  Lighting: 0.1,
  Other: 0.15,
};

let simulatorTimer = null;
let liveData = [];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUnits(category) {
  const base = BASE_UNITS[category] || 0.15;
  let value = base + (Math.random() - 0.5) * base * 0.4;

  if (Math.random() < 0.1) {
    value += randomBetween(base * 0.3, base * 1.2);
  }

  return parseFloat(Math.max(0.05, value).toFixed(4));
}

function pushLiveReading(entry) {
  liveData.push(entry);

  if (liveData.length > LIVE_WINDOW_SIZE) {
    liveData.shift();
  }
}

function generateEnergyReading() {
  const category = randomChoice(CATEGORIES);

  return {
    timestamp: new Date(),
    units: applyOptimizationToUnits(generateUnits(category)),
    category,
    deviceId: randomChoice(DEVICE_IDS),
  };
}

async function tick(io) {
  try {
    const reading = generateEnergyReading();
    const entry = await EnergyData.create(reading);
    const serializedEntry = entry.toObject();

    pushLiveReading(serializedEntry);

    emitEnergyUpdate(io, serializedEntry, {
      simulator: true,
      liveData,
    });

    console.log("[simulator] Emitting energy update (1 min interval)");
    console.log(
      `[simulator] emitted energy:update (${liveData.length} points) -> ${serializedEntry.units} kWh`
    );

    const check = await anomalyService.checkSingleReading(serializedEntry.units);
    if (check.isAnomaly) {
      emitEnergyAlert(io, {
        type: "spike",
        severity: check.deviationsAboveMean > 3 ? "critical" : "warning",
        message: `[Simulator] Spike: ${serializedEntry.units} kWh for ${serializedEntry.category} (threshold: ${check.threshold} kWh)`,
        reading: serializedEntry,
        stats: {
          mean: check.mean,
          stddev: check.stddev,
          threshold: check.threshold,
          deviationsAboveMean: check.deviationsAboveMean,
        },
      });
    }
  } catch (err) {
    console.error("[simulator] tick error:", err.message);
  }
}

function startSimulator(io) {
  if (process.env.ENABLE_SIMULATOR === "false") {
    console.log("[simulator] disabled via ENABLE_SIMULATOR=false");
    return;
  }

  if (simulatorTimer) {
    console.log("[simulator] already running");
    return;
  }

  console.log("[simulator] started - generating readings every 60 s");
  simulatorTimer = setInterval(() => {
    tick(io);
  }, SIMULATOR_INTERVAL_MS);
}

function stopSimulator() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
    console.log("[simulator] stopped");
  }
}

module.exports = { startSimulator, stopSimulator };
