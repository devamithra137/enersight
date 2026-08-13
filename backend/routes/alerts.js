const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/alertController");

router.get("/", ctrl.getAlerts);
router.patch("/:id/resolve", ctrl.resolveAlert);

module.exports = router;
