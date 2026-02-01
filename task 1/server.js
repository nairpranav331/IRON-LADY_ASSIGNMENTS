const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const ROOT_DIR = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function stripCodeFences(text) {
  const t = (text || "").trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return t;
}

function extractJson(text) {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
  }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Model did not return JSON.");
  }

  const slice = cleaned.slice(first, last + 1);
  return JSON.parse(slice);
}

function buildPrompts({ careerStage, experience, influence, challenge, goal }) {
  const system = `You are an AI Leadership Readiness Assessor built exclusively for Iron Lady, a women leadership development company based in India.

Your role is to:
- Assess leadership readiness of women professionals
- Identify their primary career blocker
- Recommend ONLY Iron Lady programs
- Use an empathetic, empowering, professional coaching tone

STRICT RULES:
- Do NOT mention any external companies or programs
- Do NOT give generic career advice
- All reasoning must align with Iron Lady’s leadership philosophy
- Be positive, supportive, and confidence-building`;

  const user = `BUSINESS CONTEXT:
"Iron Lady helps women professionals grow into leadership roles through leadership acceleration programs, confidence and visibility coaching, and structured career journeys.
Its audience includes working professionals, aspiring leaders, mid-level managers, senior leaders, and women restarting their careers."

INPUT FORMAT (FROM UI STATE):
Career Stage: ${careerStage}
Years of Experience: ${experience}
Decision-Making Influence: ${influence}
Primary Career Challenge: ${challenge}
Career Goal (12 months): ${goal}

TASKS FOR AI:
1. Calculate a Leadership Readiness Score (0–100)
2. Assign ONE label:
   - Early Stage (0–39)
   - Emerging Leader (40–69)
   - Leadership Ready (70–85)
   - High-Impact Leader (86–100)
3. Identify the PRIMARY career blocker
4. Recommend ONE best-fit Iron Lady program
5. Explain the recommendation clearly and empathetically

OUTPUT FORMAT (STRICT – JSON ONLY):
{
  "score": "number",
  "label": "string",
  "insight": "string",
  "program": "string",
  "why": ["string", "string", "string"],
  "nextStep": "string"
}`;

  return { system, user };
}

async function callOpenAI({ system, user }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `OpenAI request failed (${resp.status}).`);
  }

  const data = await resp.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

  if (!content) {
    throw new Error("OpenAI response missing content.");
  }

  return content;
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = urlPath === "/" ? "/index.html" : urlPath;

  const fsPath = path.normalize(path.join(ROOT_DIR, safePath));
  if (!fsPath.startsWith(ROOT_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(fsPath, (err, data) => {
    if (err) {
      const indexPath = path.join(ROOT_DIR, "index.html");
      fs.readFile(indexPath, (err2, indexData) => {
        if (err2) {
          sendText(res, 404, "Not found");
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(fsPath).toLowerCase();
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url && req.url.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, authorization",
      });
      res.end();
      return;
    }

    if (req.url.startsWith("/api/assess") && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const payload = JSON.parse(raw || "{}");

        const required = ["careerStage", "experience", "influence", "challenge", "goal"];
        for (const k of required) {
          if (!payload[k]) {
            sendJson(res, 400, { error: `Missing field: ${k}` });
            return;
          }
        }

        const prompts = buildPrompts(payload);
        const text = await callOpenAI(prompts);
        const result = extractJson(text);

        sendJson(res, 200, result);
      } catch (e) {
        sendText(res, 500, e && e.message ? e.message : "Unknown error");
      }
      return;
    }

    sendText(res, 404, "Not found");
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Iron Lady assessment running at http://localhost:${PORT}`);
});
