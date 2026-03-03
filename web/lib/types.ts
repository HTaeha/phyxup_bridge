// ── Prescription & Lab ──

export interface Prescription {
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface LabTest {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: "normal" | "high" | "low";
}

// ── EMR Analysis (discriminated union) ──

export interface DiagnosisPrescriptionAnalysis {
  type: "diagnosis_prescription";
  diagnosis: string[];
  prescriptions: Prescription[];
  notes: string;
  insights: string[];
}

export interface LabResultAnalysis {
  type: "lab_result";
  tests: LabTest[];
  summary: string;
  insights: string[];
}

export interface UnknownAnalysis {
  type: "unknown";
  raw: string;
  error: string;
}

export type EMRAnalysis =
  | DiagnosisPrescriptionAnalysis
  | LabResultAnalysis
  | UnknownAnalysis;

// ── Error wrapper (API call failure) ──

export interface AnalysisError {
  error: string;
}

export type EntryAnalysis = EMRAnalysis | AnalysisError | null;

// ── Store ──

export interface StoreEntry {
  id: number;
  text: string;
  timestamp: number;
  analysis: EntryAnalysis;
}

// ── API responses ──

export interface BridgePostResponse {
  ok: true;
  entry: StoreEntry;
}

export interface BridgeGetResponse {
  entries: StoreEntry[];
}

export interface BridgeErrorResponse {
  error: string;
}
