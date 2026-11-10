
const express = require("express");
const router = express.Router();

const authenticateUser = require("../middleware/authMiddleware");
const { getReports } = require("../controllers/reportController");

router.get("/", authenticateUser, getReports);

module.exports = router;
