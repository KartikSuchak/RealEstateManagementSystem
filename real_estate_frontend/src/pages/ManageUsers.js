import React, { useEffect, useState } from "react";
import axios from "axios";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("buyer");
  const [editingUserId, setEditingUserId] = useState(null);

  const baseURL = "http://127.0.0.1:8000";

  useEffect(() => {
    axios.get(`${baseURL}/users`).then((res) => setUsers(res.data.users || []));
  }, []);

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await axios.put(`${baseURL}/update_user/${editingUserId}`, { username, email, role });
        alert("✅ User updated successfully!");
        setEditingUserId(null);
      } else {
        await axios.post(`${baseURL}/add_user`, { username, email, role });
        alert("✅ User added successfully!");
      }
      setUsername("");
      setEmail("");
      setRole("buyer");
      const res = await axios.get(`${baseURL}/users`);
      setUsers(res.data.users || []);
    } catch (error) {
      alert("❌ Error adding/updating user. Check console.");
    }
  };

  const handleEdit = (u) => {
    setEditingUserId(u.user_id);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${baseURL}/delete_user/${id}`);
      alert("🗑️ Deleted successfully!");
      const res = await axios.get(`${baseURL}/users`);
      setUsers(res.data.users || []);
    } catch {
      alert("❌ Error deleting user.");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>👤 Manage Users</h2>

      <form onSubmit={handleAddOrUpdateUser} style={styles.form}>
        <input style={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input style={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <select style={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="buyer">Buyer</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        <button style={styles.addBtn}>{editingUserId ? "Update" : "Add User"}</button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button style={styles.editBtn} onClick={() => handleEdit(u)}>✏️ Edit</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(u.user_id)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },
  heading: { textAlign: "center", color: "#5f27cd", marginBottom: "20px" },
  form: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    flex: 1,
  },
  select: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd" },
  addBtn: {
    background: "#10ac84",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  editBtn: {
    background: "#ffeaa7",
    border: "none",
    padding: "6px 10px",
    marginRight: "5px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#ff7675",
    border: "none",
    padding: "6px 10px",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default ManageUsers;
