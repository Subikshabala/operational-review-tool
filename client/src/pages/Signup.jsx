import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: false });

  function onSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirm) {
      setMsg({ text: "Please fill all fields.", ok: false });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMsg({ text: "Please enter a valid email address.", ok: false });
      return;
    }

    if (password.length < 6) {
      setMsg({ text: "Password must be at least 6 characters.", ok: false });
      return;
    }

    if (password !== confirm) {
      setMsg({ text: "Passwords do not match.", ok: false });
      return;
    }

    // Phase 1 demo: accept ANY valid email
    const role = "user";

    localStorage.setItem(
      "ort_user_demo",
      JSON.stringify({ name: name.trim(), email: email.trim(), role })
    );

    setMsg({ text: "Account created (demo). Redirecting to login...", ok: true });

    setTimeout(() => nav("/user-dashboard"), 700);
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Sign up</h1>
        <p className="subtitle">Operational Review Tool</p>

        <form className="form" onSubmit={onSubmit} noValidate>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="label">Confirm Password</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button className="btn" type="submit">Create account</button>

          <p className="bottom">
            Already have an account? <Link className="link" to="/login">Log in</Link>
          </p>

          <p className="msg" style={{ color: msg.ok ? "green" : "#F9484B" }}>
            {msg.text}
          </p>
        </form>
      </section>
    </main>
  );
}
