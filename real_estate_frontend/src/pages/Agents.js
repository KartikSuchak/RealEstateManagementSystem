import React, { useEffect, useState } from "react";
import axios from "axios";

function Agents() {
  const [agents, setAgents] = useState([]);
  const [username, setUsername] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [region, setRegion] = useState("");
  const [editingAgentId, setEditingAgentId] = useState(null);
  const baseURL = "http://127.0.0.1:8000";

  useEffect(() => {
    axios
      .get(`${baseURL}/agents`)
      .then((res) => setAgents(res.data.agents || []))
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingAgentId) {
        await axios.put(`${baseURL}/update_agent/${editingAgentId}`, {
          username,
          license_no: licenseNo,
          region,
        });
        alert("✅ Agent updated successfully!");
        setEditingAgentId(null);
      } else {
        await axios.post(`${baseURL}/add_agent`, {
          username,
          license_no: licenseNo,
          region,
        });
        alert("✅ Agent added successfully!");
      }
      setUsername("");
      setLicenseNo("");
      setRegion("");
      const res = await axios.get(`${baseURL}/agents`);
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error("Error:", err);
      alert("❌ Something went wrong. Check console.");
    }
  };

  const handleEdit = (a) => {
    setEditingAgentId(a.agent_id);
    setUsername(a.username);
    setLicenseNo(a.license_no);
    setRegion(a.region);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this agent?")) return;
    try {
      await axios.delete(`${baseURL}/delete_agent/${id}`);
      alert("🗑️ Agent deleted successfully!");
      const res = await axios.get(`${baseURL}/agents`);
      setAgents(res.data.agents || []);
    } catch {
      alert("❌ Error deleting agent.");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>🏢 Manage Agents</h2>

      <form onSubmit={handleAddOrUpdate} style={styles.form}>
        <input style={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input style={styles.input} placeholder="License No" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} required />
        <input style={styles.input} placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} required />
        <button style={styles.addBtn}>{editingAgentId ? "Update Agent" : "Add Agent"}</button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>Username</th>
            <th>License No</th>
            <th>Region</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.agent_id}>
              <td>{a.agent_id}</td>
              <td>{a.username}</td>
              <td>{a.license_no}</td>
              <td>{a.region}</td>
              <td>
                <button style={styles.editBtn} onClick={() => handleEdit(a)}>✏️ Edit</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(a.agent_id)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: { background: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
  heading: { textAlign: "center", color: "#5f27cd", marginBottom: "20px" },
  form: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", flex: 1 },
  addBtn: { background: "#10ac84", color: "white", border: "none", borderRadius: "8px", padding: "10px 15px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  editBtn: { background: "#ffeaa7", border: "none", padding: "6px 10px", marginRight: "5px", borderRadius: "6px", cursor: "pointer" },
  deleteBtn: { background: "#ff7675", border: "none", padding: "6px 10px", color: "white", borderRadius: "6px", cursor: "pointer" },
};

export default Agents;
