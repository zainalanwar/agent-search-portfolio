import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const PROJECT_ID = process.env.GCP_PROJECT_ID || "zainal-agent-search-2026";
const DATA_STORE_ID = process.env.GCP_DATA_STORE_ID || "zainal-portfolio-kb";
const API_ROOT =
  `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}` +
  `/locations/global/collections/default_collection/dataStores/${DATA_STORE_ID}`;

function accessToken() {
  return execFileSync("gcloud", ["auth", "print-access-token"], {
    encoding: "utf8",
  }).trim();
}

async function api(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken()}`,
      "content-type": "application/json",
      "x-goog-user-project": PROJECT_ID,
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || JSON.stringify(payload));
  }
  return payload;
}

async function waitForOperation(name) {
  const endpoint = `https://discoveryengine.googleapis.com/v1/${name}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(endpoint, {
      headers: {
        authorization: `Bearer ${accessToken()}`,
        "x-goog-user-project": PROJECT_ID,
      },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || JSON.stringify(payload));
    }
    if (payload.done) {
      if (payload.error) throw new Error(payload.error.message);
      return payload;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("Import operation timed out.");
}

const source = JSON.parse(
  await readFile(new URL("../knowledge/documents.json", import.meta.url), "utf8"),
);

const documents = source.map((item) => ({
  id: item.id,
  structData: {
    title: item.title,
    uri: item.uri,
    category: item.category,
    year: item.year,
  },
  content: {
    mimeType: "text/plain",
    rawBytes: Buffer.from(
      `${item.title}\n\nCategory: ${item.category}\nYear: ${item.year}\n\n${item.content}`,
      "utf8",
    ).toString("base64"),
  },
}));

const operation = await api("/branches/0/documents:import", {
  method: "POST",
  body: JSON.stringify({
    inlineSource: { documents },
    reconciliationMode: "INCREMENTAL",
  }),
});

const result = operation.done ? operation : await waitForOperation(operation.name);
const metadata = result.metadata || {};
console.log(
  JSON.stringify(
    {
      dataStore: DATA_STORE_ID,
      requested: documents.length,
      successCount: metadata.successCount || documents.length,
      failureCount: metadata.failureCount || 0,
      operation: operation.name,
    },
    null,
    2,
  ),
);
