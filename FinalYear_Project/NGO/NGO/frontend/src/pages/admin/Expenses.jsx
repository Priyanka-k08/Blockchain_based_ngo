import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatInr } from "../../lib/format";

const empty = {
  campaign_id: "",
  title: "",
  category: "Supplies",
  vendor: "",
  amount: "",
  spent_on: "2026-10-02",
  notes: "",
  video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  impact_message: "This clip shows grain, bowls or aids purchased with donor funds.",
};

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(empty);
  const [seal, setSeal] = useState(null);
  const [note, setNote] = useState("");

  async function load() {
    const [e, c] = await Promise.all([api.get("/admin/expenses"), api.get("/admin/campaigns")]);
    setExpenses(e.data.expenses);
    setCampaigns(c.data.campaigns);
    if (!form.campaign_id && c.data.campaigns[0]) {
      setForm((prev) => ({ ...prev, campaign_id: c.data.campaigns[0].id }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    const res = await api.post("/admin/expenses", form);
    setSeal(res.data.ledger);
    setNote("Expense sealed privately. Publish it to show the public site and WhatsApp donors.");
    setForm({ ...empty, campaign_id: form.campaign_id });
    load();
  }

  async function publish(row) {
    const res = await api.patch(`/admin/expenses/${row.id}/publish`, {
      video_url: row.video_url || form.video_url,
      impact_message: row.impact_message || form.impact_message,
    });
    setNote(res.data.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Utilization expenses</h1>
      <p className="mt-2 text-sm text-ink/60">
        Draft spend stays off the public ledger until you publish. Publishing sends a WhatsApp video to campaign donors.
      </p>
      <form onSubmit={create} className="mt-6 grid gap-2 rounded-3xl bg-white p-5 md:grid-cols-2">
        <select
          className="rounded-2xl border px-3 py-2"
          value={form.campaign_id}
          onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cause} · {c.title}
            </option>
          ))}
        </select>
        <input className="rounded-2xl border px-3 py-2" placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" placeholder="vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" placeholder="amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" type="date" value={form.spent_on} onChange={(e) => setForm({ ...form, spent_on: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" placeholder="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2 md:col-span-2" placeholder="video url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        <textarea className="rounded-2xl border px-3 py-2 md:col-span-2" placeholder="impact message for WhatsApp" value={form.impact_message} onChange={(e) => setForm({ ...form, impact_message: e.target.value })} />
        <button className="rounded-full bg-ink py-2 text-sand md:col-span-2">Seal as draft</button>
      </form>
      {seal && (
        <p className="mt-3 break-all font-mono text-xs">
          {seal.tx_ref} · {seal.hash}
        </p>
      )}
      {note && <p className="mt-3 text-sm text-pine">{note}</p>}
      <ul className="mt-6 space-y-2">
        {expenses.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-sm">
            <span>
              {row.title} · {formatInr(row.amount)} · {row.published ? "public" : "draft"}
            </span>
            {!row.published && (
              <button onClick={() => publish(row)} className="text-pine">
                Publish & WhatsApp donors
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
