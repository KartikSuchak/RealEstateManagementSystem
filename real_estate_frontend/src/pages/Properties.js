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
    status: "available"
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/properties")
      .then(res => setProperties(res.data.properties))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/add_property", form);
      alert("✅ Property added successfully!");
      window.location.reload();
    } catch (err) {
      alert("❌ Error adding property. Check console.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏠 Manage Properties</h2>

      <form onSubmit={handleAddProperty} style={{ marginBottom: "20px" }}>
        <input name="agent_username" placeholder="Agent Username" onChange={handleChange} required />
        <input name="title" placeholder="Title" onChange={handleChange} required />
        <input name="description" placeholder="Description" onChange={handleChange} />
        <input name="city" placeholder="City" onChange={handleChange} required />
        <input name="locality" placeholder="Locality" onChange={handleChange} />
        <input name="price" placeholder="Price" type="number" onChange={handleChange} required />
        <select name="property_type" onChange={handleChange}>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </select>
        <select name="status" onChange={handleChange}>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
        <button type="submit">Add Property</button>
      </form>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Agent</th>
            <th>Title</th>
            <th>City</th>
            <th>Price</th>
            <th>Status</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Properties;
