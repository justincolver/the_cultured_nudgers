const { clearCookie } = require("../_auth");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Set-Cookie", clearCookie());
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
};
