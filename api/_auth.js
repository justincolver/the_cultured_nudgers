const crypto = require("crypto");

const COOKIE_NAME = "nudgers_session";
const REMEMBER_SECONDS = 180 * 24 * 60 * 60;
const SESSION_SECONDS = 12 * 60 * 60;

function appPassword() {
  return process.env.APP_PASSWORD || "";
}

function timingSafeEqualText(a = "", b = "") {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function sign(value) {
  return crypto.createHmac("sha256", appPassword()).update(String(value)).digest("base64url");
}

function createSessionToken(remember = true) {
  const maxAge = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
  const expiresAt = Date.now() + maxAge * 1000;
  const signature = sign(expiresAt);
  return { token: `v1.${expiresAt}.${signature}`, maxAge };
}

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");
      if (index === -1) return cookies;
      cookies[decodeURIComponent(part.slice(0, index))] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function isAuthenticated(req) {
  if (!appPassword()) return false;
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;

  const [version, expiresAt, signature] = token.split(".");
  if (version !== "v1" || !expiresAt || !signature) return false;
  if (Number(expiresAt) <= Date.now()) return false;

  return timingSafeEqualText(signature, sign(expiresAt));
}

function sessionCookie(token, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = {
  appPassword,
  clearCookie,
  createSessionToken,
  isAuthenticated,
  readJsonBody,
  sessionCookie,
  timingSafeEqualText,
};
