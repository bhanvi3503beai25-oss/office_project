require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const RESET_FILE = path.join(DATA_DIR, "password-reset.json");

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("Set SESSION_SECRET in .env to a random secret of at least 32 characters.");
}
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL) {
  throw new Error("Set ADMIN_USERNAME and ADMIN_EMAIL in .env.");
}

fs.mkdirSync(DATA_DIR, { recursive: true });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), { mode: 0o600 });
}

let admin = readJson(ADMIN_FILE, null);
if (!admin) {
  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_PASSWORD_HASH.startsWith("$2")) {
    throw new Error("Set ADMIN_PASSWORD_HASH in .env. Run npm run hash-password and copy the output.");
  }
  admin = {
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH
  };
  writeJson(ADMIN_FILE, admin);
}

let resetState = readJson(RESET_FILE, {});
const resetTokens = new Map();

const mailReady = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS &&
  process.env.EMAIL_FROM
);
const transporter = mailReady ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(session({
  name: "fedex.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated === true) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Please sign in." });
  return res.redirect("/login.html");
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn("Email not sent: SMTP is not configured. Configure SMTP settings in .env.");
    return false;
  }
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
  return true;
}

app.get("/api/auth/me", (req, res) => {
  res.json({
    authenticated: req.session?.authenticated === true,
    username: req.session?.authenticated ? admin.username : null
  });
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const usernameOk = crypto.timingSafeEqual(
    Buffer.from(username.padEnd(256).slice(0, 256)),
    Buffer.from(String(admin.username).padEnd(256).slice(0, 256))
  );
  const passwordOk = await bcrypt.compare(password, admin.passwordHash).catch(() => false);

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  req.session.regenerate(async (err) => {
    if (err) return res.status(500).json({ error: "Could not create a session. Please try again." });
    req.session.authenticated = true;
    req.session.username = admin.username;
    req.session.save(async (saveErr) => {
      if (saveErr) return res.status(500).json({ error: "Could not save session." });
      try {
        await sendEmail({
          to: admin.email,
          subject: "FedEx Admin: Successful login",
          text: `A successful login to your FedEx Admin account occurred at ${new Date().toLocaleString()}. If this was not you, change your password immediately.`,
          html: `<p>A successful login to your FedEx Admin account occurred at <strong>${new Date().toLocaleString()}</strong>.</p><p>If this was not you, change your password immediately.</p>`
        });
      } catch (e) {
        console.error("Login notification email failed:", e.message);
      }
      res.json({ ok: true, redirect: "/INDEX.HTML" });
    });
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie("fedex.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    if (err) return res.status(500).json({ error: "Could not log out." });
    res.json({ ok: true, redirect: "/login.html" });
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  // Always return the same message so the endpoint does not reveal whether an account exists.
  const genericMessage = "If that email is registered, a password-reset link will be sent.";
  if (email !== String(admin.email).toLowerCase()) return res.json({ message: genericMessage });
  if (!mailReady) return res.status(503).json({ error: "Password-reset email is not configured yet. Ask the administrator to configure SMTP." });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  resetTokens.clear();
  resetTokens.set(tokenHash, Date.now() + 15 * 60 * 1000);

  const base = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
  const resetUrl = `${base}/reset-password.html?token=${encodeURIComponent(rawToken)}`;
  try {
    await sendEmail({
      to: admin.email,
      subject: "FedEx Admin: Password reset",
      text: `A password reset was requested. This link expires in 15 minutes: ${resetUrl}\nIf you did not request this, ignore this email.`,
      html: `<p>A password reset was requested for your FedEx Admin account.</p><p><a href="${resetUrl}">Reset password</a> (expires in 15 minutes).</p><p>If you did not request this, ignore this email.</p>`
    });
    res.json({ message: genericMessage });
  } catch (e) {
    console.error("Password reset email failed:", e.message);
    res.status(500).json({ error: "Could not send reset email. Check SMTP configuration." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = String(req.body.token || "");
  const password = String(req.body.password || "");
  if (password.length < 12) return res.status(400).json({ error: "Password must be at least 12 characters." });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = resetTokens.get(tokenHash);
  if (!expiresAt || Date.now() > expiresAt) {
    resetTokens.delete(tokenHash);
    return res.status(400).json({ error: "This reset link is invalid or has expired. Request a new one." });
  }

  admin.passwordHash = await bcrypt.hash(password, 12);
  writeJson(ADMIN_FILE, admin);
  resetTokens.delete(tokenHash);
  resetTokens.clear();
  if (req.session) {
    req.session.destroy(() => {});
  }
  res.json({ ok: true, message: "Password updated. Please sign in with your new password." });
});

// Protect every existing HTML page except the login and reset pages.
app.use((req, res, next) => {
  const openPaths = ["/login.html", "/forgot-password.html", "/reset-password.html", "/api/auth/me",
    "/api/auth/login", "/api/auth/logout", "/api/auth/forgot-password", "/api/auth/reset-password"];
  if (openPaths.includes(req.path) || req.path.startsWith("/assets/")) return next();
  if (req.path === "/" || req.path.toLowerCase() === "/index.html" ||
      /\.(html?)$/i.test(req.path)) return requireAuth(req, res, next);
  next();
});

// Serve existing project files, but never expose secrets, server files, or data.
app.use((req, res, next) => {
  const blocked = ["/server.js", "/package.json", "/hash-password.js", "/.env", "/.env.example"];
  if (blocked.includes(req.path) || req.path.startsWith("/data/") || req.path.startsWith("/node_modules/")) {
    return res.sendStatus(404);
  }
  next();
});
app.use(express.static(ROOT, { dotfiles: "deny", index: false }));

app.get("/", (req, res) => res.redirect("/login.html"));

app.listen(PORT, () => {
  console.log(`FedEx Admin server running at http://localhost:${PORT}`);
  if (!mailReady) console.warn("SMTP is not configured. Login will work, but email delivery will not.");
});
