import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM = `You are a legal research assistant specialising in Singapore family law.
You help lawyers find relevant case law from the Family Justice Courts Case Highlights.
RULES:
1. Answer only from the provided case excerpts. Do not use general legal knowledge.
2. Every claim must cite the specific case: "In [Citation], the court held that..."
3. If the excerpts do not contain enough information, say so clearly.
4. Use precise legal language appropriate for a practitioner audience.
5. Structure your answer: brief direct answer then supporting cases then any caveats.
6. Never speculate about cases not provided in the context.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query;
    const filters = body.filters || {};

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    // Use full-text search only (no vector embedding needed)
    // This uses the fts index on chunks via a direct Postgres query
    const { data: chunks, error } = await sb
      .from("chunks")
      .select("case_id, citation, chunk_type, chunk_index, content, year, court, is_appellate, legal_issues, subject_matters")
      .textSearch("content", query.split(" ").join(" | "), {
        type: "websearch",
        config: "english",
      })
      .limit(8);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
    }

    if (!chunks || chunks.length === 0) {
      // Fallback: just grab all chunks if text search finds nothing
      const { data: fallback } = await sb
        .from("chunks")
        .select("case_id, citation, chunk_type, chunk_index, content, year, court, is_appellate, legal_issues, subject_matters")
        .limit(8);

      if (!fallback || fallback.length === 0) {
        return NextResponse.json({
          answer: "No cases found in the database.",
          sources: [],
        });
      }

      return handleAnswer(query, fallback, filters);
    }

    return handleAnswer(query, chunks, filters);

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

async function handleAnswer(query: string, chunks: any[], filters: any) {
  // Build context for Claude
  const context = chunks
    .map((c: any, i: number) => `[${i + 1}] ${c.citation} (${c.chunk_type})\n${c.content}`)
    .join("\n\n---\n\n");

  // Generate answer with Claude Haiku
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: `Query: ${query}\n\nCase excerpts:\n\n${context}` }],
  });

  const answer =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Fetch case metadata
  const uniqueCitations = [...new Set(chunks.map((c: any) => c.citation))];
  const { data: caseData } = await sb
    .from("cases")
    .select("citation, court, date_decision, headnote, subject_matters, elitigation_url, url, outcome_winner, is_appellate")
    .in("citation", uniqueCitations as string[]);

  const caseMap: Record<string, any> = {};
  (caseData || []).forEach((d: any) => { caseMap[d.citation] = d; });

  const sources = chunks.map((c: any) => {
    const meta = caseMap[c.citation] || {};
    return {
      citation: c.citation,
      chunk_type: c.chunk_type,
      content: c.content,
      similarity: 1,
      court: c.court,
      year: c.year,
      is_appellate: meta.is_appellate || false,
      date_decision: meta.date_decision || "",
      headnote: meta.headnote || "",
      subject_matters: meta.subject_matters || [],
      elitigation_url: meta.elitigation_url || "",
      url: meta.url || "",
      outcome_winner: meta.outcome_winner || "",
    };
  });

  return NextResponse.json({ answer, sources, usage: response.usage });
}
