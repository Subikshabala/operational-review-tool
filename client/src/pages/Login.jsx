import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";


export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: false });

  function onSubmit(e) {
  e.preventDefault();

  if (!username.trim() || !password.trim()) {
    setMsg({ text: "Please fill all fields.", ok: false });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username.trim())) {
    setMsg({ text: "Please enter a valid email address.", ok: false });
    return;
  }

  // Phase 1 demo: accept ANY valid email
  const role = "user"; // default role for now

  localStorage.setItem(
    "ort_user_demo",
    JSON.stringify({
      name: "Student",
      email: username.trim(),
      role
    })
  );

  setMsg({ text: "Login successful (demo). Redirecting...", ok: true });

  setTimeout(() => {
    nav("/user-dashboard");
  }, 600);
}


  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Login</h1>
        <p className="subtitle">Operational Review Tool</p>

        <form className="form" onSubmit={onSubmit} noValidate>
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" type="submit">Log in</button>

          <div className="divider">
            <span className="dividerLine"></span>
            <span className="dividerText">or</span>
            <span className="dividerLine"></span>
          </div>

          <button className="googleBtn" type="button" onClick={() => alert("Google sign-in (UI only) - Phase 2")}>
            <span className="gIcon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 2.9l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.1-.1-2.1-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3 0 5.7 1.1 7.7 2.9l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.2 4.3-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.6 35.6 27 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.4 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3 4.8-5.6 6.1l6.2 5.2C39.7 36 44 30.6 44 24c0-1.1-.1-2.1-.4-3.5z"/>
              </svg>
            </span>
            <span>Sign in with Google</span>
          </button>

          <p className="bottom">
            New user? <Link className="link" to="/signup">Sign up</Link>
          </p>

          <p className="msg" style={{ color: msg.ok ? "green" : "#F9484B" }}>
            {msg.text}
          </p>
        </form>
      </section>
    </main>
  );
}
