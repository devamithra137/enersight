// services/insightService.js
// Every insight is computed from live MongoDB data.
// No static messages — all values (percentages, labels, etc.) are derived.

const EnergyData = require("../models/EnergyData");

// ── Helper: sum units in a time window ──────────────────────────────────────

async function sumUnitsInWindow(from, to) {
  const [result] = await EnergyData.aggregate([
    { $match: { timestamp: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: "$units" }, count: { $sum: 1 } } },
  ]);
  return result ? { total: result.total, count: result.count } : { total: 0, count: 0 };
}

// ── Helper: top category in a time window ────────────────────────────────────

async function topCategoryInWindow(from, to) {
  const [result] = await EnergyData.aggregate([
    { $match: { timestamp: { $gte: from, $lt: to } } },
    { $group: { _id: "$category", total: { $sum: "$units" } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);
  return result ? { category: result._id, units: result.total } : null;
}

// ── Helper: total units in the peak hour within a window ─────────────────────

async function peakHourUnitsInWindow(from, to, peakHourIndex) {
  const [result] = await EnergyData.aggregate([
    {
      $match: {
        timestamp: { $gte: from, $lt: to },
        $expr: {
          $eq: [
            { $hour: { date: "$timestamp", timezone: "Asia/Kolkata" } },
            peakHourIndex,
          ],
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$units" } } },
  ]);
  return result ? result.total : 0;
}

// ── Main insight generator ─────────────────────────────────────────────────────

/**
 * Generates structured, data-driven insights for the current week vs the previous.
 * Each insight has: { type, value, message, metadata }
 *
 * @returns {Promise<{insights: Array, generatedAt: string}>}
 */
async function generateInsights() {
  const now = new Date();

  // Window boundaries
  const currentWeekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const previousWeekStart = new Date(now - 14 * 24 * 60 * 60 * 1000);

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [currentWeek, previousWeek, topCat] = await Promise.all([
    sumUnitsInWindow(currentWeekStart, now),
    sumUnitsInWindow(previousWeekStart, currentWeekStart),
    topCategoryInWindow(currentWeekStart, now),
  ]);

  const insights = [];

  // ── 1. Week-over-week change ───────────────────────────────────────────────
  if (previousWeek.total > 0) {
    const changePercent = parseFloat(
      (((currentWeek.total - previousWeek.total) / previousWeek.total) * 100).toFixed(1)
    );
    const direction = changePercent >= 0 ? "increase" : "decrease";
    const absChange = Math.abs(changePercent);

    insights.push({
      type: direction,
      value: absChange,
      unit: "%",
      message: `Energy usage ${direction}d by ${absChange}% compared to the previous week`,
      metadata: {
        currentWeekUnits: parseFloat(currentWeek.total.toFixed(3)),
        previousWeekUnits: parseFloat(previousWeek.total.toFixed(3)),
        currentWeekReadings: currentWeek.count,
      },
    });
  } else if (currentWeek.total > 0) {
    insights.push({
      type: "new_data",
      value: parseFloat(currentWeek.total.toFixed(3)),
      unit: "kWh",
      message: `First week of data recorded: ${currentWeek.total.toFixed(3)} kWh total`,
      metadata: { readingCount: currentWeek.count },
    });
  }

  // ── 2. Highest consuming category ─────────────────────────────────────────
  if (topCat) {
    const sharePercent =
      currentWeek.total > 0
        ? parseFloat(((topCat.units / currentWeek.total) * 100).toFixed(1))
        : 0;

    insights.push({
      type: "top_category",
      value: sharePercent,
      unit: "%",
      message: `${topCat.category} is the highest consuming category, accounting for ${sharePercent}% of this week's usage`,
      metadata: {
        category: topCat.category,
        units: parseFloat(topCat.units.toFixed(3)),
        weeklyShare: sharePercent,
      },
    });
  }

  // ── 3. Peak-hour contribution ──────────────────────────────────────────────
  // Determine peak hour from this week's data
  const [peakRow] = await EnergyData.aggregate([
    { $match: { timestamp: { $gte: currentWeekStart } } },
    {
      $group: {
        _id: { $hour: { date: "$timestamp", timezone: "Asia/Kolkata" } },
        total: { $sum: "$units" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  if (peakRow && currentWeek.total > 0) {
    const peakShare = parseFloat(
      ((peakRow.total / currentWeek.total) * 100).toFixed(1)
    );
    const peakHour = peakRow._id;

    insights.push({
      type: "peak_contribution",
      value: peakShare,
      unit: "%",
      message: `Peak hour (${String(peakHour).padStart(2, "0")}:00–${String(
        peakHour + 1
      ).padStart(2, "0")}:00) contributes ${peakShare}% of weekly energy usage`,
      metadata: {
        peakHour,
        peakUnits: parseFloat(peakRow.total.toFixed(3)),
        weeklyShare: peakShare,
      },
    });
  }

  // ── 4. Average daily usage this week ──────────────────────────────────────
  if (currentWeek.count > 0) {
    // Get distinct day count this week
    const [dayResult] = await EnergyData.aggregate([
      { $match: { timestamp: { $gte: currentWeekStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: "Asia/Kolkata",
            },
          },
          dailyTotal: { $sum: "$units" },
        },
      },
      {
        $group: {
          _id: null,
          avgDailyUnits: { $avg: "$dailyTotal" },
          daysWithData: { $sum: 1 },
        },
      },
    ]);

    if (dayResult) {
      const avg = parseFloat(dayResult.avgDailyUnits.toFixed(3));
      insights.push({
        type: "average_daily",
        value: avg,
        unit: "kWh",
        message: `Average daily energy consumption this week is ${avg} kWh across ${dayResult.daysWithData} day(s)`,
        metadata: {
          avgDailyUnits: avg,
          daysWithData: dayResult.daysWithData,
        },
      });
    }
  }

  return {
    insights,
    generatedAt: now.toISOString(),
    windowInfo: {
      currentWeek: { from: currentWeekStart.toISOString(), to: now.toISOString() },
      previousWeek: {
        from: previousWeekStart.toISOString(),
        to: currentWeekStart.toISOString(),
      },
    },
  };
}

module.exports = { generateInsights };
