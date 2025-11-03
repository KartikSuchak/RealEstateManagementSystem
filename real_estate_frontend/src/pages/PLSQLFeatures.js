import React, { useState } from "react";
import axios from "axios";

function PLSQLFeatures() {
  const [agentId, setAgentId] = useState("");
  const [city, setCity] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const baseURL = "http://127.0.0.1:8000";

  const handleApiCall = async (endpoint) => {
    try {
      setError(null);
      setResult(null);
      const res = await axios.get(`${baseURL}${endpoint}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Unexpected error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>⚙️ PL/SQL & Database Features</h2>
      <p>Interact with Oracle procedures, functions, and cursors.</p>

      <div style={{ marginBottom: "20px" }}>
        <h3>1️⃣ Calculate Total Sales by Agent (Procedure)</h3>
        <input
          type="number"
          placeholder="Enter Agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        />
        <button
          onClick={() => handleApiCall(`/calc_total_sales/${agentId}`)}
          disabled={!agentId}
        >
          Execute Procedure
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>2️⃣ Get Total Unpaid Commission (Function)</h3>
        <input
          type="number"
          placeholder="Enter Agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        />
        <button
          onClick={() => handleApiCall(`/get_total_commission/${agentId}`)}
          disabled={!agentId}
        >
          Get Commission
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>3️⃣ Show Available Properties by City (Cursor)</h3>
        <input
          type="text"
          placeholder="Enter City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={() => handleApiCall(`/available_properties/${city}`)}
          disabled={!city}
        >
          Show Properties
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>4️⃣ Check Property Price (Exception Handling)</h3>
        <input
          type="number"
          placeholder="Enter Property ID"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        />
        <button
          onClick={() => handleApiCall(`/check_property/${propertyId}`)}
          disabled={!propertyId}
        >
          Check Property
        </button>
      </div>

      <hr />

      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>✅ Result:</h3>
          <pre style={{ background: "#f4f4f4", padding: "10px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default PLSQLFeatures;
