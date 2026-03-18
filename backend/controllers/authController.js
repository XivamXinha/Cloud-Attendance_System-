const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");

/* =========================
   SIGNUP CONTROLLER
========================= */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, roll, contact, branch, empId } = req.body;

    // 🔹 User check
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 🔹 User create
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpire: Date.now() + 10 * 60 * 1000 // 10 min
    });

    // 🔹 Extra fields based on role
    if (role === "student") {
      newUser.roll = roll;
      newUser.contact = contact;
      newUser.branch = branch;
    } else if (role === "teacher") {
      newUser.empId = empId;
    }

    await newUser.save();

    // 🔹 OTP Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is: ${otp}</h2>`
    });

    res.json({ message: "Signup successful, OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   VERIFY OTP CONTROLLER
========================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LOGIN CONTROLLER
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "User not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ALL STUDENTS (Teacher Only)
========================= */
exports.getStudents = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const students = await User.find(
      { role: "student" },
      { name: 1, email: 1, roll: 1, contact: 1, branch: 1, _id: 0 }
    );

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
