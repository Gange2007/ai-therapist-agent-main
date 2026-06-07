const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        `EMAIL_* env missing. EMAIL_USER=${Boolean(
          process.env.EMAIL_USER
        )} EMAIL_PASS=${Boolean(process.env.EMAIL_PASS)}`
      );
    }

    // Gmail SMTP explicit config.
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
      pool: false,
    });

    console.log("[mail debug] transporter.verify()...");
    await transporter.verify();
    console.log("[mail debug] transporter verified");



    transporter.on("error", (err) => {
      console.error("[nodemailer transport error]", err);
    });

    // optional: see what SMTP server is saying at the node level
    transporter.on("log", (log) => {
      console.log("[nodemailer log]", log);
    });

    const html = options.message;
    const text =
      typeof html === "string"
        ? html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : String(html);

    const mailOptions = {
      from: `"AuraMind" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text,
      html,
      replyTo: process.env.EMAIL_USER,
    };

    console.log("[mail debug] sendMail mailOptions:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo,
      hasHtml: typeof mailOptions.html === "string" && mailOptions.html.length > 0,
      hasText: typeof mailOptions.text === "string" && mailOptions.text.length > 0,
    });

    const info = await transporter.sendMail(mailOptions);

    // Deliverability diagnostics
    console.log("[email] messageId:", info?.messageId);
    console.log("[email] accepted:", info?.accepted);
    console.log("[email] rejected:", info?.rejected);
    console.log("[email] response:", info?.response);
    console.log("[email] envelope:", info?.envelope);

    return info;
  } catch (error) {
    console.error("EMAIL ERROR:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      response: error?.response,
      command: error?.command,
      SMTP: error?.response,
    });
    throw error;
  }
};

module.exports = sendEmail;