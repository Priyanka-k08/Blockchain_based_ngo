import { useEffect, useState } from "react";
import ImpactCharts from "../components/ImpactCharts";
import api from "../api/client";
import { formatInr } from "../lib/format";

export default function Impact() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/impact").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="p-16 text-center">Loading impact…</p>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">Impact desk</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Totals come from MySQL. Charts are for donors and examiners, not marketing slides.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card label="Donated" value={formatInr(data.totals.donated)} />
        <Card label="Utilized" value={formatInr(data.totals.utilized)} />
        <Card label="Sealed records" value={data.totals.sealed_records} />
      </div>
      <div className="mt-8">
        <ImpactCharts data={data} />
      </div>
    </main>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-lift">
      <p className="text-xs uppercase tracking-[0.2em] text-copper">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
