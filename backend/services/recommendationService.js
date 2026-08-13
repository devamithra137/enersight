// services/recommendationService.js
// Recommendations are derived from peak detection data + cost engine.
// All numbers (savings estimates, percentages) are calculated — nothing is static.

const { getPeakUsage } = require("./aggregationService");
const EnergyData = require("../models/EnergyData");
const Recommendation = require("../models/Recommendation");

const COST_RATE = parseFloat(process.env.COST_RATE) || 8; // ₹ per kWh

// Assumed reduction factors if usage is shifted off-peak
const SHIFT_REDUCTION_FACTOR = 0.30; // 30 % reduction from demand shifting
const EFFICIENCY_REDUCTION_FACTOR = 0.15; // 15 % reduction from efficiency measures

// ── Helper: total units in peak hour over the last N days ─────────────────────

async function peakHourUnitsLastNDays(hourIndex, days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [result] = await EnergyData.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        $expr: {
          $eq: [
            { $hour: { date: "$timestamp", timezone: "Asia/Kolkata" } },
            hourIndex,
          ],
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$units" }, count: { $sum: 1 } } },
  ]);
  return result ? { total: result.total, count: result.count } : { total: 0, count: 0 };
}

// ── Helper: top category in the peak hour ────────────────────────────────────

async function topCategoryInPeakHour(hourIndex, days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [result] = await EnergyData.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        $expr: {
          $eq: [
            { $hour: { date: "$timestamp", timezone: "Asia/Kolkata" } },
            hourIndex,
          ],
        },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$units" } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);
  return result ? result._id : "Unknown";
}

// ── Main recommendation engine ────────────────────────────────────────────────

/**
 * Generates peak-hour-based energy-saving recommendations.
 * Savings estimates are calculated from actual peak-hour consumption data.
 *
 * @returns {Promise<Object>}
 */
async function generateRecommendations() {
  const peak = await getPeakUsage();

  if (!peak.peakHour) {
    return {
      recommendations: [],
      message: "Insufficient data to generate recommendations",
    };
  }

  const { hourIndex } = peak.peakHour;
  const WINDOW_DAYS = 30;

  // Gather peak-hour data over the last 30 days for cost projection
  const [peakHourData, topCategory] = await Promise.all([
    peakHourUnitsLastNDays(hourIndex, WINDOW_DAYS),
    topCategoryInPeakHour(hourIndex, WINDOW_DAYS),
  ]);

  const peakCost = parseFloat((peakHourData.total * COST_RATE).toFixed(2));
  const dailyAvgPeakUnits = parseFloat(
    (peakHourData.total / WINDOW_DAYS).toFixed(3)
  );
  const dailyAvgPeakCost = parseFloat((dailyAvgPeakUnits * COST_RATE).toFixed(2));

  // Savings estimates
  const shiftSavingsMonthly = parseFloat(
    (peakCost * SHIFT_REDUCTION_FACTOR).toFixed(2)
  );
  const efficiencySavingsMonthly = parseFloat(
    (peakCost * EFFICIENCY_REDUCTION_FACTOR).toFixed(2)
  );

  const recommendations = [
    // ── Recommendation 1: Load shifting ─────────────────────────────────────
    {
      id: "shift_peak_load",
      priority: "high",
      title: "Shift high-demand appliances away from peak hours",
      recommendation: `Usage peaks between ${peak.peakHour.start}–${peak.peakHour.end}. Consider scheduling high-draw appliances (e.g., washing machines, dishwashers) to off-peak hours.`,
      reasoning: `This hour contributes ${peak.percentageOfTotal}% of total recorded consumption. Shifting ${(SHIFT_REDUCTION_FACTOR * 100).toFixed(0)}% of peak-hour load could reduce your monthly bill significantly.`,
      estimatedMonthlySavings: {
        units: parseFloat(
          (peakHourData.total * SHIFT_REDUCTION_FACTOR).toFixed(3)
        ),
        cost: shiftSavingsMonthly,
        currency: "INR",
      },
      dataContext: {
        peakHour: `${peak.peakHour.start}–${peak.peakHour.end}`,
        peakUnitsLast30Days: parseFloat(peakHourData.total.toFixed(3)),
        peakCostLast30Days: peakCost,
        avgDailyPeakUnits: dailyAvgPeakUnits,
      },
    },

    // ── Recommendation 2: Category-level efficiency ──────────────────────────
    {
      id: "reduce_top_peak_category",
      priority: "medium",
      title: `Improve efficiency of ${topCategory} during peak hours`,
      recommendation: `${topCategory} is the top consumer during the peak hour. Using energy-efficient alternatives or reducing usage by ${(EFFICIENCY_REDUCTION_FACTOR * 100).toFixed(0)}% during this period can lower costs.`,
      reasoning: `Targeted reduction in the highest-consuming category during the peak window yields measurable savings without impacting overall comfort.`,
      estimatedMonthlySavings: {
        units: parseFloat(
          (peakHourData.total * EFFICIENCY_REDUCTION_FACTOR).toFixed(3)
        ),
        cost: efficiencySavingsMonthly,
        currency: "INR",
      },
      dataContext: {
        topCategoryDuringPeak: topCategory,
        peakHour: `${peak.peakHour.start}–${peak.peakHour.end}`,
        efficiencyReductionAssumed: `${(EFFICIENCY_REDUCTION_FACTOR * 100).toFixed(0)}%`,
      },
    },

    // ── Recommendation 3: Daily budget awareness ────────────────────────────
    {
      id: "daily_peak_budget",
      priority: "low",
      title: "Set a daily peak-hour energy budget",
      recommendation: `Your average peak-hour consumption is ${dailyAvgPeakUnits} kWh/day (≈ ₹${dailyAvgPeakCost}/day). Setting a soft limit and monitoring via EnerSight real-time alerts can prevent overruns.`,
      reasoning: `Awareness of peak-hour micro-budgets helps households reduce cumulative excess. Even a 10% reduction during the peak window could save ₹${parseFloat(
        (peakCost * 0.1).toFixed(2)
      )} monthly.`,
      estimatedMonthlySavings: {
        units: parseFloat((peakHourData.total * 0.1).toFixed(3)),
        cost: parseFloat((peakCost * 0.1).toFixed(2)),
        currency: "INR",
      },
      dataContext: {
        avgDailyPeakUnits: dailyAvgPeakUnits,
        avgDailyPeakCost: dailyAvgPeakCost,
        projectionWindowDays: WINDOW_DAYS,
      },
    },
  ];

  const appliedStates = await Recommendation.find({
    recommendationId: { $in: recommendations.map((rec) => rec.id) },
  }).lean();
  const stateById = new Map(
    appliedStates.map((state) => [state.recommendationId, state])
  );

  return {
    recommendations: recommendations.map((rec) => {
      const state = stateById.get(rec.id);
      return {
        ...rec,
        status: state?.status || "pending",
        appliedAt: state?.appliedAt || null,
        impactReductionPercent: state?.impactReductionPercent || 0,
      };
    }),
    basedOn: {
      peakHour: `${peak.peakHour.start}–${peak.peakHour.end}`,
      peakPercentOfTotal: peak.percentageOfTotal,
      dataWindowDays: WINDOW_DAYS,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateRecommendations };
