import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatInr } from "../../lib/format";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/overview").then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Loading desk…</p>;
  const o = data.overview;

  return (
    <div>
      <h1 className="font-display text-4xl">Overview</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Tile label="Users" value={o.users} />
        <Tile label="Donations" value={formatInr(o.donation_total)} />
        <Tile label="Expenses" value={formatInr(o.expense_total)} />
        <Tile label="Messages" value={o.messages} />
      </div>
      <h2 className="mt-10 font-display text-2xl">Latest gifts</h2>
      <ul className="mt-4 space-y-2">
        {data.recentDonations.map((d) => (
          <li key={d.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
            {d.donor} gave {formatInr(d.amount)} to {d.campaign}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-copper">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
