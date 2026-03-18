const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  roll: String,
  contact: String,
  branch: String,
  empId: String,

  role: { type: String, enum: ["teacher", "student"] },

  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpire: Date
});

module.exports = mongoose.model("User", userSchema);
