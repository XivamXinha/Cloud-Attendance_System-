const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema({
  // ===============================
  // BASIC SESSION INFO
  // ===============================
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  code: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    required: true,
    default: Date.now
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // ===============================
  // ATTENDANCE DATA
  // ===============================
  presentStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  absentStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  totalStudents: {
    type: Number,
    default: 0
  },

  // ===============================
  // 🔥 GEO-LOCATION FEATURE
  // ===============================

  // Teacher chooses: OTP only OR OTP + Location
  locationRequired: {
    type: Boolean,
    default: false
  },

  // Teacher's location when attendance started
  teacherLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },

  // Allowed radius in meters (example: 50m, 100m)
  allowedRadius: {
    type: Number,
    default: 100 // meters
  }

}, {
  timestamps: true // createdAt & updatedAt auto
});

module.exports = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);
