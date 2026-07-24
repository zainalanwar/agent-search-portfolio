import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = process.env.GCP_PROJECT_ID || "zainal-agent-search-2026";
const ENGINE_ID = process.env.GCP_ENGINE_ID || "zainal-portfolio-search";
const LOCATION = "global";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getAuth() {
  const credentials = process.env.GCP_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON)
    : undefined;

  return new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

function pickSnippet(document) {
  const derived = document.derivedStructData || {};
  const snippets = derived.snippets || [];
  const extractiveAnswers = derived.extractive_answers || [];
  return (
    snippets[0]?.snippet ||
    extractiveAnswers[0]?.content ||
    derived.description ||
    ""
  );
}

function toResult(result, index) {
  const document = result.document || {};
  const derived = document.derivedStructData || {};
  const structured = document.structData || {};

  return {
    id: document.id || `result-${index + 1}`,
    title:
      derived.title ||
      structured.title ||
      document.displayName ||
      `Sumber ${index + 1}`,
    uri: derived.link || structured.uri || "",
    category: structured.category || derived.category || "Portfolio",
    snippet: pickSnippet(document),
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method tidak didukung." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Payload JSON tidak valid." });
  }

  const query = String(payload.query || "").trim();
  if (!query) return json(400, { error: "Pertanyaan tidak boleh kosong." });
  if (query.length > 300) {
    return json(400, { error: "Pertanyaan maksimal 300 karakter." });
  }

  try {
    const auth = getAuth();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const endpoint =
      `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}` +
      `/locations/${LOCATION}/collections/default_collection/engines/${ENGINE_ID}` +
      "/servingConfigs/default_search:search";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken.token || accessToken}`,
        "content-type": "application/json",
        "x-goog-user-project": PROJECT_ID,
      },
      body: JSON.stringify({
        query,
        pageSize: 8,
        userPseudoId: "public-portfolio",
        contentSearchSpec: {
          snippetSpec: {
            returnSnippet: true,
          },
          extractiveContentSpec: {
            maxExtractiveAnswerCount: 1,
          },
          summarySpec: {
            summaryResultCount: 5,
            includeCitations: true,
            ignoreAdversarialQuery: true,
            ignoreNonSummarySeekingQuery: false,
            modelSpec: {
              version: "stable",
            },
            modelPromptSpec: {
              preamble:
                "Jawab dalam Bahasa Indonesia yang ringkas dan faktual. " +
                "Gunakan hanya informasi dari sumber portfolio yang ditemukan. " +
                "Pertahankan penanda sitasi dan jangan mengarang pencapaian.",
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Agent Search error", response.status, data.error?.message);
      return json(502, {
        error: "Agent Search belum dapat menyelesaikan permintaan.",
      });
    }

    const results = (data.results || []).map(toResult);
    const summary =
      data.summary?.summaryText ||
      "Belum ada jawaban generatif untuk pertanyaan ini. Periksa sumber yang ditemukan.";

    return json(200, {
      query,
      summary,
      results,
      attributionToken: data.attributionToken || "",
    });
  } catch (error) {
    console.error("Search function failed", error);
    return json(500, {
      error: "Koneksi server ke Agent Search belum siap.",
    });
  }
}
