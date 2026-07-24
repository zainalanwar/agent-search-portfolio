import { useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Filter,
  History,
  Search,
  Sparkles,
} from "lucide-react";

const suggestions = [
  "Bagaimana NusaEval mengevaluasi AI berbahasa Indonesia?",
  "Contoh automasi workflow yang pernah dibangun?",
  "Pendekatan arsitektur cloud untuk kontrol biaya?",
  "Apa hasil terukur dari project yang pernah dikerjakan?",
];

const categories = ["Semua", "AI & Data", "Automation", "Product"];

const initialAnswer = {
  query: suggestions[0],
  summary:
    "NusaEval AI adalah benchmark terbuka dan reproducible untuk menguji model bahasa pada tugas praktis Indonesia. Sistemnya menggabungkan 20 kasus uji, delapan model, pemeriksaan deterministik, telemetry biaya dan latensi, serta dashboard portabel. Pilot menghasilkan 160 respons sukses tanpa kegagalan, sehingga hasil evaluasi dapat dibandingkan dengan bukti yang dapat direproduksi. [1] [2]",
  results: [
    {
      id: "nusaeval-overview",
      title: "NusaEval AI: Benchmark Indonesia",
      category: "AI & Data",
      uri: "https://github.com/zainalanwar/agent-search-portfolio",
      snippet:
        "Benchmark terbuka untuk evaluasi model AI pada tugas praktis Indonesia, lengkap dengan cost controls dan telemetry.",
    },
    {
      id: "nusaeval-results",
      title: "Hasil Pilot NusaEval",
      category: "AI & Data",
      uri: "https://github.com/zainalanwar/agent-search-portfolio",
      snippet:
        "160 respons sukses dari delapan model dan 20 kasus dengan estimasi inference cost $0.39273.",
    },
    {
      id: "cloud-cost-control",
      title: "Cloud Cost-Control Architecture",
      category: "Product",
      uri: "https://github.com/zainalanwar/agent-search-portfolio",
      snippet:
        "Project isolation, gross-spend budget, minimal API surface, and explicit shutdown procedures.",
    },
  ],
  synthetic: true,
};

function cleanSnippet(value = "") {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function SourceRow({ item, index }) {
  return (
    <a
      className="source-row"
      href={item.uri || "#"}
      target="_blank"
      rel="noreferrer"
    >
      <span className="source-index">{index + 1}</span>
      <span className="source-copy">
        <strong>{item.title || `Sumber ${index + 1}`}</strong>
        <span>{cleanSnippet(item.snippet) || item.category || "Dokumen portfolio"}</span>
      </span>
      <ExternalLink aria-hidden="true" size={16} />
    </a>
  );
}

function App() {
  const [query, setQuery] = useState(initialAnswer.query);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [answer, setAnswer] = useState(initialAnswer);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");

  const visibleSources = useMemo(() => {
    if (activeCategory === "Semua") return answer.results;
    return answer.results.filter((item) => item.category === activeCategory);
  }, [activeCategory, answer.results]);

  async function runSearch(nextQuery = query) {
    const normalized = nextQuery.trim();
    if (!normalized || status === "loading") return;

    setQuery(normalized);
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: normalized }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Pencarian gagal.");

      setAnswer({
        query: normalized,
        summary: payload.summary,
        results: payload.results,
        synthetic: false,
      });
      setStatus("ready");
    } catch (searchError) {
      setError(
        searchError.message ||
          "Agent Search belum dapat dihubungi. Coba beberapa saat lagi.",
      );
      setStatus("error");
    }
  }

  function submit(event) {
    event.preventDefault();
    runSearch();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Zainal Knowledge Search">
          <strong>Zainal</strong>
          <span>/</span>
          <span>Knowledge Search</span>
        </a>
        <div className="top-actions">
          <span className="live-status">
            <span aria-hidden="true" />
            Live
          </span>
          <a className="text-button" href="#search">
            <Sparkles size={17} />
            Tanya portfolio
          </a>
          <button className="icon-button" title="Riwayat pencarian" type="button">
            <History size={18} />
          </button>
          <button className="icon-button" title="Filter sumber" type="button">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="workspace">
        <section className="search-main" id="search">
          <form className="search-form" onSubmit={submit}>
            <Search aria-hidden="true" size={30} />
            <label className="sr-only" htmlFor="portfolio-query">
              Cari portfolio
            </label>
            <input
              id="portfolio-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari project, skill, atau hasil kerja..."
              maxLength={300}
            />
            <button disabled={status === "loading"} type="submit">
              {status === "loading" ? "Mencari" : "Cari"}
              <ArrowRight aria-hidden="true" size={19} />
            </button>
          </form>

          <div className="suggestions" aria-label="Pertanyaan contoh">
            <h2>Coba tanyakan</h2>
            <div className="suggestion-grid">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => runSearch(suggestion)}
                  type="button"
                >
                  <span>{suggestion}</span>
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
              ))}
            </div>
          </div>

          <article
            className={`answer ${status === "loading" ? "is-loading" : ""}`}
            aria-live="polite"
          >
            <p className="answer-label">
              {answer.synthetic ? "Contoh jawaban" : "Jawaban berbasis sumber"}
            </p>
            <h1>Temukan bukti, bukan sekadar klaim.</h1>
            {error ? (
              <div className="error-state">
                <strong>Koneksi belum siap</strong>
                <p>{error}</p>
                <button onClick={() => runSearch()} type="button">
                  Coba lagi
                </button>
              </div>
            ) : (
              <>
                <p className="answer-query">{answer.query}</p>
                <p className="answer-body">{answer.summary}</p>
              </>
            )}

            <div className="inline-sources">
              <h2>Sumber</h2>
              {answer.results.slice(0, 5).map((item, index) => (
                <SourceRow item={item} index={index} key={item.id || index} />
              ))}
            </div>
          </article>
        </section>

        <aside className="evidence-panel">
          <div className="panel-heading">
            <h2>Sumber</h2>
            <span>{visibleSources.length} dokumen</span>
          </div>
          <div className="filters" aria-label="Filter kategori">
            {categories.map((category) => (
              <button
                className={category === activeCategory ? "active" : ""}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="source-list">
            {visibleSources.length ? (
              visibleSources
                .slice(0, 5)
                .map((item, index) => (
                  <SourceRow item={item} index={index} key={item.id || index} />
                ))
            ) : (
              <p className="empty-copy">Belum ada sumber di kategori ini.</p>
            )}
          </div>

          <section className="facts">
            <h2>Fakta project</h2>
            <dl>
              <div>
                <dt>Platform</dt>
                <dd>Google Cloud Agent Search</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>Curated portfolio knowledge base</dd>
              </div>
              <div>
                <dt>Grounding</dt>
                <dd>Search summaries dengan citations</dd>
              </div>
              <div>
                <dt>Guardrail</dt>
                <dd>Budget biaya kotor Rp250.000/bulan</dd>
              </div>
            </dl>
            <a
              className="project-link"
              href="https://github.com/zainalanwar/agent-search-portfolio"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" size={17} />
              Lihat project
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </section>
        </aside>
      </div>

      <footer>
        Powered by <strong>Google Cloud Agent Search</strong>
      </footer>
    </main>
  );
}

export default App;
