const fs = require("fs");
const path = require("path");
const { isAuthenticated } = require("./_auth");

module.exports = function handler(req, res) {
  if (!isAuthenticated(req)) {
    const next = req.query?.path || "/";
    res.statusCode = 307;
    res.setHeader("Location", `/login.html?next=${encodeURIComponent(next)}`);
    res.end();
    return;
  }

  const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
};
