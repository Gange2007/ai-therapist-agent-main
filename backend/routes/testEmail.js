const express = require("express");
const router = express.Router();

const sendEmail = require("../utils/sendEmail");

// TEST EMAIL ROUTE
router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      email: "gange.dm.s102@gmail.com", // change this
      subject: "Test Email 🚀",
      message: "<h1>Email is working successfully 🎉</h1>",
    });

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Email failed", error: error.message });
  }
});

module.exports = router;