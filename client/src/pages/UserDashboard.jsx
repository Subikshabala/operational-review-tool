import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function UserDashboard() {
  const nav = useNavigate();

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("ort_user_demo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  if (!user) {
    // redirect if not logged in
    nav("/login");
    return null;
  }

  function logout() {
    localStorage.removeItem("ort_user_demo");
    nav("/login");
  }

  return (
    <div>
      <header className="topbar">
        <div className="brand">
          <span className="dot"></span>
          <span className="brandText">ORT</span>
        </div>
        <button className="logout" onClick={logout}>Logout</button>
      </header>

      <main className="wrap">
        <h1 className="h1">Welcome, {user.name || "Student"} 👋</h1>
        <p className="sub">Demo dashboard (Phase 1). Backend will be added in Phase 2.</p>

        <section className="grid">
          <div className="card">
            <p className="label">Attendance</p>
            <h2 className="value">92%</h2>
          </div>

          <div className="card">
            <p className="label">CGPA</p>
            <h2 className="value">8.1</h2>
          </div>

          <div className="card">
            <p className="label">Coding Count</p>
            <h2 className="value">120</h2>
          </div>
        </section>
      </main>
    </div>
  );
}
