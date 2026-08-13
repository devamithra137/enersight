const Alert = require("../models/Alert");
const anomalyService = require("../services/anomalyService");

async function resolveAlert(req, res) {
  try {
    const alertId = req.params.id;
    const resolvedAt = new Date();

    const alert = await Alert.findOneAndUpdate(
      { alertId },
      { $set: { status: "resolved", resolvedAt } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: "Alert not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("alert:resolved", {
        event: "alert:resolved",
        alertId,
        status: alert.status,
        resolvedAt,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ success: true, data: alert });
  } catch (err) {
    console.error("[resolveAlert]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

async function getAlerts(_req, res) {
  try {
    const data = await anomalyService.detectAnomalies();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getAlerts]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

module.exports = { resolveAlert, getAlerts };
