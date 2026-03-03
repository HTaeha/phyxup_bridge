import { NextRequest, NextResponse } from "next/server";
import { getEntries } from "@/lib/store";
import { chatAboutEntry } from "@/lib/gemini";
import type { ChatResponse, BridgeErrorResponse } from "@/lib/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse | BridgeErrorResponse>> {
  try {
    const { entryId, question } = await request.json();

    if (!entryId || !question || typeof question !== "string") {
      return NextResponse.json(
        { error: "entryId and question are required" },
        { status: 400 }
      );
    }

    const entries = await getEntries();
    const entry = entries.find((e) => e.id === entryId);

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    if (!entry.analysis || !("type" in entry.analysis) || entry.analysis.type === "unknown") {
      return NextResponse.json(
        { error: "No valid analysis for this entry" },
        { status: 400 }
      );
    }

    const answer = await chatAboutEntry(
      entry.text,
      JSON.stringify(entry.analysis, null, 2),
      question
    );

    return NextResponse.json({ ok: true as const, answer });
  } catch (err: unknown) {
    console.error("[Chat] error:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
