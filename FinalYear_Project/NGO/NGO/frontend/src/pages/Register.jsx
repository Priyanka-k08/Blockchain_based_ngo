import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", city: "Madurai" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Can't reach the registration service. Start the backend and MySQL, then try again."
            : err.message || "Could not register.")
      );
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Create a donor account</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl bg-white p-6 shadow-lift">
        {error && <p className="text-sm text-copper">{error}</p>}
        {["name", "email", "password", "phone", "city"].map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
            minLength={field === "password" ? 6 : undefined}
            placeholder={field}
            className="w-full rounded-2xl border px-4 py-3"
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required={["name", "email", "password"].includes(field)}
            autoComplete={field === "password" ? "new-password" : field === "email" ? "email" : "off"}
          />
        ))}
        <button className="w-full rounded-full bg-pine py-3 text-white">Register</button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link to="/login" className="text-pine">Sign in</Link>
      </p>
    </main>
  );
}
