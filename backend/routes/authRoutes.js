const express = require("express");
const router = express.Router();

const {
  signup,
  verifyOtp,
  login,
  getStudents
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// =========================
// AUTH ROUTES
// =========================
router.post("/signup", signup);
router.post("/verify", verifyOtp);
router.post("/login", login);

// =========================
// TEACHER ONLY → GET STUDENTS
// =========================
router.get("/students", authMiddleware, getStudents);

module.exports = router;
