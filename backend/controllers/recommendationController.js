const recommendationService = require("../services/recommendationService");
const optimizationService = require("../services/optimizationService");

async function applyRecommendation(req, res) {
  try {
    const { recommendationId } = req.body;

    if (!recommendationId || typeof recommendationId !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "recommendationId is required" });
    }

    const io = req.app.get("io");
    const result = await optimizationService.applyRecommendation(recommendationId, io);

    return res.json({
      success: true,
      data: {
        recommendationId,
        status: result.recommendation.status,
        appliedAt: result.recommendation.appliedAt,
        impactReductionPercent: result.impactReductionPercent,
        optimizedReading: result.optimizedReading,
      },
      message: `Energy reduced by ~${result.impactReductionPercent}%`,
    });
  } catch (err) {
    console.error("[applyRecommendation]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

async function getRecommendations(_req, res) {
  try {
    const data = await recommendationService.generateRecommendations();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getRecommendations]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

module.exports = { applyRecommendation, getRecommendations };
