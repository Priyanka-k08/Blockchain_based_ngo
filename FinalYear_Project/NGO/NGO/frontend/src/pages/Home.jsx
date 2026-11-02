import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import CampaignCard from "../components/CampaignCard";
import { useLiveUpdates } from "../hooks/useLiveUpdates";
import { formatInr } from "../lib/format";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get("/home")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load KindLedger data. Start the API and MySQL."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveUpdates(load);

  return (
    <main>
      <section className="bg-ink text-sand">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pb-20 pt-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-copper">Madurai · est. 2024</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">
              Light on every rupee that leaves a pocket.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-sand/75">
              KindLedger Trust runs kitchens, clinics and learning studios — then seals important
              donation and spending records with SHA-256 hashes so anyone can check they were not quietly rewritten.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/campaigns" className="rounded-full bg-copper px-6 py-3 text-white">
                Browse campaigns
              </Link>
              <Link to="/transparency" className="rounded-full border border-sand/30 px-6 py-3">
                Open the ledger
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80"
              alt="Community kitchen volunteers"
              className="h-52 w-full object-cover md:h-64"
            />
            <div className="bg-white/5 p-6">
              {error && <p className="text-sm text-copper">{error}</p>}
              {data && (
                <dl className="grid grid-cols-2 gap-6">
                  <Stat label="Donated" value={formatInr(data.stats.total_donations)} />
                  <Stat label="Utilized" value={formatInr(data.stats.expenses)} />
                  <Stat label="Campaigns" value={data.stats.campaigns} />
                  <Stat label="Approved lives" value={data.stats.beneficiaries} />
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl">How a gift is kept honest</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1 · Give", "Choose a campaign or pledge an item. Money checkout is simulated; a receipt is issued at once."],
            ["2 · Seal", "Completed donations and expenses are hashed with SHA-256. The website itself is not on a blockchain."],
            ["3 · Check", "Anyone can recompute a seal on the audit desk. The same payload can be published to a chain later."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-lift">
              <p className="text-xs uppercase tracking-[0.2em] text-copper">{title}</p>
              <p className="mt-3 text-ink/75">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl">Live programmes</h2>
          <Link to="/campaigns" className="text-sm text-pine">
            All campaigns
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data?.campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      <section className="bg-mist/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-4xl">Causes we keep returning to</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data?.causes.map((cause) => (
              <Link
                key={cause.cause}
                to={`/campaigns?cause=${encodeURIComponent(cause.cause)}`}
                className="rounded-3xl bg-paper p-6 transition hover:-translate-y-0.5"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-copper">{cause.cause}</p>
                <p className="mt-3 font-display text-3xl">{formatInr(cause.raised)}</p>
                <p className="text-sm text-ink/60">{cause.count} campaigns</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl">Voices, not captions</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data?.testimonials.map((item) => (
            <blockquote key={item.id} className="rounded-3xl bg-white p-6 shadow-lift">
              <p className="text-lg leading-relaxed">“{item.quote}”</p>
              <footer className="mt-5 text-sm text-ink/60">
                {item.author} · {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
        {data?.reviews?.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-3xl">Donor ratings</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {data.reviews.map((item, index) => (
                <blockquote key={index} className="rounded-3xl bg-mist/50 p-5">
                  <p className="text-sm text-copper">{"★".repeat(item.rating)}</p>
                  <p className="mt-2 text-ink/80">{item.comment || "Rated the giving experience."}</p>
                  <footer className="mt-3 text-xs text-ink/50">{item.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-ink px-8 py-8 text-sand">
          <div>
            <p className="font-display text-3xl">Bring books, blankets or a Saturday.</p>
            <p className="mt-2 text-sand/70">The in-kind store lists what field teams actually need this month.</p>
          </div>
          <Link to="/store" className="rounded-full bg-copper px-6 py-3 text-white">
            Open the store
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.2em] text-sand/50">{label}</dt>
      <dd className="mt-2 font-display text-3xl">{value}</dd>
    </div>
  );
}
