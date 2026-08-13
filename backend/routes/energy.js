// routes/energy.js
// Express router — maps HTTP verbs + paths to controllers.
// All validation / auth middleware would be added here.

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/energyController");

// Basic API route
router.get("/", async (req, res) => {
  const EnergyData = require("../models/EnergyData");
  const data = await EnergyData.find().sort({ timestamp: -1 }).limit(50);
  res.json({ success: true, data });
});

// ── Ingestion ─────────────────────────────────────────────────────────────────
router.post("/", ctrl.ingestEnergy);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/trends", ctrl.getTrends);          // ?range=daily|weekly|monthly
router.get("/peak", ctrl.getPeak);
router.get("/category", ctrl.getCategory);
router.get("/impact", ctrl.getImpact);

// ── Intelligence ──────────────────────────────────────────────────────────────
router.get("/alerts", ctrl.getAlerts);
router.get("/insights", ctrl.getInsights);
router.get("/recommendations", ctrl.getRecommendations);

module.exports = router;
