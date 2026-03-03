import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EMRAnalysis } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a medical EMR (Electronic Medical Record) text analyzer.
Given raw EMR text, you must:

1. Detect the type of the text:
   - "diagnosis_prescription" if it contains diagnosis and/or prescription information
   - "lab_result" if it contains laboratory test results

2. Return a structured JSON based on the detected type.

For "diagnosis_prescription" type, return:
{
  "type": "diagnosis_prescription",
  "diagnosis": ["Primary diagnosis", ...],
  "prescriptions": [
    { "drug": "Drug name", "dose": "Dosage", "frequency": "How to take", "duration": "Duration" }
  ],
  "notes": "Additional remarks",
  "insights": ["Cautions", "Drug interaction possibilities", ...]
}

For "lab_result" type, return:
{
  "type": "lab_result",
  "tests": [
    { "name": "Test name", "value": "Value", "unit": "Unit", "range": "Normal range", "status": "normal|high|low" }
  ],
  "summary": "Overall summary",
  "insights": ["Abnormal value interpretation", "Additional test recommendations", ...]
}

IMPORTANT:
- Respond ONLY with valid JSON, no markdown fences, no extra text.
- If the text is ambiguous, make your best guess on the type.
- Keep insights actionable and clinically relevant.
- Preserve the original language of the EMR text in your analysis (if Korean, respond in Korean).`;

export async function analyzeEMR(text: string): Promise<EMRAnalysis> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(
    `Analyze the following EMR text:\n\n${text}`
  );

  const responseText = result.response.text();

  try {
    // Gemini sometimes wraps JSON in markdown fences
    const cleaned = responseText.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    return JSON.parse(cleaned);
  } catch {
    return {
      type: "unknown",
      raw: responseText,
      error: "Failed to parse structured response",
    };
  }
}
