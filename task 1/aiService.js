(function () {
  function normalizeAiResult(data) {
    const out = data && typeof data === "object" ? { ...data } : {};

    if (typeof out.score === "string") {
      const n = Number(out.score);
      if (!Number.isNaN(n)) out.score = n;
    }

    if (!Array.isArray(out.why)) out.why = [];

    return out;
  }

  async function assessLeadershipReadiness(answers) {
    if (!answers || typeof answers !== "object") {
      throw new Error("Missing assessment answers.");
    }

    let res;

    try {
      res = await fetch("/api/assess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      });
    } catch (e) {
      throw new Error("AI service is unavailable. Start the local server to enable AI results.");
    }

    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch (e) {
        detail = "";
      }

      throw new Error(detail || `AI request failed (${res.status}).`);
    }

    const data = await res.json();
    return normalizeAiResult(data);
  }

  window.aiService = {
    assessLeadershipReadiness,
  };
})();
