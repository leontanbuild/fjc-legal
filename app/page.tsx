"use client";
import { useState } from "react";

type Source = {
  citation: string;
  chunk_type: string;
  content: string;
  similarity: number;
  court: string;
  year: number;
  is_appellate: boolean;
  date_decision: string;
  headnote: string;
  subject_matters: string[];
  elitigation_url: string;
  url: string;
  outcome_winner: string;
};

type Result = {
  answer: string;
  sources: Source[];
};

const EXAMPLES = [
  "When should an adverse inference be drawn for non-disclosure of assets?",
  "What is the ANJ approach and when does it not apply?",
  "How does the court assess child maintenance for enrichment classes?",
  "Can a consent order on matrimonial assets be varied?",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Source | null>(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterCourt, setFilterCourt] = useState("");

  async function search(q?: string) {
    const qry = q ?? query;
    if (!qry.trim()) return;
    setQuery(qry);
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qry,
          filters: {
            year: filterYear ? parseInt(filterYear) : null,
            court: filterCourt || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Deduplicate sources by citation for the source cards
  const uniqueSources = result
    ? Object.values(
        result.sources.reduce((acc: any, s) => {
          if (!acc[s.citation] || s.similarity > acc[s.citation].similarity)
            acc[s.citation] = s;
          return acc;
        }, {})
      ) as Source[]
    : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gridTemplateRows: "52px 1fr", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{
        gridColumn: "1 / -1",
        background: "var(--navy)",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: "16px",
        borderBottom: "2px solid var(--amber)",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: "#fff", flex: 1 }}>
          Family Justice Courts&nbsp;&nbsp;<span style={{ color: "var(--amber)", fontStyle: "italic" }}>Case Research</span>
        </div>
        <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.15)", padding: "2px 8px" }}>
          Singapore · FJC Highlights
        </div>
      </header>

      {/* Sidebar */}
      <aside style={{ background: "var(--surface)", borderRight: "1px solid var(--rule)", padding: "16px 14px", overflowY: "auto" }}>

        <div style={{ marginBottom: "16px" }}>
          <span style={{ display: "block", fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "6px" }}>Year</span>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--rule)", padding: "6px 8px", fontSize: "12px", color: "var(--navy)", borderRadius: 0, appearance: "none" }}
          >
            <option value="">All years</option>
            {[2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <span style={{ display: "block", fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "6px" }}>Court</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {[["", "All"], ["SGHCF", "SGHCF"], ["SGHC(A)", "Appellate"], ["SGFC", "SGFC"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilterCourt(val)} style={{
                fontSize: "10px", fontFamily: "monospace", padding: "3px 8px",
                border: "1px solid", cursor: "pointer",
                borderColor: filterCourt === val ? "var(--amber)" : "var(--rule)",
                background: filterCourt === val ? "var(--amber)" : "transparent",
                color: filterCourt === val ? "#fff" : "var(--navy-mute)",
              }}>{label}</button>
            ))}
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "14px 0" }} />

        <div style={{ marginBottom: "14px" }}>
          <span style={{ display: "block", fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "8px" }}>Database</span>
          {[["Cases indexed", "5 (test)"], ["Updated", "Weekly"], ["Model", "Haiku 4.5"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "11px", color: "var(--navy-mute)" }}>{k}</span>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--navy)", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "14px 0" }} />
        <p style={{ fontSize: "10px", color: "var(--navy-mute)", lineHeight: 1.6 }}>
          Summaries only. Not a substitute for the full judgment. Always verify on eLitigation before reliance.
        </p>
      </aside>

      {/* Main */}
      <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Search bar */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--rule)", padding: "12px 20px", display: "flex", gap: "10px" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="e.g. When should an adverse inference be drawn for non-disclosure of assets?"
            style={{ flex: 1, border: "1px solid var(--rule)", background: "var(--bg)", padding: "9px 12px", fontSize: "13px", color: "var(--navy)", outline: "none", borderRadius: 0 }}
          />
          <button
            onClick={() => search()}
            disabled={loading}
            style={{ background: "var(--navy)", color: "#fff", border: "none", padding: "9px 18px", fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, borderRadius: 0, whiteSpace: "nowrap" }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", flex: 1, overflow: "hidden" }}>

          {/* Answer panel */}
          <div style={{ padding: "20px 24px", overflowY: "auto", borderRight: "1px solid var(--rule)" }}>

            {/* Empty state */}
            {!result && !loading && !error && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "10px" }}>Family Justice Courts · Singapore</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "var(--navy)", marginBottom: "8px" }}>Case law, retrieved.</div>
                <div style={{ fontSize: "13px", color: "var(--navy-mute)", lineHeight: 1.6, maxWidth: "300px", marginBottom: "20px" }}>Ask a question in plain English. Get an answer grounded in FJC case highlights with citations.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "360px" }}>
                  {EXAMPLES.map(ex => (
                    <button key={ex} onClick={() => search(ex)} style={{ background: "var(--surface)", border: "1px solid var(--rule)", padding: "8px 12px", fontSize: "12px", color: "var(--navy-mid)", cursor: "pointer", textAlign: "left", borderRadius: 0 }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div>
                {[95, 80, 90, 60, 85].map((w, i) => (
                  <div key={i} style={{ height: "13px", background: "linear-gradient(90deg,#e8e6e0 25%,#f0ede7 50%,#e8e6e0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: "10px", width: `${w}%` }} />
                ))}
                <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: "14px", background: "#FEF2F2", border: "1px solid #FCA5A5", fontSize: "13px", color: "#991B1B" }}>
                {error}
              </div>
            )}

            {/* Answer */}
            {result && !loading && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid var(--rule)" }}>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--navy-mute)" }}>Analysis</span>
                  <span style={{ fontSize: "11px", color: "var(--navy-mute)", fontStyle: "italic", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{query}</span>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--amber)" }}>{uniqueSources.length} source{uniqueSources.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "14.5px", lineHeight: 1.8, color: "var(--navy)", whiteSpace: "pre-wrap" }}>
                  {result.answer}
                </div>
              </div>
            )}
          </div>

          {/* Sources panel */}
          <div style={{ background: "var(--bg)", overflowY: "auto", padding: "14px" }}>
            <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid var(--rule)" }}>
              {result ? `Sources (${uniqueSources.length})` : "Sources"}
            </div>

            {!result && !loading && (
              <p style={{ fontSize: "12px", color: "var(--navy-mute)", textAlign: "center", marginTop: "40px", lineHeight: 1.6 }}>Retrieved cases will<br />appear here</p>
            )}

            {uniqueSources.map((s, i) => (
              <div
                key={i}
                onClick={() => setSelected(selected?.citation === s.citation ? null : s)}
                style={{
                  background: "var(--surface)", border: "1px solid",
                  borderColor: selected?.citation === s.citation ? "var(--amber)" : "var(--rule)",
                  borderLeft: selected?.citation === s.citation ? "3px solid var(--amber)" : "1px solid var(--rule)",
                  marginBottom: "8px", cursor: "pointer",
                }}
              >
                <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid var(--rule)" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: "bold", color: "var(--navy)", marginBottom: "4px", lineHeight: 1.3 }}>{s.citation}</div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", padding: "2px 5px", border: "1px solid", borderColor: s.is_appellate ? "var(--amber)" : "var(--navy-mid)", color: s.is_appellate ? "var(--amber)" : "var(--navy-mid)", background: s.is_appellate ? "var(--amber-bg)" : "transparent" }}>{s.court}</span>
                    <span style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", padding: "2px 5px", border: "1px solid var(--rule)", color: "var(--navy-mute)" }}>{s.year}</span>
                    {s.outcome_winner && s.outcome_winner !== "unclear" && (
                      <span style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", padding: "2px 5px", border: "1px solid #2D7A4F", color: "#2D7A4F" }}>
                        {s.outcome_winner === "split" ? "Split" : s.outcome_winner === "remitted" ? "Remitted" : `${s.outcome_winner.charAt(0).toUpperCase() + s.outcome_winner.slice(1)} won`}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--navy-mid)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.headnote || s.content}
                  </div>
                  <div style={{ marginTop: "5px" }}>
                    <div style={{ fontSize: "8px", fontFamily: "monospace", color: "var(--navy-mute)", marginBottom: "2px" }}>Relevance {Math.round(s.similarity * 100)}%</div>
                    <div style={{ height: "2px", background: "var(--rule)" }}>
                      <div style={{ height: "2px", background: "var(--amber)", width: `${Math.round(s.similarity * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: "5px 10px 7px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", color: "var(--navy-mute)" }}>{s.chunk_type}</span>
                  {s.elitigation_url && (
                    <a href={s.elitigation_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "10px", color: "var(--amber)", textDecoration: "none", fontFamily: "monospace" }}>
                      Full judgment →
                    </a>
                  )}
                </div>

                {/* Expanded detail */}
                {selected?.citation === s.citation && (
                  <div style={{ borderTop: "1px solid var(--rule)", padding: "12px 10px", background: "var(--bg)" }}>
                    {s.headnote && (
                      <>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "5px" }}>Headnote</div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: "12px", lineHeight: 1.65, color: "var(--navy)", fontStyle: "italic", paddingLeft: "8px", borderLeft: "2px solid var(--amber)", marginBottom: "10px" }}>{s.headnote}</div>
                      </>
                    )}
                    <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "5px" }}>Excerpt</div>
                    <div style={{ fontSize: "11px", lineHeight: 1.6, color: "var(--navy-mid)", marginBottom: "10px" }}>{s.content}</div>
                    {s.subject_matters?.length > 0 && (
                      <>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--navy-mute)", marginBottom: "5px" }}>Subject matters</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                          {s.subject_matters.map((sm: string) => (
                            <span key={sm} style={{ fontSize: "10px", color: "var(--navy-mid)", border: "1px solid var(--rule)", padding: "2px 6px", fontFamily: "monospace" }}>{sm}</span>
                          ))}
                        </div>
                      </>
                    )}
                    <div style={{ display: "flex", gap: "6px" }}>
                      {s.elitigation_url && (
                        <a href={s.elitigation_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", padding: "6px 10px", background: "var(--navy)", color: "#fff", textDecoration: "none", border: "none" }}>eLitigation</a>
                      )}
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", padding: "6px 10px", border: "1px solid var(--rule)", color: "var(--navy)", textDecoration: "none" }}>FJC summary</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
