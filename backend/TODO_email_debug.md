# Email Debug/Firebreak Plan (update)

## Confirmed findings
- There are **two different** email senders in the repo:
  1) `backend/utils/sendEmail.js` (CommonJS, explicit Gmail SMTP config)
  2) `backend/utils/mailer.js` (ESM-style, `service: "gmail"`, no verify + different transport)
- `backend/controllers/authController.js` uses `../utils/sendEmail` (the one with verify).
- `backend/routes/testEmail.js` also uses `../utils/sendEmail`.

## Edit plan (next)
1) Patch `backend/utils/sendEmail.js` to ensure:
   - transporter options are fully explicit (host/port/secure/tls)
   - add `transporter.verify()` + extensive logs for accepted/rejected/envelope/response
   - log nodemailer options and the computed mailOptions (minus secrets)
   - handle cases where Gmail accepts but rejects silently (log `info` fields)
   - ensure `text` and `html` are both valid.
2) Patch forgot-password flow:
   - Add try/catch around `sendEmail` in `forgotPassword` to log sendEmail errors and token/url.
   - Ensure `resetUrl` uses a URL that is reachable (CLIENT_URL must be correct) and log it.
3) Ensure env vars are loaded:
   - Add a small startup log in `backend/server.js` to print whether EMAIL_USER/CLIENT_URL are set (boolean only).
4) Ensure no accidental use of `mailer.js` for reset.

## Gmail 100% working config
- Will provide as a drop-in replacement for `backend/utils/sendEmail.js` after patching.

