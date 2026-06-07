const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  console.log("[AUTH] Middleware: Checking authorization...");

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("[AUTH] Token found in Authorization header");

      console.log("[AUTH] Verifying JWT token...");
      console.log("[AUTH] JWT_SECRET set:", Boolean(process.env.JWT_SECRET));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default-secret-key-change-in-production"
      );
      console.log("[AUTH] Token verified successfully. Decoded user ID:", decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      console.log("[AUTH] User lookup result:", req.user ? "User found" : "User not found");

      if (!req.user) {
        console.log("[AUTH] Authorization failed: User not found in database");
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      console.log("[AUTH] Authorization successful for user:", req.user.email);
      return next();
    } catch (error) {
      console.error("[AUTH] Token verification failed:", error.message);
      console.error("[AUTH] Error stack:", error.stack);
      return res
        .status(401)
        .json({ message: "Not authorized, token failed" });
    }
  }

  console.log("[AUTH] No token found in Authorization header");
  return res
    .status(401)
    .json({ message: "Not authorized, no token" });
};

module.exports = { protect };