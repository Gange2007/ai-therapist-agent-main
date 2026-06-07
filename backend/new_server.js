const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const errorHandler = require("./middleware/errorHandler");
const testEmailRoutes = require("./routes/testEmail");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   DB
========================= */

try {
  const connectDB = require("./config/database");
  connectDB();
} catch (err) {
  console.error("[server] DB error:", err.message);
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
   HEALTH
========================= */

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;