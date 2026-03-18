const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

// =======================
// ENV CONFIG (NO CHANGE)
// =======================
dotenv.config({ path: path.join(__dirname, ".env") });

// =======================
// DB CONNECTION (NO CHANGE)
// =======================
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// AUTH ROUTES (NO CHANGE)
// =======================
app.use("/api/auth", require("./routes/authRoutes"));


// =====================================================
// 🔽🔽🔽 ATTENDANCE ROUTE ADD KIYA YAHAN SE
// =====================================================

// 👉 attendance system ke liye new route
app.use("/api/attendance", require("./routes/attendanceRoutes"));

// =====================================================
// 🔼🔼🔼 ATTENDANCE ROUTE YAHAN TAK
// =====================================================


// =======================
// ROOT TEST ROUTE (NO CHANGE)
// =======================
app.get("/", (req, res) => {
  res.send("Cloud Attendance API Running");
});

// =======================
// SERVER START (NO CHANGE)
// =======================
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
