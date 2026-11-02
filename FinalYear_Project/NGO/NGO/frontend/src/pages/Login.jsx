import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      const next = params.get("next") || (res.data.user.role === "admin" ? "/admin" : "/profile");
      navigate(next);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Can't reach the sign-in service. Start the backend and MySQL, then try again."
            : err.message || "Could not sign in.")
      );
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Sign in</h1>
      <p className="mt-2 text-sm text-ink/60">
        Sample donor: donor@kindledger.org / Donor@123 · admin@kindledger.org / Admin@123
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-lift">
        {error && <p className="text-sm text-copper">{error}</p>}
        <input
          type="email"
          autoComplete="email"
          required
          placeholder="Email"
          className="w-full rounded-2xl border px-4 py-3"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password"
          className="w-full rounded-2xl border px-4 py-3"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full rounded-full bg-pine py-3 text-white">Enter</button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link to="/register" className="text-pine">Create an account</Link>
      </p>
    </main>
  );
}
