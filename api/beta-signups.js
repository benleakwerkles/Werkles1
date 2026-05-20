const allowedLanes = new Set(["Builder", "Operator", "Backer", "Connector", "Spark"]);
const laneMap = {
  builder: "Builder",
  operator: "Operator",
  backer: "Backer",
  connector: "Connector",
  spark: "Spark"
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    sendJson(response, 501, { error: "Beta signup backend is not configured yet." });
    return;
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  } catch {
    sendJson(response, 400, { error: "Invalid JSON payload." });
    return;
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const lane = laneMap[String(body?.lane || "").trim()] || String(body?.lane || "").trim();

  if (!email || !email.includes("@")) {
    sendJson(response, 400, { error: "Valid email is required." });
    return;
  }

  if (!allowedLanes.has(lane)) {
    sendJson(response, 400, { error: "Valid lane is required." });
    return;
  }

  const supabaseResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/beta_signups`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ email, lane })
  });

  if (!supabaseResponse.ok) {
    sendJson(response, 502, { error: "Could not save beta signup." });
    return;
  }

  sendJson(response, 200, { ok: true });
};
