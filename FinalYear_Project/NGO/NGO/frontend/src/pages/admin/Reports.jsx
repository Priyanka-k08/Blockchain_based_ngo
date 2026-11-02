import { useEffect, useState } from "react";
import ImpactCharts from "../../components/ImpactCharts";
import api from "../../api/client";
import { formatInr } from "../../lib/format";

export default function AdminReports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/impact").then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Loading reports…</p>;

  return (
    <div>
      <h1 className="font-display text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-ink/60">Live donation, utilization and sealed-record totals.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Donated</p>
          <p className="mt-2 font-display text-3xl">{formatInr(data.totals.donated)}</p>
        </div>
        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Utilized</p>
          <p className="mt-2 font-display text-3xl">{formatInr(data.totals.utilized)}</p>
        </div>
        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Sealed</p>
          <p className="mt-2 font-display text-3xl">{data.totals.sealed_records}</p>
        </div>
      </div>
      <div className="mt-8">
        <ImpactCharts data={data} />
      </div>
    </div>
  );
}
