const { isAuthenticated } = require("../_auth");

module.exports = function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ authenticated: isAuthenticated(req) }));
};
