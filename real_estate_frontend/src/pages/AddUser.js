import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AddUser() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("buyer");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/add_user", {
        username,
        email,
        role
      });
      alert("✅ User added successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error adding user:", error);
      const msg = error?.response?.data?.detail || "Check console for details.";
      alert("❌ Error adding user: " + msg);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add User</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />{" "}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />{" "}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="buyer">buyer</option>
          <option value="agent">agent</option>
          <option value="admin">admin</option>
        </select>{" "}
        <button type="submit">Add User</button>
      </form>
    </div>
  );
}

export default AddUser;
