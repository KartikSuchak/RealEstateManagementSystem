import React, { useEffect, useState } from "react";
import axios from "axios";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("buyer");

  // ✅ Fetch users from backend
  const fetchUsers = () => {
    axios
      .get("http://127.0.0.1:8000/users")
      .then((response) => {
        setUsers(response.data.users || []);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Handle new user add
  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://127.0.0.1:8000/add_user", {
        username,
        email,
        role,
      });
      alert("✅ User added successfully!");
      setUsername("");
      setEmail("");
      setRole("buyer");
      fetchUsers(); // refresh table
    } catch (error) {
      console.error("Error adding user:", error);
      alert("❌ Error adding user. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👤 Manage Users</h2>

      {/* ➕ Add User Form */}
      <form onSubmit={handleAddUser} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="buyer">Buyer</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Add User</button>
      </form>

      {/* 📋 User Table */}
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table border="1" cellPadding="10" width="100%">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageUsers;
