import { NextRequest, NextResponse } from "next/server";
import { addEntry, getEntries, updateAnalysis } from "@/lib/store";
import { analyzeEMR } from "@/lib/gemini";
import type { BridgePostResponse, BridgeGetResponse, BridgeErrorResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<BridgePostResponse | BridgeErrorResponse>> {
  try {
    const { text, timestamp } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const entry = await addEntry(text, timestamp);

    // Run Gemini analysis
    try {
      const analysis = await analyzeEMR(text);
      await updateAnalysis(entry.id, analysis);
      entry.analysis = analysis;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Bridge] Gemini analysis failed:", message);
      await updateAnalysis(entry.id, { error: message });
      entry.analysis = { error: message };
    }

    return NextResponse.json({ ok: true as const, entry });
  } catch (err: unknown) {
    console.error("[Bridge] POST error:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function GET(): Promise<NextResponse<BridgeGetResponse | BridgeErrorResponse>> {
  try {
    const entries = await getEntries();
    return NextResponse.json({ entries });
  } catch (err: unknown) {
    console.error("[Bridge] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
