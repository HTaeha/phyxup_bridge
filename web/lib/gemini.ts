import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EMRAnalysis } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a medical EMR (Electronic Medical Record) text analyzer.
Given raw EMR text, you must:

1. Detect the type of the text:
   - "diagnosis_prescription" if it contains diagnosis and/or prescription information
   - "lab_result" if it contains laboratory test results
   - "imaging_report" if it contains radiology or imaging study results (CT, MRI, X-ray, ultrasound, etc.)
   - "operative_note" if it contains surgical/operative procedure records
   - "progress_note" if it contains clinical progress notes (SOAP notes, daily notes, etc.)
   - "discharge_summary" if it contains hospital discharge summaries

2. Return a structured JSON based on the detected type.

For "diagnosis_prescription" type, return:
{
  "type": "diagnosis_prescription",
  "diagnosis": ["Primary diagnosis", ...],
  "prescriptions": [
    { "drug": "Drug name", "dose": "Dosage", "frequency": "How to take", "duration": "Duration" }
  ],
  "notes": "Additional remarks",
  "summary": "1-2 sentence summary of the diagnosis and treatment plan",
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

For "imaging_report" type, return:
{
  "type": "imaging_report",
  "modality": "CT|MRI|X-ray|Ultrasound|etc.",
  "bodyPart": "Body part examined",
  "findings": ["Finding 1", "Finding 2", ...],
  "impression": "Radiologist's impression/conclusion",
  "summary": "1-2 sentence summary of the imaging study results",
  "insights": ["Clinical significance", "Recommended follow-up", ...]
}

For "operative_note" type, return:
{
  "type": "operative_note",
  "procedure": "Name of the surgical procedure",
  "surgeon": "Surgeon name (if mentioned)",
  "findings": "Intraoperative findings",
  "complications": "Any complications (or 'None')",
  "summary": "1-2 sentence summary of the operation and outcome",
  "insights": ["Post-operative considerations", "Recovery notes", ...]
}

For "progress_note" type, return:
{
  "type": "progress_note",
  "chiefComplaint": "Patient's chief complaint",
  "assessment": "Clinical assessment",
  "plan": "Treatment plan",
  "summary": "1-2 sentence summary of the patient's current status and plan",
  "insights": ["Key observations", "Follow-up recommendations", ...]
}

For "discharge_summary" type, return:
{
  "type": "discharge_summary",
  "admissionDiagnosis": "Diagnosis at admission",
  "dischargeDiagnosis": "Diagnosis at discharge",
  "procedures": ["Procedure 1", "Procedure 2", ...],
  "instructions": "Discharge instructions for the patient",
  "summary": "1-2 sentence summary of the hospital stay and discharge plan",
  "insights": ["Important follow-up items", "Medication changes", ...]
}

IMPORTANT:
- Respond ONLY with valid JSON, no markdown fences, no extra text.
- If the text is ambiguous, make your best guess on the type.
- ALWAYS include a summary field with a concise 1-2 sentence overview.
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

const CHAT_SYSTEM_PROMPT = `You are a helpful medical assistant that answers follow-up questions about EMR analysis results.
You will receive the original EMR text, its structured analysis, and a user question.
Answer in a conversational, clear tone. Be concise but thorough.
Preserve the language of the original EMR text (if Korean, respond in Korean).
Do NOT return JSON — respond in plain natural language.`;

export async function chatAboutEntry(
  originalText: string,
  analysis: string,
  question: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: CHAT_SYSTEM_PROMPT,
  });

  const prompt = `Original EMR text:
${originalText}

Structured analysis:
${analysis}

User question:
${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
