const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/analysisController");

router.post("/", ctrl.createAnalysis);
router.get("/latest", ctrl.getLatestAnalysis);

module.exports = router;
