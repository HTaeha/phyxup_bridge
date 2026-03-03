"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  StoreEntry,
  EntryAnalysis,
  EMRAnalysis,
  DiagnosisPrescriptionAnalysis,
  LabResultAnalysis,
} from "@/lib/types";

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

function TypeBadge({ type }: { type?: string }) {
  if (type === "diagnosis_prescription") {
    return <span className="badge dx">진단/처방</span>;
  }
  if (type === "lab_result") {
    return <span className="badge lab">검사결과</span>;
  }
  return <span className="badge unknown">분석중</span>;
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "high" ? "H" : status === "low" ? "L" : "N";
  return <span className={`status-badge ${status}`}>{label}</span>;
}

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
      {analysis.type === "diagnosis_prescription" && (
        <DiagnosisPrescription analysis={analysis} />
      )}
      {analysis.type === "lab_result" && <LabResult analysis={analysis} />}
      {analysis.type === "unknown" && (
        <div className="analysis-error">
          구조화 실패 — 원본 응답: {analysis.raw}
        </div>
      )}
      <InsightsSection insights={"insights" in analysis ? analysis.insights : undefined} />
    </>
  );
}

function EntryCard({ entry }: { entry: StoreEntry }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const type = entry.analysis && "type" in entry.analysis ? entry.analysis.type : undefined;

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
        {showOriginal ? "▾" : "▸"} 원본 텍스트
      </button>

      {showOriginal && (
        <div className="original-text">{entry.text}</div>
      )}

      <AnalysisDisplay analysis={entry.analysis} />
    </div>
  );
}

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
        entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}
