import { useEffect, useState } from "react";
import api from "../../api/client";

const empty = {
  name: "",
  category: "Student",
  location: "Madurai",
  story: "",
  need_summary: "",
  image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  status: "approved",
};

export default function AdminBeneficiaries() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const res = await api.get("/admin/beneficiaries");
    setRows(res.data.beneficiaries);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/beneficiaries", form);
    setForm(empty);
    load();
  }

  async function toggle(row) {
    await api.patch(`/admin/beneficiaries/${row.id}`, {
      status: row.status === "approved" ? "pending" : "approved",
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Beneficiaries</h1>
      <form onSubmit={create} className="mt-6 grid gap-2 rounded-3xl bg-white p-5">
        <input className="rounded-2xl border px-3 py-2" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" placeholder="need" value={form.need_summary} onChange={(e) => setForm({ ...form, need_summary: e.target.value })} />
        <textarea className="rounded-2xl border px-3 py-2" placeholder="story" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} />
        <button className="rounded-full bg-ink py-2 text-sand">Add beneficiary</button>
      </form>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm">
            {row.name} · {row.status}
            <button onClick={() => toggle(row)} className="text-pine">
              Toggle approval
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
