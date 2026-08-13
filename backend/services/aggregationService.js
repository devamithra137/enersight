// services/aggregationService.js
// All aggregation logic runs inside MongoDB Atlas — zero in-process number crunching
// for large datasets. We only post-process the already-aggregated cursor rows.

const EnergyData = require("../models/EnergyData");

const COST_RATE = parseFloat(process.env.COST_RATE) || 8; // ₹ per kWh
const CARBON_FACTOR = parseFloat(process.env.CARBON_FACTOR) || 0.82; // kg CO₂ per kWh

// ── Helper: build $dateToString format + group-by expression from range ──────

function buildTimeGrouping(range) {
  switch (range) {
    case "daily":
      // Group every reading into its clock-hour within the last 24 h
      return {
        format: "%Y-%m-%dT%H:00:00",
        dateTruncUnit: "hour",
        lookbackDays: 1,
        label: "hour",
      };
    case "weekly":
      // Group by calendar day within the last 7 days
      return {
        format: "%Y-%m-%d",
        dateTruncUnit: "day",
        lookbackDays: 7,
        label: "day",
      };
    case "monthly":
    default:
      // Group by calendar day within the last 30 days
      return {
        format: "%Y-%m-%d",
        dateTruncUnit: "day",
        lookbackDays: 30,
        label: "day",
      };
  }
}

// ── 1. getTrends ──────────────────────────────────────────────────────────────

/**
 * Returns aggregated energy consumption grouped by hour (daily),
 * day (weekly), or day (monthly) — purely from MongoDB data.
 *
 * @param {"daily"|"weekly"|"monthly"} range
 * @returns {Promise<Array<{period: string, totalUnits: number, readingCount: number}>>}
 */
async function getTrends(range = "daily") {
  const { format, lookbackDays } = buildTimeGrouping(range);
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const pipeline = [
    // Stage 1 – filter to the relevant window
    { $match: { timestamp: { $gte: since } } },

    // Stage 2 – group by formatted time bucket
    {
      $group: {
        _id: {
          $dateToString: { format, date: "$timestamp", timezone: "Asia/Kolkata" },
        },
        totalUnits: { $sum: "$units" },
        readingCount: { $sum: 1 },
      },
    },

    // Stage 3 – rename _id → period and sort chronologically
    {
      $project: {
        _id: 0,
        period: "$_id",
        totalUnits: { $round: ["$totalUnits", 3] },
        readingCount: 1,
      },
    },
    { $sort: { period: 1 } },
  ];

  const results = await EnergyData.aggregate(pipeline);
  return { range, groupedBy: buildTimeGrouping(range).label, data: results };
}

// ── 2. getPeakUsage ───────────────────────────────────────────────────────────

/**
 * Finds the clock-hour with the highest total consumption across all stored data.
 * Returns the peak hour, its total units, and its % share of overall consumption.
 *
 * @returns {Promise<Object>}
 */
async function getPeakUsage() {
  const pipeline = [
    // Group every document by its clock-hour (0-23)
    {
      $group: {
        _id: {
          $hour: { date: "$timestamp", timezone: "Asia/Kolkata" },
        },
        totalUnits: { $sum: "$units" },
        readingCount: { $sum: 1 },
      },
    },

    // Sort descending so the peak is first
    { $sort: { totalUnits: -1 } },

    // Collect the grand total alongside each hour's subtotal
    {
      $group: {
        _id: null,
        hours: {
          $push: {
            hour: "$_id",
            totalUnits: "$totalUnits",
            readingCount: "$readingCount",
          },
        },
        grandTotal: { $sum: "$totalUnits" },
      },
    },

    // Expose the peak (first element after sort) and calculate its percentage
    {
      $project: {
        _id: 0,
        peak: { $arrayElemAt: ["$hours", 0] },
        grandTotal: { $round: ["$grandTotal", 3] },
        allHours: "$hours",
      },
    },
  ];

  const [result] = await EnergyData.aggregate(pipeline);

  if (!result || !result.peak) {
    return { message: "No data available for peak detection" };
  }

  const peakHour = result.peak.hour;
  const percentage = ((result.peak.totalUnits / result.grandTotal) * 100).toFixed(2);

  return {
    peakHour: {
      start: `${String(peakHour).padStart(2, "0")}:00`,
      end: `${String(peakHour + 1).padStart(2, "0")}:00`,
      hourIndex: peakHour,
    },
    peakUnits: parseFloat(result.peak.totalUnits.toFixed(3)),
    percentageOfTotal: parseFloat(percentage),
    grandTotalUnits: result.grandTotal,
    allHourlyBreakdown: result.allHours.map((h) => ({
      hour: `${String(h.hour).padStart(2, "0")}:00`,
      totalUnits: parseFloat(h.totalUnits.toFixed(3)),
      percentage: parseFloat(((h.totalUnits / result.grandTotal) * 100).toFixed(2)),
    })),
  };
}

