import React, { useEffect, useState } from "react";
import axios from "axios";

function Agents() {
  const [agents, setAgents] = useState([]);
  const [username, setUsername] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/agents")
      .then((res) => setAgents(res.data.agents || []))
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  const handleAddAgent = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/add_agent", {
        username,
        license_no: licenseNo,
        region,
      });
      alert("✅ Agent added successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error adding agent:", err);
      alert("❌ Error adding agent. Check console.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏢 Manage Agents</h2>
      <div>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="License No"
          value={licenseNo}
          onChange={(e) => setLicenseNo(e.target.value)}
        />
        <input
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <button onClick={handleAddAgent}>Add Agent</button>
      </div>

      <table border="1" cellPadding="10" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>Username</th>
            <th>License No</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.agent_id}>
              <td>{a.agent_id}</td>
              <td>{a.username}</td>
              <td>{a.license_no}</td>
              <td>{a.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Agents;
