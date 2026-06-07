const express = require("express");
// Prefer repo-level dotenv; fallback to backend-local installation.
let dotenv;
try {
  dotenv = require("dotenv");
} catch (e) {
  dotenv = require("./node_modules/dotenv");
}
const cors = require("cors");

// Load env BEFORE anything else
// Load root .env, then root .env.local to override, then backend-specific .env.
dotenv.config();
dotenv.config({ path: "./.env.local" });
dotenv.config({ path: "./backend/.env" });

const errorHandler = require("./middleware/errorHandler");

const testEmailRoutes = require("./routes/testEmail");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   DB (OPTIONAL)
========================= */

try {
  const connectDB = require("./config/database");
  connectDB();
} catch (err) {
  console.error("[server] Database config not found/failed to load:", err.message);
}

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/mood", require("./routes/mood"));
app.use("/api/activity", require("./routes/activity"));

app.use("/api/test", testEmailRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AI Therapist Backend API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/* =========================
   HOME WELCOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the AI Therapist Backend API!" });
});

/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   START SERVER
========================= */

// Email env debug (do not log password)
console.log('[mail debug] EMAIL_USER set:', Boolean(process.env.EMAIL_USER));
console.log('[env debug] OPENAI_API_KEY set:', Boolean(process.env.OPENAI_API_KEY));
console.log('[env debug] GEMINI_API_KEY set:', Boolean(process.env.GEMINI_API_KEY));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test email: http://localhost:${PORT}/api/test/test-email`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`[server] Port ${PORT} already in use.`);
    process.exit(1);
  }
  console.error(err);
});

module.exports = app;