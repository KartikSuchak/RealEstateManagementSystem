import React, { useEffect, useState } from "react";
import axios from "axios";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    agent_username: "",
    title: "",
    description: "",
    city: "",
    locality: "",
    price: "",
    property_type: "sale",
    status: "available",
  });
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const baseURL = "http://127.0.0.1:8000";

  useEffect(() => {
    axios.get(`${baseURL}/properties`).then((res) => setProperties(res.data.properties || []));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingPropertyId) {
        await axios.put(`${baseURL}/update_property/${editingPropertyId}`, form);
        alert("✅ Property updated successfully!");
        setEditingPropertyId(null);
      } else {
        await axios.post(`${baseURL}/add_property`, form);
        alert("✅ Property added successfully!");
      }
      setForm({
        agent_username: "",
        title: "",
        description: "",
        city: "",
        locality: "",
        price: "",
        property_type: "sale",
        status: "available",
      });
      const res = await axios.get(`${baseURL}/properties`);
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error(err);
      alert("❌ Error adding/updating property.");
    }
  };

  const handleEdit = (p) => {
    setEditingPropertyId(p.property_id);
    setForm({
      agent_username: p.agent,
      title: p.title,
      description: p.description,
      city: p.city,
      locality: p.locality,
      price: p.price,
      property_type: p.property_type,
      status: p.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try {
      await axios.delete(`${baseURL}/delete_property/${id}`);
      alert("🗑️ Property deleted successfully!");
      const res = await axios.get(`${baseURL}/properties`);
      setProperties(res.data.properties || []);
    } catch {
      alert("❌ Error deleting property.");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>🏠 Manage Properties</h2>

      <form onSubmit={handleAddOrUpdate} style={styles.form}>
        <input style={styles.input} name="agent_username" placeholder="Agent Username" value={form.agent_username} onChange={handleChange} required />
        <input style={styles.input} name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input style={styles.input} name="city" placeholder="City" value={form.city} onChange={handleChange} required />
        <input style={styles.input} name="price" placeholder="Price" value={form.price} onChange={handleChange} type="number" required />
        <select style={styles.select} name="property_type" value={form.property_type} onChange={handleChange}>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </select>
        <select style={styles.select} name="status" value={form.status} onChange={handleChange}>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        <button style={styles.addBtn}>{editingPropertyId ? "Update Property" : "Add Property"}</button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Agent</th>
            <th>Title</th>
            <th>City</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.property_id}>
              <td>{p.property_id}</td>
              <td>{p.agent}</td>
              <td>{p.title}</td>
              <td>{p.city}</td>
              <td>₹{p.price}</td>
              <td>{p.status}</td>
              <td>
                <button style={styles.editBtn} onClick={() => handleEdit(p)}>✏️ Edit</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(p.property_id)}>🗑️ Delete</button>
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
  form: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "20px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", flex: "1 1 180px" },
  select: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd" },
  addBtn: { background: "#10ac84", color: "white", border: "none", borderRadius: "8px", padding: "10px 15px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  editBtn: { background: "#ffeaa7", border: "none", padding: "6px 10px", marginRight: "5px", borderRadius: "6px", cursor: "pointer" },
  deleteBtn: { background: "#ff7675", border: "none", padding: "6px 10px", color: "white", borderRadius: "6px", cursor: "pointer" },
};

export default Properties;
