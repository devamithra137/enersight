const Analysis = require("../models/Analysis");

const DEFAULT_RATE = parseFloat(process.env.RATE || process.env.COST_RATE) || 8;
const DEFAULT_EMISSION_FACTOR =
  parseFloat(process.env.EMISSION_FACTOR || process.env.CARBON_FACTOR) || 0.82;

const CATEGORY_SPLIT = [
  { category: "AC", percentage: 40 },
  { category: "Appliances", percentage: 25 },
  { category: "Lighting", percentage: 15 },
  { category: "Other", percentage: 20 },
];

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function validateInput(input) {
  const currentUnits = Number(input.currentUnits);
  const previousUnits = Number(input.previousUnits);
  const familyMembers = Number(input.familyMembers);
  const houseType = String(input.houseType || "").trim();

  if (!Number.isFinite(currentUnits) || currentUnits < 0) {
    throw new Error("currentUnits must be a non-negative number");
  }
  if (!Number.isFinite(previousUnits) || previousUnits < 0) {
    throw new Error("previousUnits must be a non-negative number");
  }
  if (!Number.isFinite(familyMembers) || familyMembers < 1) {
    throw new Error("familyMembers must be at least 1");
  }
  if (!["1BHK", "2BHK", "3BHK", "Villa"].includes(houseType)) {
    throw new Error("houseType must be one of 1BHK, 2BHK, 3BHK, Villa");
  }

  return {
    currentUnits,
    previousUnits,
    familyMembers,
    houseType,
  };
}

function scoreEfficiency(perPersonUsage) {
  if (perPersonUsage < 80) {
    const score = 90 + Math.min(10, (80 - perPersonUsage) / 8);
    return { score: round(Math.min(100, score), 0), level: "efficient" };
  }

  if (perPersonUsage <= 150) {
    const score = 85 - ((perPersonUsage - 80) / 70) * 15;
    return { score: round(Math.max(70, score), 0), level: "moderate" };
  }

  const score = 70 - Math.min(20, (perPersonUsage - 150) / 7.5);
  return { score: round(Math.max(50, score), 0), level: "high" };
}

function recommendationsFor(level) {
  if (level === "high") {
    return [
      "Reduce AC usage during peak hours",
      "Switch to LED lighting",
      "Avoid standby power",
    ];
  }

  if (level === "moderate") {
    return ["Optimize appliance timing", "Use natural ventilation"];
  }

  return ["Maintain current usage patterns"];
}

function calculateAnalysis(input) {
  const values = validateInput(input);
  const rate = DEFAULT_RATE;
  const emissionFactor = DEFAULT_EMISSION_FACTOR;
  const perPersonUsage = values.currentUnits / values.familyMembers;
  const { score, level } = scoreEfficiency(perPersonUsage);
  const estimatedBill = values.currentUnits * rate;
  const changePercent =
    values.previousUnits > 0
      ? ((values.currentUnits - values.previousUnits) / values.previousUnits) * 100
      : values.currentUnits > 0
        ? 100
        : 0;
  const savingsPercent =
    level === "high" ? 20 : level === "moderate" ? 10 : 0;
  const suggestedSavings = estimatedBill * (savingsPercent / 100);
  const categoryBreakdown = CATEGORY_SPLIT.map((item) => ({
    ...item,
    units: round(values.currentUnits * (item.percentage / 100), 2),
  }));

  return {
    ...values,
    estimatedBill: round(estimatedBill, 2),
    changePercent: round(changePercent, 1),
    efficiencyScore: score,
    efficiencyLevel: level,
    carbonFootprint: round(values.currentUnits * emissionFactor, 2),
    suggestedSavings: round(suggestedSavings, 2),
    savingsPercent,
    perPersonUsage: round(perPersonUsage, 2),
    recommendations: recommendationsFor(level),
    categoryBreakdown,
    assumptions: {
      rate,
      emissionFactor,
      categorySplit: CATEGORY_SPLIT,
    },
  };
}

async function createAnalysis(input) {
  const analysis = calculateAnalysis(input);
  const saved = await Analysis.create(analysis);
  return {
    ...saved.toObject(),
    assumptions: analysis.assumptions,
  };
}

async function getLatestAnalysis() {
  return Analysis.findOne().sort({ createdAt: -1 }).lean();
}

module.exports = {
  createAnalysis,
  getLatestAnalysis,
  calculateAnalysis,
};
