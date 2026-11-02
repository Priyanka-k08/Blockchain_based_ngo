import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import CampaignCard from "../components/CampaignCard";

export default function Campaigns() {
  const [params, setParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [causes, setCauses] = useState([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [cause, setCause] = useState(params.get("cause") || "");
  const [status, setStatus] = useState(params.get("status") || "");

  useEffect(() => {
    api.get("/campaigns/causes").then((res) => setCauses(res.data.causes));
  }, []);

  useEffect(() => {
    const filters = {};
    if (q) filters.q = q;
    if (cause) filters.cause = cause;
    if (status) filters.status = status;
    api.get("/campaigns", { params: filters }).then((res) => setCampaigns(res.data.campaigns));
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (cause) next.set("cause", cause);
    if (status) next.set("status", status);
    setParams(next, { replace: true });
  }, [q, cause, status, setParams]);

  const uniqueCauses = useMemo(() => causes.map((c) => c.cause), [causes]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">Campaigns</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Search by neighbourhood or filter by cause. Progress bars use live totals from the donation table.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, story or city"
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3"
        />
        <select
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3"
        >
          <option value="">All causes</option>
          {uniqueCauses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
      {!campaigns.length && (
        <p className="mt-10 rounded-3xl bg-white p-8 text-center text-ink/60">
          No campaigns match those filters.
        </p>
      )}
    </main>
  );
}
