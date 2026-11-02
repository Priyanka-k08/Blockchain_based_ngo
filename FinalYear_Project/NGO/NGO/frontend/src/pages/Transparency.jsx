import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import { useLiveUpdates } from "../hooks/useLiveUpdates";
import { formatInr } from "../lib/format";

export default function Transparency() {
  const [records, setRecords] = useState([]);
  const [type, setType] = useState("donation");
  const [id, setId] = useState("1");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [liveNote, setLiveNote] = useState("");

  const load = useCallback(() => {
    api.get("/ledger").then((res) => setRecords(res.data.records));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveUpdates((event) => {
    if (event.type === "ledger" || event.type === "utilization") {
      setLiveNote("The public ledger just refreshed after an admin update.");
      load();
    }
  });

  async function verify(e) {
    e?.preventDefault?.();
    setError("");
    try {
      const res = await api.get(`/verify/${type}/${id}`);
      setResult(res.data);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Verification failed.");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">Public audit desk</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Important donation and expense rows appear here only after an admin publishes them. Recompute
        a SHA-256 seal. A future blockchain adapter can publish the same payload without changing MySQL.
      </p>
      {liveNote && <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm">{liveNote}</p>}

      <form onSubmit={verify} className="mt-8 flex flex-wrap gap-3 rounded-3xl bg-white p-5 shadow-lift">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border px-4 py-3">
          <option value="donation">Donation</option>
          <option value="expense">Expense</option>
        </select>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-28 rounded-2xl border px-4 py-3"
          placeholder="ID"
        />
        <button className="rounded-full bg-pine px-5 py-3 text-white">Verify hash</button>
      </form>
      {error && <p className="mt-3 text-sm text-copper">{error}</p>}
      {result && (
        <div className="mt-4 rounded-3xl bg-ink p-6 text-sand">
          <p className="text-copper">{result.matches ? "Hash matches the stored seal." : "Mismatch — record may have changed."}</p>
          <p className="mt-2 font-mono text-xs break-all">stored: {result.stored_hash}</p>
          <p className="mt-1 font-mono text-xs break-all">recomputed: {result.recomputed_hash}</p>
          <p className="mt-2 text-sm">tx ref: {result.tx_ref}</p>
        </div>
      )}

      <div className="mt-10 overflow-x-auto rounded-3xl bg-white shadow-lift">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-ink/60">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th>Label</th>
              <th>Amount</th>
              <th>Transaction ref</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr
                key={`${row.record_type}-${row.record_id}`}
                className="cursor-pointer border-t border-ink/5 hover:bg-mist/40"
                onClick={() => {
                  setType(row.record_type);
                  setId(String(row.record_id));
                  api
                    .get(`/verify/${row.record_type}/${row.record_id}`)
                    .then((res) => {
                      setResult(res.data);
                      setError("");
                    })
                    .catch((err) => {
                      setResult(null);
                      setError(err.response?.data?.message || "Verification failed.");
                    });
                }}
              >
                <td className="px-4 py-3">{row.record_type}</td>
                <td>{row.label}</td>
                <td>{formatInr(row.amount)}</td>
                <td className="font-mono text-[11px]">{row.tx_ref}</td>
                <td className="max-w-[180px] truncate font-mono text-[11px]">{row.record_hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
