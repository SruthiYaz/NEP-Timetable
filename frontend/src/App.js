import axios from "axios";
import React, { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = 6;

function emptyTimetable() {
  const t = {};
  for (let d of DAYS) t[d] = Array(PERIODS).fill(null);
  return t;
}

export default function App() {
  const [mode, setMode] = useState(""); // upload | manual
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Manual mode states
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    subject: "",
    handler: "",
    room: "",
    type: "academic",
  });
  const [timetable, setTimetable] = useState(emptyTimetable());
  const [violations, setViolations] = useState([]);

  // Upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };

  // Manual inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addEntry = () => {
    if (!form.subject.trim() || !form.handler.trim() || !form.room.trim()) return;
    setEntries((prev) => [
      ...prev,
      {
        id: `${form.subject}_${form.handler}_${form.room}`.replace(/\s+/g, "_"),
        ...form,
      },
    ]);
    setForm({ subject: "", handler: "", room: "", type: "academic" });
  };

  const generate = () => {
    if (entries.length === 0) {
      alert("Please add at least one subject.");
      return;
    }
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
    for (let d of DAYS) {
      for (let p = 0; p < PERIODS; p++) {
        t[d][p] = flatList[index++];
      }
    }
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
      if (!hasWellness)
        issues.push(`No wellness / co-curricular session on ${d}`);
    }
    setViolations(issues);
  };

  const resetAll = () => {
    setEntries([]);
    setTimetable(emptyTimetable());
    setViolations([]);
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <h1 style={{ marginBottom: "20px", color: "#2c3e50" }}>
        NEP 2020 Timetable System
      </h1>

      {/* Home Buttons */}
      {!mode && (
        <div style={{ display: "flex", gap: "20px" }}>
          <button
            onClick={() => setMode("upload")}
            style={{
              background: "#3498db",
              border: "none",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Upload Timetable
          </button>
          <button
            onClick={() => setMode("manual")}
            style={{
              background: "#2ecc71",
              border: "none",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Enter Timetable Manually
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
            background: "#fff",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
            width: "100%",
            maxWidth: "700px",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>Upload Timetable</h2>
          <input type="file" onChange={handleFileUpload} />

          {file && (
            <div style={{ marginTop: "20px" }}>
              <p>File uploaded: {file.name}</p>
              <button
                onClick={async () => {
                  const formData = new FormData();
                  formData.append("timetable", file);
                  setAnalysisResult("Processing... Please wait");

                  try {
                    const res = await axios.post("http://localhost:8080/analyze", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    setAnalysisResult(res.data);
                    console.log("Response:", res.data);
                  } catch (err) {
                    console.error("Upload error:", err);
                    setAnalysisResult({ error: "Error analyzing timetable" });
                  }
                }}
                style={{
                  marginTop: "15px",
                  background: "#3498db",
                  border: "none",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Analyze with CNN
              </button>

              {/* Show analysis result */}
              {analysisResult && (
                <div
                  style={{
                    marginTop: "25px",
                    background: "#f8f9fa",
                    padding: "20px",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "14px",
                    boxShadow: "inset 0 0 6px rgba(0,0,0,0.05)",
                  }}
                >
                  <strong>Extracted Timetable:</strong>

                  {typeof analysisResult === "object" &&
                  Object.keys(analysisResult).some((key) =>
                    ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(
                      key.toLowerCase()
                    )
                  ) ? (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginTop: "15px",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f3f4f6" }}>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              textAlign: "center",
                            }}
                          >
                            Day
                          </th>
                          {Array.from(
                            {
                              length: Math.max(
                                ...Object.values(analysisResult).map(
                                  (periods) => periods.length
                                )
                              ),
                            },
                            (_, i) => (
                              <th
                                key={i}
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                  textAlign: "center",
                                }}
                              >
                                P{i + 1}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analysisResult).map(([day, periods]) => (
                          <tr key={day}>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                fontWeight: "bold",
                                background: "#fafafa",
                              }}
                            >
                              {day}
                            </td>
                            {periods.map((subj, i) => (
                              <td
                                key={i}
                                style={{
                                  border: "1px solid #eee",
                                  padding: "8px",
                                  textAlign: "center",
                                }}
                              >
                                {subj || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre
                      style={{
                        textAlign: "left",
                        marginTop: "10px",
                        color: "#2c3e50",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {typeof analysisResult === "object"
                        ? JSON.stringify(analysisResult, null, 2)
                        : analysisResult}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setMode("");
              setAnalysisResult(null);
              setFile(null);
            }}
            style={{
              marginTop: "20px",
              background: "#e74c3c",
              border: "none",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <div
          style={{
            marginTop: "40px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
            width: "90%",
            maxWidth: "900px",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>
            NEP 2020 Timetable Generator
          </h2>

          <div
            style={{
              background: "#fafafa",
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  flex: "1",
                }}
              />
              <input
                name="handler"
                placeholder="Handler / Teacher"
                value={form.handler}
                onChange={handleChange}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  flex: "1",
                }}
              />
              <input
                name="room"
                placeholder="Room"
                value={form.room}
                onChange={handleChange}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  flex: "1",
                }}
              />
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              >
                <option value="academic">Academic</option>
                <option value="wellness">Wellness / PE / Art</option>
                <option value="elective">Elective / Project</option>
              </select>
              <button
                onClick={addEntry}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>

            {entries.length > 0 && (
              <ul style={{ marginTop: 12 }}>
                {entries.map((e) => (
                  <li key={e.id}>
                    {e.subject} — {e.handler} — {e.room} ({e.type})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              onClick={generate}
              style={{
                flex: 1,
                padding: 12,
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Generate Timetable
            </button>
            <button
              onClick={resetAll}
              style={{
                flex: 1,
                padding: 12,
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "center",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th>Day</th>
                  {[...Array(PERIODS)].map((_, i) => (
                    <th key={i}>P{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d}>
                    <td style={{ fontWeight: 600, background: "#fafafa" }}>{d}</td>
                    {timetable[d].map((s, p) => (
                      <td key={p} style={{ border: "1px solid #eee", padding: 8 }}>
                        {s ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{s.subject}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>{s.handler}</div>
                            <div style={{ fontSize: 11, color: "#777" }}>
                              {s.room} · {s.type}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>NEP Compliance</h3>
            {violations.length === 0 ? (
              <div style={{ color: "#10b981" }}>All NEP conditions satisfied ✅</div>
            ) : (
              <ul style={{ color: "#b45309" }}>
                {violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => setMode("")}
            style={{
              marginTop: "20px",
              background: "#e74c3c",
              border: "none",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
