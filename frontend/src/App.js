import React, { useState } from "react";
import * as Papa from "papaparse";
import * as tf from "@tensorflow/tfjs";
import { model } from "./model/ai.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = 6;

function emptyTimetable() {
  const t = {};
  for (let d of DAYS) t[d] = Array(PERIODS).fill(null);
  return t;
}

export default function App() {
  const [mode, setMode] = useState("");
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ subject: "", handler: "", room: "", type: "academic" });
  const [timetable, setTimetable] = useState(emptyTimetable());
  const [violations, setViolations] = useState([]);

  const handleCSVUpload = (e) => {
    const f = e.target.files[0];
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setTableData(res.data),
    });
  };

  const analyzeAI = async () => {
    if (!tableData.length) return;
    setLoading(true);
    setAnalysis(null);
    await new Promise((r) => setTimeout(r, 6000));

    const encoded = tableData.flatMap((row) =>
      Object.values(row)
        .slice(1)
        .map((val) => (val === "Free" ? 0 : val === "PE" ? 0.5 : 1))
    );
    const input = tf.tensor2d([encoded.slice(0, 30)]);
    const prediction = model.predict(input);
    const score = (await prediction.data())[0] * 100;

    const issues = [];
    tableData.forEach((r) => {
      const subjects = Object.values(r).slice(1);
      const academics = subjects.filter((s) => s !== "PE" && s !== "Art" && s !== "Free");
      if (academics.length > 4) issues.push(`${r.Day}: Too many academic periods`);
      if (!subjects.includes("PE") && !subjects.includes("Art"))
        issues.push(`${r.Day}: Missing wellness/art session`);
    });

    setAnalysis({
      score: score.toFixed(2),
      compliance:
        score > 85 ? "Excellent compliance" : score > 65 ? "Moderate compliance" : "Needs restructuring",
      issues,
    });
    setLoading(false);
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const addEntry = () => {
    if (!form.subject.trim() || !form.handler.trim() || !form.room.trim()) return;
    setEntries((prev) => [...prev, { id: `${form.subject}_${form.handler}_${form.room}`.replace(/\s+/g, "_"), ...form }]);
    setForm({ subject: "", handler: "", room: "", type: "academic" });
  };

  const generate = () => {
    if (entries.length === 0) return;
    const totalSlots = DAYS.length * PERIODS;
    const t = emptyTimetable();
    const flatList = [];
    let i = 0;
    while (flatList.length < totalSlots) {
      flatList.push(entries[i % entries.length]);
      i++;
    }
    for (let j = flatList.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [flatList[j], flatList[k]] = [flatList[k], flatList[j]];
    }
    let index = 0;
    for (let d of DAYS) for (let p = 0; p < PERIODS; p++) t[d][p] = flatList[index++];
    setTimetable(t);
    checkNEP(t);
  };

  const checkNEP = (t) => {
    const issues = [];
    for (let d of DAYS) {
      let consecutive = 0;
      let hasWellness = false;
      for (let p = 0; p < PERIODS; p++) {
        const s = t[d][p];
        if (!s) continue;
        if (s.type === "academic") {
          consecutive++;
          if (consecutive > 4) issues.push(`More than 4 academic classes in a row on ${d}`);
        } else {
          consecutive = 0;
          hasWellness = true;
        }
      }
      if (!hasWellness) issues.push(`No wellness / co-curricular session on ${d}`);
    }
    setViolations(issues);
  };

  const resetAll = () => {
    setMode("");
    setFile(null);
    setTableData([]);
    setAnalysis(null);
    setEntries([]);
    setTimetable(emptyTimetable());
    setViolations([]);
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        background: "linear-gradient(to bottom right, #e0f2fe, #f0fdf4)",
        minHeight: "100vh",
        padding: "40px",
        textAlign: "center",
        transition: "all 0.4s ease",
      }}
    >
      <header style={{ marginBottom: "50px", animation: "fadeIn 0.6s ease-in" }}>
        <h1 style={{ color: "#0f172a", fontSize: "2.8rem", marginBottom: "10px" }}>
          🌿 <span style={{ color: "#2563eb" }}>EduSchedu AI</span>
        </h1>
        <p style={{ color: "#475569", maxWidth: "750px", margin: "auto", lineHeight: "1.6" }}>
          A Smart NEP 2020 Compliant Timetable Analyzer — powered by AI to balance academics,
          creativity, and wellness in modern education.
        </p>

        <div
          style={{
            marginTop: "25px",
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
            display: "inline-block",
            maxWidth: "750px",
            animation: "slideUp 0.6s ease",
          }}
        >
          <h3 style={{ color: "#1e3a8a" }}>💡 What is EduSchedu?</h3>
          <p style={{ fontSize: "15px", color: "#334155" }}>
            EduSchedu helps institutions evaluate the effectiveness of their timetables by analyzing
            patterns in academic workload, co-curricular integration, and NEP 2020 compliance.  
            The system aims to create <b>holistic learning experiences</b> by balancing cognitive
            and creative sessions.
          </p>
        </div>
        <div style={{ marginTop: "20px" }}>
          <a
            href="https://www.education.gov.in/nep2020/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            📘 Learn more about NEP 2020 ↗
          </a>
        </div>
      </header>

      {!mode && (
        <div style={{ marginTop: 50, animation: "fadeIn 0.5s ease" }}>
          <button
            onClick={() => setMode("upload")}
            style={{
              background: "linear-gradient(90deg, #2563eb, #3b82f6)",
              color: "#fff",
              border: "none",
              padding: "16px 32px",
              borderRadius: "12px",
              cursor: "pointer",
              marginRight: 25,
              fontSize: "17px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            📤 Upload Timetable (CSV)
          </button>
          <button
            onClick={() => setMode("manual")}
            style={{
              background: "linear-gradient(90deg, #059669, #34d399)",
              color: "#fff",
              border: "none",
              padding: "16px 32px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "17px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ✏️ Enter Timetable Manually
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <div
          style={{
            marginTop: 40,
            background: "#fff",
            padding: 35,
            borderRadius: 16,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            width: "95%",
            maxWidth: "900px",
            marginInline: "auto",
            transition: "all 0.3s ease",
          }}
        >
          <h2 style={{ color: "#1e3a8a", marginBottom: "20px" }}>📘 Upload Your Timetable</h2>
          <input type="file" accept=".csv" onChange={handleCSVUpload} />
          {tableData.length > 0 && (
            <>
              <h3 style={{ marginTop: 25 }}>🗓 Preview of Uploaded Timetable</h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 15,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <thead style={{ background: "#e0f2fe" }}>
                  <tr>
                    {Object.keys(tableData[0]).map((k) => (
                      <th key={k} style={{ border: "1px solid #ccc", padding: "10px", fontWeight: 600 }}>
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td
                          key={j}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                            textAlign: "center",
                            background: i % 2 === 0 ? "#f9fafb" : "#fff",
                          }}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={analyzeAI}
                disabled={loading}
                style={{
                  marginTop: 25,
                  background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 28px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "16px",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
                }}
              >
                {loading ? "🤖 AI Analyzing..." : "🔍 Analyze with EduSchedu AI"}
              </button>

              {analysis && (
                <div
                  style={{
                    marginTop: 30,
                    background: "#f0f9ff",
                    padding: 25,
                    borderRadius: 12,
                    textAlign: "left",
                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3 style={{ color: "#0f172a" }}>AI Analysis Report</h3>
                  <p><strong>Predicted Compliance Score:</strong> {analysis.score}%</p>
                  <p><strong>Assessment:</strong> {analysis.compliance}</p>
                  {analysis.issues.length > 0 ? (
                    <>
                      <strong>⚠️ Detected Issues:</strong>
                      <ul>{analysis.issues.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
                    </>
                  ) : (
                    <p>All NEP 2020 guidelines satisfied ✅</p>
                  )}
                </div>
              )}
            </>
          )}

          <button
            onClick={resetAll}
            style={{
              marginTop: 25,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "12px 22px",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
            }}
          >
            🔙 Back
          </button>
        </div>
      )}

      <footer style={{ marginTop: 70, color: "#6b7280", fontSize: "14px" }}>
        <hr style={{ marginBottom: 20, borderColor: "#ddd" }} />
        <p>
          © 2025 <strong>EduSchedu AI</strong> — Empowering education through smart analytics.
          <br />
          <a
            href="https://www.education.gov.in/nep2020/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#2563eb", textDecoration: "none" }}
          >
            NEP 2020 Official Site ↗
          </a>
        </p>
      </footer>
    </div>
  );
}
