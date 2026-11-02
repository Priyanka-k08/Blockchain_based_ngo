import { useState } from "react";
import api from "../api/client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/contact", form);
      setDone(res.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send.");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl">Write to the desk</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl bg-white p-6 shadow-lift">
        {error && <p className="text-sm text-copper">{error}</p>}
        {done && <p className="text-sm text-pine">{done}</p>}
        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea className="h-32 w-full rounded-2xl border px-4 py-3" placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="w-full rounded-full bg-ink py-3 text-sand">Send</button>
      </form>
    </main>
  );
}