// ── 3. getCategoryBreakdown ───────────────────────────────────────────────────

/**
 * Groups total kWh consumed by category and returns absolute + percentage values.
 *
 * @returns {Promise<Array>}
 */
async function getCategoryBreakdown() {
  const pipeline = [
    {
      $group: {
        _id: "$category",
        totalUnits: { $sum: "$units" },
        readingCount: { $sum: 1 },
        avgUnits: { $avg: "$units" },
      },
    },
    {
      $group: {
        _id: null,
        categories: {
          $push: {
            category: "$_id",
            totalUnits: "$totalUnits",
            readingCount: "$readingCount",
            avgUnits: "$avgUnits",
          },
        },
        grandTotal: { $sum: "$totalUnits" },
      },
    },
    {
      $project: {
        _id: 0,
        grandTotal: { $round: ["$grandTotal", 3] },
        categories: 1,
      },
    },
  ];

  const [result] = await EnergyData.aggregate(pipeline);

  if (!result) return { grandTotal: 0, categories: [] };

  const categories = result.categories
    .map((cat) => ({
      category: cat.category,
      totalUnits: parseFloat(cat.totalUnits.toFixed(3)),
      averageUnitsPerReading: parseFloat(cat.avgUnits.toFixed(3)),
      readingCount: cat.readingCount,
      percentageShare: parseFloat(
        ((cat.totalUnits / result.grandTotal) * 100).toFixed(2)
      ),
    }))
    .sort((a, b) => b.totalUnits - a.totalUnits); // highest consumer first

  return { grandTotal: result.grandTotal, categories };
}

// ── 4. getImpact ─────────────────────────────────────────────────────────────

/**
 * Calculates cost (₹) and carbon footprint (kg CO₂) per day and in total.
 *
 * @returns {Promise<Object>}
 */
async function getImpact() {
  const pipeline = [
    // Group by calendar date (IST)
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamp",
            timezone: "Asia/Kolkata",
          },
        },
        dailyUnits: { $sum: "$units" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const dailyRows = await EnergyData.aggregate(pipeline);

  let grandTotalUnits = 0;

  const perDayBreakdown = dailyRows.map((row) => {
    const units = parseFloat(row.dailyUnits.toFixed(3));
    grandTotalUnits += units;

    return {
      date: row._id,
      units,
      cost: parseFloat((units * COST_RATE).toFixed(2)),
      carbonKg: parseFloat((units * CARBON_FACTOR).toFixed(3)),
    };
  });

  return {
    summary: {
      totalUnits: parseFloat(grandTotalUnits.toFixed(3)),
      totalCost: parseFloat((grandTotalUnits * COST_RATE).toFixed(2)),
      totalCarbonKg: parseFloat((grandTotalUnits * CARBON_FACTOR).toFixed(3)),
      costRate: COST_RATE,
      carbonFactor: CARBON_FACTOR,
    },
    perDayBreakdown,
  };
}

module.exports = { getTrends, getPeakUsage, getCategoryBreakdown, getImpact };
