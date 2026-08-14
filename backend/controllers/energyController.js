// controllers/energyController.js
// Thin HTTP controllers: validate input, call the appropriate service, send response.
// All business logic lives in /services — controllers only handle HTTP concerns.

const EnergyData = require("../models/EnergyData");
const aggregationService = require("../services/aggregationService");
const anomalyService = require("../services/anomalyService");
const insightService = require("../services/insightService");
const recommendationService = require("../services/recommendationService");
const { applyOptimizationToUnits } = require("../services/optimizationService");
const { emitEnergyUpdate } = require("../sockets/socketHandler");

const VALID_CATEGORIES = ["AC", "Lighting", "Appliances", "HVAC", "Computers", "Other"];

// ── POST /api/energy ──────────────────────────────────────────────────────────

/**
 * Ingest a single energy reading.
 * After saving, emits Socket.IO events: "energy:update" and optionally "energy:alert".
 */
async function ingestEnergy(req, res) {
  try {
    const { timestamp, units, category, deviceId } = req.body;

    const parsedUnits = typeof units === "number" ? units : Number.NaN;
    if (!Number.isFinite(parsedUnits) || parsedUnits <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "units must be a finite positive number" });
    }

    let parsedTimestamp = new Date();
    if (timestamp !== undefined && timestamp !== null) {
      parsedTimestamp = new Date(timestamp);
      if (Number.isNaN(parsedTimestamp.getTime())) {
        return res.status(400).json({ success: false, error: "timestamp must be a valid date" });
      }
    }

    const normalizedCategory = typeof category === "string" ? category.trim() : "";
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        error: "category must be one of AC, Lighting, Appliances, HVAC, Computers, Other",
      });
    }

    let normalizedDeviceId = null;
    if (deviceId !== undefined && deviceId !== null) {
      if (typeof deviceId !== "string" || !deviceId.trim()) {
        return res.status(400).json({
          success: false,
          error: "deviceId must be a non-empty string when provided",
        });
      }
      normalizedDeviceId = deviceId.trim();
    }

    const entry = await EnergyData.create({
      timestamp: parsedTimestamp,
      units: applyOptimizationToUnits(parsedUnits),
      category: normalizedCategory,
      deviceId: normalizedDeviceId,
    });

    // Emit the new data point to all connected WebSocket clients
    const io = req.app.get("io");
    if (io) {
      emitEnergyUpdate(io, entry);

      // Asynchronously check if this reading is anomalous and alert if so
      anomalyService
        .checkSingleReading(entry.units)
        .then((check) => {
          if (check.isAnomaly) {
            io.emit("energy:alert", {
              event: "energy:alert",
              type: "spike",
              severity:
                check.deviationsAboveMean > 3 ? "critical" : "warning",
              message: `Spike detected: ${entry.units} kWh (threshold: ${check.threshold} kWh)`,
              reading: entry,
              stats: {
                mean: check.mean,
                stddev: check.stddev,
                threshold: check.threshold,
                deviationsAboveMean: check.deviationsAboveMean,
              },
              timestamp: new Date().toISOString(),
            });
          }
        })
        .catch((err) =>
          console.error("[anomaly check on ingest]", err.message)
        );
    }

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error("[ingestEnergy]", err);
    // Handle Mongoose validation errors with a readable message
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/trends ────────────────────────────────────────────────────

async function getTrends(req, res) {
  try {
    const range = req.query.range || "daily";
    if (!["daily", "weekly", "monthly"].includes(range)) {
      return res
        .status(400)
        .json({ success: false, error: "range must be daily | weekly | monthly" });
    }
    const data = await aggregationService.getTrends(range);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getTrends]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/peak ──────────────────────────────────────────────────────

async function getPeak(req, res) {
  try {
    const data = await aggregationService.getPeakUsage();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getPeak]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/category ──────────────────────────────────────────────────

async function getCategory(req, res) {
  try {
    const data = await aggregationService.getCategoryBreakdown();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getCategory]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/impact ────────────────────────────────────────────────────

async function getImpact(req, res) {
  try {
    const data = await aggregationService.getImpact();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getImpact]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/alerts ────────────────────────────────────────────────────

async function getAlerts(req, res) {
  try {
    const data = await anomalyService.detectAnomalies();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getAlerts]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/insights ──────────────────────────────────────────────────

async function getInsights(req, res) {
  try {
    const data = await insightService.generateInsights();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getInsights]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ── GET /api/energy/recommendations ──────────────────────────────────────────

async function getRecommendations(req, res) {
  try {
    const data = await recommendationService.generateRecommendations();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getRecommendations]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

module.exports = {
  ingestEnergy,
  getTrends,
  getPeak,
  getCategory,
  getImpact,
  getAlerts,
  getInsights,
  getRecommendations,
};
