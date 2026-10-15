# FedEx Admin Login Integration

## What this starter adds
- Single predefined admin account.
- Server-side bcrypt password hash.
- Session-cookie authentication.
- Login notification email.
- Email password reset with a random, hashed, 15-minute reset token.
- Login, forgot-password, and reset-password pages.
- Existing HTML dashboard pages are served by the same Express server and HTML routes are redirected to login when unauthenticated.

## Important project note
The code you shared is a plain HTML/JavaScript project, not a React component. Your dashboard HTML references `app.js` and `STYLE.CSS`. Keep those files and all your existing dashboard pages in the same project folder as `server.js`, or adjust `ROOT` in `server.js` to point to the folder containing the site.

## Setup
1. Back up your current project folder.
2. Copy `server.js`, `hash-password.js`, `package.json`, `.env.example`, `login.html`, `forgot-password.html`, and `reset-password.html` into the project root (the folder containing `INDEX.HTML`).
3. Open a terminal in that folder and run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Set `SESSION_SECRET` to a long random secret. Do not commit `.env`.
6. Set `ADMIN_USERNAME` and `ADMIN_EMAIL`.
7. Generate a password hash:
   ```bash
   npm run hash-password
   ```
   Copy the printed `ADMIN_PASSWORD_HASH` value into `.env`. Use a unique password with at least 12 characters.
8. Configure SMTP settings for your email provider (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`). Do not put SMTP credentials in browser JavaScript.
9. Set `APP_BASE_URL` to the URL users use to open the app. For local testing, `http://localhost:3000` is fine.
10. Start the app:
    ```bash
    npm start
    ```
11. Open `http://localhost:3000/login.html`. Do not use VS Code Live Server for this flow; the API and session cookie are provided by Express.

## Update the existing logout
In `app.js`, replace the existing `logout()` function with:
```js
async function logout() {
  if (!confirm("Are you sure you want to logout?")) return;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Logout failed.");

    // Keep your existing activity log behavior if desired.
    location.href = result.redirect || "/login.html";
  } catch (error) {
    alert(error.message || "Could not log out. Please try again.");
  }
}
```

## Protect non-HTML resources and direct API data
The included middleware protects HTML page requests. If your project has APIs that read or modify employee, attendance, or payroll data, add `requireAuth` to those routes too. Do not expose this server directly to the public internet without production hardening.

## Production hardening
This is a starter for local integration/testing. Before production use:
- Use a persistent session store (not Express's default in-memory store).
- Use HTTPS and `NODE_ENV=production`.
- Add login rate limiting, CSRF protections, and security review.
- Keep SMTP and session secrets in environment variables/secret management.
- Back up and secure `data/admin.json`; it contains the current password hash.
- If hosting behind a reverse proxy, configure Express `trust proxy` appropriately.
- Test every existing HTML route and all app functionality after adding the login gate.

## Email behavior
- Successful login sends a notification email to `ADMIN_EMAIL`.
- Forgot password sends a reset link only when the email matches the configured admin email.
- Reset links expire after 15 minutes and are one-use.
- If SMTP is not configured, login works but email delivery does not. The app shows a setup error for password-reset email.
