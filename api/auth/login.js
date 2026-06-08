const {
  appPassword,
  createSessionToken,
  readJsonBody,
  sessionCookie,
  timingSafeEqualText,
} = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const configuredPassword = appPassword();
  if (!configuredPassword) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "APP_PASSWORD is not configured." }));
    return;
  }

  try {
    const { password = "", remember = true } = await readJsonBody(req);
    if (!timingSafeEqualText(password, configuredPassword)) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Incorrect password." }));
      return;
    }

    const session = createSessionToken(Boolean(remember));
    res.statusCode = 200;
    res.setHeader("Set-Cookie", sessionCookie(session.token, remember ? session.maxAge : null));
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Invalid login request." }));
  }
};
