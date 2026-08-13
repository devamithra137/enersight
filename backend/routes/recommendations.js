const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/recommendationController");

router.get("/", ctrl.getRecommendations);
router.post("/apply", ctrl.applyRecommendation);

module.exports = router;
