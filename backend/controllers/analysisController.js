const analysisService = require("../services/analysisService");

async function createAnalysis(req, res) {
  try {
    const data = await analysisService.createAnalysis(req.body);

    const io = req.app.get("io");
    if (io) {
      io.emit("analysis:update", {
        event: "analysis:update",
        data,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("[createAnalysis]", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
}

async function getLatestAnalysis(_req, res) {
  try {
    const data = await analysisService.getLatestAnalysis();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getLatestAnalysis]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

module.exports = { createAnalysis, getLatestAnalysis };
