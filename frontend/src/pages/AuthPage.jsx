import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import styles from "../styles/auth.module.css";

export default function AuthPage() {
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    console.log(mode)
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.email, form.password);
        await login(form.username, form.password);
      }
    } catch (e) {
      console.log(e)
      setError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.848L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <h1>{mode === "login" ? "Welcome back" : "Join today"}</h1>
        <p className={styles.sub}>
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </p>

        <div className={styles.fields}>
          <input
            placeholder="Username"
            value={form.username}
            onChange={set("username")}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {mode === "register" && (
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={set("email")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={submit} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <p className={styles.toggle}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
