const { isAuthenticated, readJsonBody } = require("./_auth");

const SUPABASE_REST_URL = "https://dwohuxnsbaupysxtupxs.supabase.co/rest/v1";

function serviceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
}

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function hallOfFamePayload(body = {}) {
  const yearValue = String(body.year || "").trim();
  const parsedYear = Number(yearValue);
  return {
    year: yearValue && Number.isFinite(parsedYear) ? parsedYear : null,
    commentary: String(body.commentary || "").trim(),
  };
}

async function supabaseWrite(path, { method, body }) {
  const key = serviceRoleKey();
  if (!key) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${SUPABASE_REST_URL}/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `Supabase request failed: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (!isAuthenticated(req)) {
    json(res, 401, { error: "Not authenticated." });
    return;
  }

  if (req.method === "DELETE") {
    json(res, 405, { error: "Delete is not supported." });
    return;
  }

  if (!["POST", "PATCH"].includes(req.method)) {
    json(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const payload = hallOfFamePayload(body);

    if (!payload.year && !payload.commentary) {
      json(res, 400, { error: "Year or commentary is required." });
      return;
    }

    if (req.method === "POST") {
      const rows = await supabaseWrite("hall_of_fame", {
        method: "POST",
        body: payload,
      });
      json(res, 200, rows);
      return;
    }

    const rowId = String(req.query?.id || "").trim();
    if (!rowId) {
      json(res, 400, { error: "Row id is required." });
      return;
    }

    const rows = await supabaseWrite(`hall_of_fame?id=eq.${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      body: payload,
    });
    json(res, 200, rows);
  } catch (error) {
    console.warn(error);
    json(res, error.statusCode || 500, { error: error.message || "Hall of Fame write failed." });
  }
};
