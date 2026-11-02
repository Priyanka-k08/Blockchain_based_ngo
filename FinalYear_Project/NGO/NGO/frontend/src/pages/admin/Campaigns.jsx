import { useEffect, useState } from "react";
import api from "../../api/client";

const empty = {
  slug: "",
  title: "",
  cause: "Nutrition",
  summary: "",
  story: "",
  location: "Madurai",
  image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
  target_amount: 100000,
  start_date: "2026-10-01",
  end_date: "2027-03-01",
  status: "active",
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const res = await api.get("/admin/campaigns");
    setCampaigns(res.data.campaigns);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/campaigns", form);
    setForm(empty);
    load();
  }

  async function setStatus(campaign, status) {
    await api.put(`/admin/campaigns/${campaign.id}`, { status });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Campaigns</h1>
      <form onSubmit={create} className="mt-6 grid gap-2 rounded-3xl bg-white p-5 md:grid-cols-2">
        {["slug", "title", "cause", "location", "target_amount", "start_date"].map((field) => (
          <input
            key={field}
            className="rounded-2xl border px-3 py-2"
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        ))}
        <textarea
          className="rounded-2xl border px-3 py-2 md:col-span-2"
          placeholder="summary"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
        <textarea
          className="rounded-2xl border px-3 py-2 md:col-span-2"
          placeholder="story"
          value={form.story}
          onChange={(e) => setForm({ ...form, story: e.target.value })}
        />
        <button className="rounded-full bg-ink py-2 text-sand md:col-span-2">Create campaign</button>
      </form>
      <ul className="mt-6 space-y-2">
        {campaigns.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
            <span>
              {c.title} · {c.status}
            </span>
            <button onClick={() => setStatus(c, c.status === "active" ? "paused" : "active")} className="text-pine">
              Toggle pause
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
