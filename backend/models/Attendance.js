const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  teacherId: mongoose.Schema.Types.ObjectId,
  date: String,
  status: { type: String, default: "Present" }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
