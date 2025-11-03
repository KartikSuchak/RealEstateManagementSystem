import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ManageUsers from "./pages/ManageUsers"; // ✅ merged Users + AddUser
import Agents from "./pages/Agents";
import Properties from "./pages/Properties";
import PlsqlFeatures from "./pages/PLSQLFeatures"; // keep if you’ve made it

function App() {
  return (
    <Router>
      <div style={{ padding: "20px" }}>
        <h1>🏠 Real Estate Management System</h1>

        {/* 🧭 Navigation Bar */}
        <nav>
          <Link to="/" style={{ marginRight: "10px" }}>Users</Link>
          <Link to="/agents" style={{ marginRight: "10px" }}>Agents</Link>
          <Link to="/properties" style={{ marginRight: "10px" }}>Properties</Link>
          <Link to="/plsql">PL/SQL Features</Link>
        </nav>

        <hr />

        {/* 🧩 Routes */}
        <Routes>
          <Route path="/" element={<ManageUsers />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/plsql" element={<PlsqlFeatures />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
