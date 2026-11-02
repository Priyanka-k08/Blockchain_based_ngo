import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useLiveUpdates } from "../hooks/useLiveUpdates";
import { formatInr } from "../lib/format";

export default function Utilization() {
  const [expenses, setExpenses] = useState([]);
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    api.get("/utilization").then((res) => setExpenses(res.data.expenses));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveUpdates((event) => {
    if (event.type === "utilization" || event.type === "ledger") {
      setFlash("Admin published a new utilization record.");
      load();
    }
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">Where funds went</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        These rows appear only after an admin publishes a field update. Donors then receive a
        WhatsApp note with a video of how the amount was used.
      </p>
      {flash && <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm">{flash}</p>}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-lift">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-ink/60">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th>Campaign</th>
              <th>Expense</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Video</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((row) => (
              <tr key={row.id} className="border-t border-ink/5">
                <td className="px-4 py-3">{String(row.spent_on).slice(0, 10)}</td>
                <td>
                  <Link to={`/campaigns/${row.slug}`} className="text-pine">
                    {row.campaign_title}
                  </Link>
                </td>
                <td>{row.title}</td>
                <td>{row.vendor}</td>
                <td>{formatInr(row.amount)}</td>
                <td>
                  {row.video_url ? (
                    <a className="text-pine" href={row.video_url} target="_blank" rel="noreferrer">
                      Watch
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!expenses.length && (
          <p className="px-4 py-8 text-center text-ink/50">No published utilization yet.</p>
        )}
      </div>
    </main>
  );
}
