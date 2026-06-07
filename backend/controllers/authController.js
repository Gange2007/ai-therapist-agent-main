const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "default-secret-key-change-in-production",
    { expiresIn: "30d" }
  );
};

/* =========================
   REGISTER
========================= */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    token: generateToken(user._id),
  });
});

/* =========================
   LOGIN
========================= */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("[LOGIN] Login request received for email:", email);
  console.log("[LOGIN] Request body keys:", Object.keys(req.body));

  const user = await User.findOne({ email }).select("+password");

  console.log("[LOGIN] User lookup result:", user ? "User found" : "User not found");

  if (!user) {
    console.log("[LOGIN] Authentication failed: User not found");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log("[LOGIN] User ID:", user._id);
  console.log("[LOGIN] Comparing password...");

  const isMatch = await user.comparePassword(password);

  console.log("[LOGIN] Password validation result:", isMatch ? "Password match" : "Password mismatch");

  if (!isMatch) {
    console.log("[LOGIN] Authentication failed: Invalid password");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user._id);
  console.log("[LOGIN] JWT token generated successfully for user:", user._id);

  const response = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    token: token,
  };

  console.log("[LOGIN] Login successful for email:", email);
  console.log("[LOGIN] Sending response with user data and token");

  res.json(response);
});

/* =========================
   PROFILE
========================= */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

/* =========================
   UPDATE PROFILE
========================= */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();

  res.json({
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    },
    token: generateToken(updatedUser._id),
  });
});

/* =========================
   FORGOT PASSWORD
========================= */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  // Use CLIENT_URL from env, or fallback to localhost:3000
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  console.log("[authController] Generated reset URL:", resetUrl);

  try {
    console.log("[authController] forgotPassword: sending reset email", {
      to: user.email,
      clientUrl: process.env.CLIENT_URL,
      resetUrl,
    });

    await sendEmail({
      email: user.email,
      subject: "Password Reset",
      message: `
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password</p>
        <a href="${resetUrl}">Reset Password</a>
      `,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("[authController] forgotPassword: sendEmail failed", err);
    // don’t leak internals excessively; but log full error server-side
    res.status(500).json({ message: "Reset email failed", error: err.message });
  }
});

/* =========================
   RESET PASSWORD
========================= */
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
});

/* =========================
   EXPORTS (IMPORTANT)
========================= */
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
};