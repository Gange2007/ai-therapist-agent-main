const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

// ನಿಮ್ಮ ಫ್ರಂಟ್ಎಂಡ್ /signup ಅಂತ ಕರೆಯುತ್ತಿರುವುದರಿಂದ, ಇಲ್ಲಿ '/signup' ಎಂದು ಬದಲಾಯಿಸಲಾಗಿದೆ
router.post("/signup", registerUser); 
router.post("/login", loginUser);
router.get("/me", protect, getUserProfile);
router.put("/update-profile", protect, updateUserProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;