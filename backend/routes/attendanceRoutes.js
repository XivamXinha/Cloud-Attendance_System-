const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const AttendanceSession = require("../models/AttendanceSession");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

/* ==================================================
   🔧 HELPER: DISTANCE CALCULATION (Haversine Formula)
================================================== */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = x => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ==================================================
   1️⃣ TEACHER → START ATTENDANCE
   OTP ONLY  OR  OTP + LOCATION
================================================== */
router.post("/start", async (req, res) => {
  try {
    const {
      teacherId,
      locationRequired, // true / false
      latitude,
      longitude,
      allowedRadius
    } = req.body;

    // Close old active sessions
    await AttendanceSession.updateMany(
      { teacherId, isActive: true },
      { isActive: false }
    );

    const session = await AttendanceSession.create({
      teacherId,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      date: new Date(),
      isActive: true,
      locationRequired: !!locationRequired,
      teacherLocation: locationRequired
        ? { latitude, longitude }
        : undefined,
      allowedRadius: allowedRadius || 100
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   2️⃣ STUDENT → CHECK ACTIVE SESSION (FOR UI)
================================================== */
router.get("/active", async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({ isActive: true });

    if (!session) {
      return res.json({ isActive: false });
    }

    res.json({
      isActive: true,
      locationRequired: session.locationRequired,
      allowedRadius: session.allowedRadius
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   3️⃣ STUDENT → MARK ATTENDANCE (OTP + LOCATION)
================================================== */
router.post("/mark", async (req, res) => {
  try {
    const {
      studentId,
      code,
      latitude,
      longitude
    } = req.body;

    const session = await AttendanceSession.findOne({
      code,
      isActive: true
    });

    if (!session) {
      return res.json({ message: "Invalid or expired code" });
    }

    // 🔥 LOCATION CHECK
    if (session.locationRequired) {
      if (!latitude || !longitude) {
        return res.json({ message: "Location required" });
      }

      const dist = getDistanceInMeters(
        session.teacherLocation.latitude,
        session.teacherLocation.longitude,
        latitude,
        longitude
      );

      if (dist > session.allowedRadius) {
        return res.json({ message: "Out of teacher range" });
      }
    }

    // Already marked?
    const alreadyMarked = await Attendance.findOne({
      studentId,
      date: session.date
    });

    if (alreadyMarked) {
      return res.json({ message: "Attendance already marked" });
    }

    await Attendance.create({
      studentId,
      teacherId: session.teacherId,
      date: session.date
    });

    res.json({ message: "Attendance marked successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   4️⃣ TEACHER → CLOSE ATTENDANCE
================================================== */
router.post("/close", async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const allStudents = await User.find({ role: "student" }).select("_id");

    const presentRecords = await Attendance.find({
      teacherId: session.teacherId,
      date: session.date
    });

    const presentStudentIds = presentRecords.map(r =>
      r.studentId.toString()
    );

    const absentStudentIds = allStudents
      .map(s => s._id.toString())
      .filter(id => !presentStudentIds.includes(id));

    session.isActive = false;
    session.presentStudents = presentStudentIds;
    session.absentStudents = absentStudentIds;
    session.totalStudents = allStudents.length;

    await session.save();

    res.json({
      message: "Attendance closed successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   5️⃣ STUDENT → FULL HISTORY (WITH TEACHER NAME)
================================================== */
router.get("/student/history/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const sessions = await AttendanceSession.find({ isActive: false })
      .populate("teacherId", "name")
      .sort({ date: -1 });

    const history = sessions.map(s => ({
      date: s.date,
      status: s.presentStudents.includes(studentId)
        ? "Present"
        : "Absent",
      teacherName: s.teacherId?.name || "Unknown"
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   6️⃣ TEACHER → ATTENDANCE PANEL
================================================== */
router.get("/teacher/sessions/:teacherId", async (req, res) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.params.teacherId);

    const sessions = await AttendanceSession.find({
      teacherId,
      isActive: false
    })
      .populate("teacherId", "name email")
      .populate("presentStudents", "name email")
      .populate("absentStudents", "name email")
      .sort({ date: -1 });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================================================
   7️⃣ TEACHER → DELETE SESSION
================================================== */
router.delete("/teacher/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Attendance.deleteMany({
      teacherId: session.teacherId,
      date: session.date
    });

    await AttendanceSession.findByIdAndDelete(sessionId);

    res.json({ message: "Attendance session deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
