import React, { useState } from "react";
import axios from "axios";

function PlsqlFeatures() {
  const baseURL = "http://127.0.0.1:8000";
  const [selectedFeature, setSelectedFeature] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [output, setOutput] = useState("");

  const features = [
    { name: "calc_total_sales", label: "💰 Calculate Total Sales (Procedure)", inputLabel: "Agent ID" },
    { name: "get_total_commission", label: "🏦 Get Total Commission (Function)", inputLabel: "Agent ID" },
    { name: "available_properties", label: "🏘️ Available Properties by City (Cursor)", inputLabel: "City" },
    { name: "check_property", label: "📊 Check Property Price (Exception Handling)", inputLabel: "Property ID" },
  ];

  const handleRunFeature = async () => {
    if (!selectedFeature) return alert("Please select a PL/SQL feature first.");

    try {
      let url = "";
      switch (selectedFeature) {
        case "calc_total_sales":
          url = `${baseURL}/calc_total_sales/${inputValue}`;
          break;
        case "get_total_commission":
          url = `${baseURL}/get_total_commission/${inputValue}`;
          break;
        case "available_properties":
          url = `${baseURL}/available_properties/${inputValue}`;
          break;
        case "check_property":
          url = `${baseURL}/check_property/${inputValue}`;
          break;
        default:
          return alert("Invalid feature selected.");
      }

      const res = await axios.get(url);
      setOutput(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error("Error running PL/SQL feature:", err);
      setOutput("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>⚙️ Run PL/SQL Features</h2>

        <div style={styles.form}>
          <select
            value={selectedFeature}
            onChange={(e) => {
              setSelectedFeature(e.target.value);
              setInputValue("");
              setOutput("");
            }}
            style={styles.select}
          >
            <option value="">-- Select a Feature --</option>
            {features.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>

          {selectedFeature && (
            <input
              style={styles.input}
              type="text"
              placeholder={
                features.find((f) => f.name === selectedFeature)?.inputLabel || "Enter value"
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}

          <button onClick={handleRunFeature} style={styles.runBtn}>
            ▶ Run Feature
          </button>
        </div>

        {output && (
          <div style={styles.outputBox}>
            <h3>🧾 Output:</h3>
            <pre style={styles.pre}>{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "30px",
  },
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    width: "80%",
    maxWidth: "700px",
  },
  heading: {
    textAlign: "center",
    color: "#5f27cd",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "20px",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    flex: "1 1 220px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    flex: "1 1 180px",
  },
  runBtn: {
    background: "#10ac84",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  outputBox: {
    background: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #eee",
    marginTop: "20px",
  },
  pre: {
    background: "#f1f2f6",
    padding: "10px",
    borderRadius: "8px",
    whiteSpace: "pre-wrap",
  },
};

export default PlsqlFeatures;
