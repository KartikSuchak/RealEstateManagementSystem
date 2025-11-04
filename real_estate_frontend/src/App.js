import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import ManageUsers from "./pages/ManageUsers";
import Agents from "./pages/Agents";
import Properties from "./pages/Properties";
import PlsqlFeatures from "./pages/PLSQLFeatures";

function App() {
  return (
    <Router>
      {/* 🌆 Top Navbar */}
      <header style={styles.navbar}>
        <h1 style={styles.logo}>🏠 Real Estate Management System</h1>
        <nav style={styles.navLinks}>
          <NavLink to="/" style={styles.link} activeStyle={styles.active}>Users</NavLink>
          <NavLink to="/agents" style={styles.link} activeStyle={styles.active}>Agents</NavLink>
          <NavLink to="/properties" style={styles.link} activeStyle={styles.active}>Properties</NavLink>
          <NavLink to="/plsql" style={styles.link} activeStyle={styles.active}>PL/SQL</NavLink>
        </nav>
      </header>

      {/* 📦 Page Container */}
      <main style={styles.container}>
        <Routes>
          <Route path="/" element={<ManageUsers />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/plsql" element={<PlsqlFeatures />} />
        </Routes>
      </main>
    </Router>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#5f27cd",
    color: "white",
    padding: "15px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  logo: { margin: 0, fontSize: "20px", fontWeight: "bold" },
  navLinks: { display: "flex", gap: "25px" },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "16px",
  },
  active: { textDecoration: "underline" },
  container: {
    padding: "30px 50px",
    backgroundColor: "#f8f9fc",
    minHeight: "100vh",
  },
};

export default App;
