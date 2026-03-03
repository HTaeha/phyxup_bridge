"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  StoreEntry,
  EntryAnalysis,
  EMRAnalysis,
  DiagnosisPrescriptionAnalysis,
  LabResultAnalysis,
  ImagingReportAnalysis,
  OperativeNoteAnalysis,
  ProgressNoteAnalysis,
  DischargeSummaryAnalysis,
} from "@/lib/types";

// ── Helpers ──

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateShort(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── Badges ──

const BADGE_MAP: Record<string, { cls: string; label: string }> = {
  diagnosis_prescription: { cls: "dx", label: "진단/처방" },
  lab_result: { cls: "lab", label: "검사결과" },
  imaging_report: { cls: "imaging", label: "영상검사" },
  operative_note: { cls: "operative", label: "수술기록" },
  progress_note: { cls: "progress", label: "경과기록" },
  discharge_summary: { cls: "discharge", label: "퇴원요약" },
};

function TypeBadge({ type }: { type?: string }) {
  const info = type ? BADGE_MAP[type] : undefined;
  if (info) {
    return <span className={`badge ${info.cls}`}>{info.label}</span>;
  }
  return <span className="badge unknown">분석중</span>;
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "high" ? "H" : status === "low" ? "L" : "N";
  return <span className={`status-badge ${status}`}>{label}</span>;
}

// ── Summary Section ──

function SummarySection({ summary }: { summary?: string }) {
  if (!summary) return null;
  return <div className="analysis-summary">{summary}</div>;
}

// ── Existing renderers ──

function DiagnosisPrescription({ analysis }: { analysis: DiagnosisPrescriptionAnalysis }) {
  return (
    <>
      {analysis.diagnosis?.length > 0 && (
        <div className="analysis-section">
          <h3>진단</h3>
          <ul className="diagnosis-list">
            {analysis.diagnosis.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.prescriptions?.length > 0 && (
        <div className="analysis-section">
          <h3>처방</h3>
          <table className="rx-table">
            <thead>
              <tr>
                <th>약물</th>
                <th>용량</th>
                <th>복용법</th>
                <th>기간</th>
              </tr>
            </thead>
            <tbody>
              {analysis.prescriptions.map((rx, i) => (
                <tr key={i}>
                  <td>{rx.drug}</td>
                  <td>{rx.dose}</td>
                  <td>{rx.frequency}</td>
                  <td>{rx.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysis.notes && (
        <div className="analysis-section">
          <h3>소견</h3>
          <div className="notes">{analysis.notes}</div>
        </div>
      )}
    </>
  );
}

function LabResult({ analysis }: { analysis: LabResultAnalysis }) {
  return (
    <>
      {analysis.tests?.length > 0 && (
        <div className="analysis-section">
          <h3>검사 항목</h3>
          <table className="lab-table">
            <thead>
              <tr>
                <th>검사명</th>
                <th>수치</th>
                <th>단위</th>
                <th>정상범위</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {analysis.tests.map((t, i) => (
                <tr key={i}>
                  <td>{t.name}</td>
                  <td><strong>{t.value}</strong></td>
                  <td>{t.unit}</td>
                  <td>{t.range}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysis.summary && (
        <div className="analysis-section">
          <h3>종합 소견</h3>
          <div className="summary">{analysis.summary}</div>
        </div>
      )}
    </>
  );
}

// ── New renderers ──

function ImagingReport({ analysis }: { analysis: ImagingReportAnalysis }) {
  return (
    <>
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">검사종류</div>
          <div className="detail-value">{analysis.modality}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">검사부위</div>
          <div className="detail-value">{analysis.bodyPart}</div>
        </div>
      </div>

      {analysis.findings?.length > 0 && (
        <div className="analysis-section">
          <h3>소견</h3>
          <ul className="findings-list">
            {analysis.findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.impression && (
        <div className="analysis-section">
          <h3>판독 결론</h3>
          <div className="notes">{analysis.impression}</div>
        </div>
      )}
    </>
  );
}

function OperativeNote({ analysis }: { analysis: OperativeNoteAnalysis }) {
  return (
    <>
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">수술명</div>
          <div className="detail-value">{analysis.procedure}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">집도의</div>
          <div className="detail-value">{analysis.surgeon || "-"}</div>
        </div>
      </div>

      {analysis.findings && (
        <div className="analysis-section">
          <h3>수술 소견</h3>
          <div className="notes">{analysis.findings}</div>
        </div>
      )}

      <div className="analysis-section">
        <h3>합병증</h3>
        <div className="notes">{analysis.complications || "없음"}</div>
      </div>
    </>
  );
}

function ProgressNote({ analysis }: { analysis: ProgressNoteAnalysis }) {
  return (
    <>
      {analysis.chiefComplaint && (
        <div className="analysis-section">
          <h3>주소</h3>
          <div className="notes">{analysis.chiefComplaint}</div>
        </div>
      )}

      {analysis.assessment && (
        <div className="analysis-section">
          <h3>평가</h3>
          <div className="notes">{analysis.assessment}</div>
        </div>
      )}

      {analysis.plan && (
        <div className="analysis-section">
          <h3>계획</h3>
          <div className="notes">{analysis.plan}</div>
        </div>
      )}
    </>
  );
}

function DischargeSummary({ analysis }: { analysis: DischargeSummaryAnalysis }) {
  return (
    <>
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">입원시 진단</div>
          <div className="detail-value">{analysis.admissionDiagnosis}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">퇴원시 진단</div>
          <div className="detail-value">{analysis.dischargeDiagnosis}</div>
        </div>
      </div>

      {analysis.procedures?.length > 0 && (
        <div className="analysis-section">
          <h3>시술/수술</h3>
          <ul className="findings-list">
            {analysis.procedures.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.instructions && (
        <div className="analysis-section">
          <h3>퇴원 지시</h3>
          <div className="notes">{analysis.instructions}</div>
        </div>
      )}
    </>
  );
}

// ── Insights ──

function InsightsSection({ insights }: { insights?: string[] }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="insights">
      <h3>Insights</h3>
      <ul>
        {insights.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Lab Trend Panel ──

interface TrendDataPoint {
  value: string;
  numericValue: number;
  status: string;
  timestamp: number;
}

interface TrendGroup {
  name: string;
  unit: string;
  points: TrendDataPoint[];
  direction: "improving" | "worsening" | "stable";
}

function computeTrends(entries: StoreEntry[]): TrendGroup[] {
  const grouped: Record<string, TrendDataPoint[]> = {};
  const units: Record<string, string> = {};

  for (const entry of entries) {
    if (
      !entry.analysis ||
      !("type" in entry.analysis) ||
      entry.analysis.type !== "lab_result"
    )
      continue;

    for (const test of entry.analysis.tests ?? []) {
      const num = parseFloat(test.value);
      if (isNaN(num)) continue;

      if (!grouped[test.name]) grouped[test.name] = [];
      units[test.name] = test.unit;
      grouped[test.name].push({
        value: test.value,
        numericValue: num,
        status: test.status,
        timestamp: entry.timestamp,
      });
    }
  }

  const trends: TrendGroup[] = [];

  for (const [name, points] of Object.entries(grouped)) {
    if (points.length < 2) continue;

    // Sort chronologically (oldest first)
    points.sort((a, b) => a.timestamp - b.timestamp);

    // Determine direction based on last two values and their status
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    let direction: TrendGroup["direction"] = "stable";

    if (last.status === "normal" && prev.status !== "normal") {
      direction = "improving";
    } else if (last.status !== "normal" && prev.status === "normal") {
      direction = "worsening";
    } else if (last.status !== "normal" && prev.status !== "normal") {
      // Both abnormal — check if moving toward normal
      const diff = Math.abs(last.numericValue - prev.numericValue);
      if (diff > 0.01) {
        // If the absolute value decreased or status changed to less severe
        if (last.status === prev.status) {
          direction = "stable";
        } else {
          direction = last.status === "normal" ? "improving" : "worsening";
        }
      }
    }

    trends.push({ name, unit: units[name], points, direction });
  }

  return trends;
}

const DIRECTION_LABELS: Record<string, string> = {
  improving: "개선",
  worsening: "악화",
  stable: "안정",
};

function LabTrendPanel({ entries }: { entries: StoreEntry[] }) {
  const trends = computeTrends(entries);
  if (trends.length === 0) return null;

  return (
    <div className="trend-panel">
      <h2>검사 수치 트렌드</h2>
      {trends.map((trend) => (
        <div key={trend.name} className="trend-item">
          <div className="trend-item-header">
            <span className="trend-item-name">
              {trend.name} ({trend.unit})
            </span>
            <span className={`direction ${trend.direction}`}>
              {DIRECTION_LABELS[trend.direction]}
            </span>
          </div>
          <div className="trend-sparkline">
            {trend.points.map((pt, i) => (
              <span key={i} className="trend-point">
                <span className={`trend-value status-badge ${pt.status}`}>
                  {pt.value}
                </span>
                <span className="trend-date">
                  {formatDateShort(pt.timestamp)}
                </span>
                {i < trend.points.length - 1 && (
                  <span className="trend-arrow">&rarr;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chat Section ──

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatSection({ entry }: { entry: StoreEntry }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const hasValidAnalysis =
    entry.analysis &&
    "type" in entry.analysis &&
    entry.analysis.type !== "unknown";

  if (!hasValidAnalysis) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/bridge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id, question }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "응답 실패" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-section">
      <h3>Follow-up 질문</h3>

      {messages.length > 0 && (
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="spinner" /> 답변 생성 중...
            </div>
          )}
        </div>
      )}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="이 분석 결과에 대해 질문하세요..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          전송
        </button>
      </form>
    </div>
  );
}

// ── Analysis Display (router) ──

function getSummary(analysis: EMRAnalysis): string | undefined {
  if ("summary" in analysis) return analysis.summary;
  return undefined;
}

function AnalysisDisplay({ analysis }: { analysis: EntryAnalysis }) {
  if (!analysis) {
    return (
      <div className="analysis-loading">
        <div className="spinner" />
        분석 대기중...
      </div>
    );
  }

  if (!("type" in analysis)) {
    return <div className="analysis-error">분석 실패: {analysis.error}</div>;
  }

  return (
    <>
      <SummarySection summary={getSummary(analysis)} />

      {analysis.type === "diagnosis_prescription" && (
        <DiagnosisPrescription analysis={analysis} />
      )}
      {analysis.type === "lab_result" && <LabResult analysis={analysis} />}
      {analysis.type === "imaging_report" && (
        <ImagingReport analysis={analysis} />
      )}
      {analysis.type === "operative_note" && (
        <OperativeNote analysis={analysis} />
      )}
      {analysis.type === "progress_note" && (
        <ProgressNote analysis={analysis} />
      )}
      {analysis.type === "discharge_summary" && (
        <DischargeSummary analysis={analysis} />
      )}
      {analysis.type === "unknown" && (
        <div className="analysis-error">
          구조화 실패 — 원본 응답: {analysis.raw}
        </div>
      )}

      <InsightsSection
        insights={"insights" in analysis ? analysis.insights : undefined}
      />
    </>
  );
}

// ── Entry Card ──

function EntryCard({ entry }: { entry: StoreEntry }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const type =
    entry.analysis && "type" in entry.analysis
      ? entry.analysis.type
      : undefined;

  return (
    <div className="entry-card">
      <div className="entry-header">
        <TypeBadge type={type} />
        <span className="timestamp">{formatTime(entry.timestamp)}</span>
      </div>

      <button
        className="original-toggle"
        onClick={() => setShowOriginal(!showOriginal)}
      >
        {showOriginal ? "\u25BE" : "\u25B8"} 원본 텍스트
      </button>

      {showOriginal && (
        <div className="original-text">{entry.text}</div>
      )}

      <AnalysisDisplay analysis={entry.analysis} />
      <ChatSection entry={entry} />
    </div>
  );
}

// ── Page ──

export default function Home() {
  const [entries, setEntries] = useState<StoreEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/bridge");
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } catch {
      // silently retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 3000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  return (
    <div className="dashboard">
      <div className="header">
        <div className="dot" />
        <h1>PhyxUp Bridge</h1>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>📋</p>
          <p>
            크롬 익스텐션에서 EMR 텍스트를 드래그하여 전송하세요
          </p>
        </div>
      ) : (
        <>
          <LabTrendPanel entries={entries} />
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </>
      )}
    </div>
  );
}
