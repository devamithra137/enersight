// services/anomalyService.js
// Statistical anomaly detection — thresholds are computed from the data itself,
// never hardcoded. Two detection modes:
//   1. Spike:    reading > mean + (N × stddev)
//   2. Sustained: K consecutive spike-level readings in a row

const EnergyData = require("../models/EnergyData");
const Alert = require("../models/Alert");

// How many standard deviations above the mean constitutes a spike (env-configurable)
const STD_MULTIPLIER = parseFloat(process.env.ANOMALY_STD_MULTIPLIER) || 2;

// How many consecutive anomalous readings trigger a "continuous high usage" alert
const CONSECUTIVE_THRESHOLD =
  parseInt(process.env.ANOMALY_CONSECUTIVE_THRESHOLD, 10) || 3;

// ── Compute population statistics from MongoDB ────────────────────────────────

/**
 * Uses MongoDB $group to calculate mean and standard deviation of all `units`
 * values in one round-trip. This avoids pulling every document into Node.
 *
 * @returns {Promise<{mean: number, stddev: number, count: number}>}
 */
async function computeStats() {
  const [stats] = await EnergyData.aggregate([
    {
      $group: {
        _id: null,
        mean: { $avg: "$units" },
        // MongoDB $stdDevPop covers the full dataset; use $stdDevSamp for a sample
        stddev: { $stdDevPop: "$units" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (!stats) return { mean: 0, stddev: 0, count: 0 };
  return {
    mean: parseFloat(stats.mean.toFixed(4)),
    stddev: parseFloat(stats.stddev.toFixed(4)),
    count: stats.count,
  };
}

// ── Main anomaly detection ────────────────────────────────────────────────────

/**
 * Detects:
 *  - Individual spikes (units > mean + STD_MULTIPLIER × stddev)
 *  - Sustained high usage (CONSECUTIVE_THRESHOLD or more consecutive spikes)
 *
 * @returns {Promise<Object>} alerts array + statistical context
 */
function alertIdForSpike(reading) {
  return `spike:${reading._id.toString()}`;
}

function alertIdForSustained(start, end) {
  return `sustained:${new Date(start).getTime()}:${new Date(end).getTime()}`;
}

async function mergePersistedAlertState(alerts) {
  if (alerts.length === 0) return alerts;

  const alertIds = alerts.map((alert) => alert.id);
  const existing = await Alert.find({ alertId: { $in: alertIds } }).lean();
  const existingById = new Map(existing.map((alert) => [alert.alertId, alert]));

  await Promise.all(
    alerts.map((alert) => {
      const existingAlert = existingById.get(alert.id);
      if (existingAlert) return null;

      return Alert.create({
        alertId: alert.id,
        sourceType: alert.sourceType,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        status: "active",
        timestamp: alert.timestamp,
        readingId: alert.reading?._id || null,
        category: alert.category || alert.reading?.category || null,
        value: alert.value || alert.reading?.units || null,
        threshold: alert.threshold || null,
        metadata: alert.metadata || {},
      }).catch((err) => {
        if (err.code !== 11000) throw err;
      });
    })
  );

  const refreshed = await Alert.find({ alertId: { $in: alertIds } }).lean();
  const refreshedById = new Map(refreshed.map((alert) => [alert.alertId, alert]));

  return alerts.map((alert) => {
    const persisted = refreshedById.get(alert.id);
    return {
      ...alert,
      status: persisted?.status || "active",
      resolved: persisted?.status === "resolved",
      resolvedAt: persisted?.resolvedAt || null,
    };
  });
}

async function detectAnomalies() {
  const { mean, stddev, count } = await computeStats();

  if (count < 5) {
    // Not enough data for meaningful statistics
    return {
      alerts: [],
      stats: { mean, stddev, count },
      message: "Insufficient data for anomaly detection (minimum 5 readings required)",
    };
  }

  const threshold = mean + STD_MULTIPLIER * stddev;

  // Fetch all readings in chronological order (lean = raw JS objects, faster)
  const readings = await EnergyData.find({})
    .sort({ timestamp: 1 })
    .select("timestamp units category deviceId")
    .lean();

  const alerts = [];
  let consecutiveCount = 0;
  let streakStart = null;

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    const isAnomaly = reading.units > threshold;

    if (isAnomaly) {
      // ── Spike alert (individual) ──────────────────────────────────────────
      alerts.push({
        id: alertIdForSpike(reading),
        sourceType: "spike",
        type: "spike",
        title: "Unusual spike detected",
        severity: reading.units > mean + 3 * stddev ? "critical" : "warning",
        message: `Unusual spike detected: ${reading.units.toFixed(3)} kWh recorded (threshold: ${threshold.toFixed(3)} kWh)`,
        timestamp: reading.timestamp,
        value: parseFloat(reading.units.toFixed(3)),
        threshold: parseFloat(threshold.toFixed(3)),
        category: reading.category,
        reading: {
          id: reading._id,
          _id: reading._id,
          timestamp: reading.timestamp,
          units: reading.units,
          category: reading.category,
          deviceId: reading.deviceId,
        },
        deviationsAboveMean: parseFloat(
          ((reading.units - mean) / stddev).toFixed(2)
        ),
      });

      // ── Track consecutive anomalies ───────────────────────────────────────
      if (consecutiveCount === 0) streakStart = reading.timestamp;
      consecutiveCount++;

      // ── Sustained alert once the streak crosses the threshold ─────────────
      if (consecutiveCount === CONSECUTIVE_THRESHOLD) {
        const streakEndedAt = reading.timestamp;
        alerts.push({
          id: alertIdForSustained(streakStart, streakEndedAt),
          sourceType: "sustained",
          type: "sustained",
          title: "Continuous high usage detected",
          severity: "critical",
          message: `Continuous high usage detected: ${consecutiveCount} consecutive readings above threshold`,
          streakStartedAt: streakStart,
          streakEndedAt,
          timestamp: streakEndedAt,
          streakLength: consecutiveCount,
          averageUnitsInStreak: parseFloat(
            (
              readings
                .slice(i - CONSECUTIVE_THRESHOLD + 1, i + 1)
                .reduce((s, r) => s + r.units, 0) / CONSECUTIVE_THRESHOLD
            ).toFixed(3)
          ),
        });
      }
    } else {
      // Reset streak on a normal reading
      consecutiveCount = 0;
      streakStart = null;
    }
  }

  const alertsWithState = await mergePersistedAlertState(
    alerts.map((alert) => ({
      ...alert,
      type: alert.severity === "critical" ? "critical" : "warning",
      sourceType: alert.sourceType,
      metadata: {
        anomalyType: alert.sourceType,
        deviationsAboveMean: alert.deviationsAboveMean,
        streakStartedAt: alert.streakStartedAt,
        streakEndedAt: alert.streakEndedAt,
        streakLength: alert.streakLength,
      },
    }))
  );

  return {
    alerts: alertsWithState,
    totalAnomalies: alerts.filter((a) => a.type === "spike").length,
    sustainedEvents: alerts.filter((a) => a.type === "sustained").length,
    stats: {
      mean,
      stddev,
      threshold: parseFloat(threshold.toFixed(4)),
      stdMultiplierUsed: STD_MULTIPLIER,
      consecutiveThreshold: CONSECUTIVE_THRESHOLD,
      totalReadingsAnalysed: count,
    },
  };
}

/**
 * Quick anomaly check for a single new reading — used by Socket.IO on ingest.
 *
 * @param {number} units  - the newly ingested kWh value
 * @returns {Promise<{isAnomaly: boolean, threshold: number, mean: number, stddev: number}>}
 */
async function checkSingleReading(units) {
  const { mean, stddev, count } = await computeStats();
  if (count < 5) return { isAnomaly: false, reason: "insufficient_data" };

  const threshold = mean + STD_MULTIPLIER * stddev;
  return {
    isAnomaly: units > threshold,
    units,
    threshold: parseFloat(threshold.toFixed(4)),
    mean,
    stddev,
    deviationsAboveMean:
      stddev > 0 ? parseFloat(((units - mean) / stddev).toFixed(2)) : 0,
  };
}

module.exports = { detectAnomalies, checkSingleReading, computeStats };
