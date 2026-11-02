import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatInr } from "../lib/format";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", city: user.city || "" });
  const [donations, setDonations] = useState([]);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api.get("/donations/mine").then((res) => setDonations(res.data.donations));
  }, []);

  async function save(e) {
    e.preventDefault();
    const res = await api.put("/auth/me", form);
    setUser(res.data.user);
    setSaved("Profile updated.");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl">Hello, {user.name}</h1>
      <form onSubmit={save} className="mt-6 grid gap-3 rounded-3xl bg-white p-6 shadow-lift md:grid-cols-3">
        <input className="rounded-2xl border px-4 py-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-2xl border px-4 py-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="rounded-2xl border px-4 py-3" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <button className="rounded-full bg-ink px-4 py-3 text-sand md:col-span-3">Save profile</button>
        {saved && <p className="text-sm text-pine md:col-span-3">{saved}</p>}
      </form>
      <h2 className="mt-10 font-display text-3xl">Donation history</h2>
      <ul className="mt-4 space-y-3">
        {donations.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-3xl bg-white px-5 py-4 shadow-lift">
            <div>
              <p className="font-medium">{d.title}</p>
              <p className="text-sm text-ink/60">
                {formatInr(d.amount)} · {d.receipt_no}
              </p>
            </div>
            <Link to={`/receipts/${d.receipt_no}`} className="text-sm text-pine">
              Receipt
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
