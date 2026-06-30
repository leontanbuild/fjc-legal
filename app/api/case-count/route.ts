import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const { count, error } = await sb
      .from("cases")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Case count error:", error);
      return NextResponse.json({ count: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err: any) {
    console.error("Case count API error:", err);
    return NextResponse.json({ count: null, error: err.message }, { status: 500 });
  }
}
