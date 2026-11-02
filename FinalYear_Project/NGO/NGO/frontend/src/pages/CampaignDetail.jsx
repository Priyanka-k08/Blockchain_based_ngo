import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { ProgressBar } from "../components/CampaignCard";
import { formatInr } from "../lib/format";

export default function CampaignDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/campaigns/${slug}`).then((res) => setData(res.data));
  }, [slug]);

  if (!data) return <p className="p-16 text-center">Loading campaign…</p>;
  const { campaign, expenses, stats } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <img src={campaign.image_url} alt="" className="h-80 w-full rounded-[2rem] object-cover" />
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-copper">
            {campaign.cause} · {campaign.location}
          </p>
          <h1 className="mt-2 font-display text-5xl">{campaign.title}</h1>
          <p className="mt-6 text-lg text-ink/75">{campaign.story}</p>
        </div>
        <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-lift">
          <ProgressBar raised={campaign.raised_amount} target={campaign.target_amount} />
          <p className="mt-4 text-sm text-ink/60">
            {formatInr(campaign.raised_amount)} of {formatInr(campaign.target_amount)} · {stats.donor_count} gifts
          </p>
          <Link
            to={`/donate?campaign=${campaign.id}`}
            className="mt-6 block rounded-full bg-copper py-3 text-center text-white"
          >
            Donate to this campaign
          </Link>
          <h2 className="mt-8 font-display text-2xl">Published utilization</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {expenses.map((item) => (
              <li key={item.id} className="border-b border-ink/5 pb-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-ink/60">
                  {formatInr(item.amount)} · {item.vendor}
                </p>
                {item.video_url && (
                  <a className="text-pine" href={item.video_url} target="_blank" rel="noreferrer">
                    Field video
                  </a>
                )}
              </li>
            ))}
            {!expenses.length && <li>Nothing published by admin yet.</li>}
          </ul>
        </aside>
      </div>
      {data.reviews?.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-3xl">
            Donor ratings {data.reviewStats?.average ? `· ${data.reviewStats.average}/5` : ""}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {data.reviews.map((item, index) => (
              <blockquote key={index} className="rounded-3xl bg-white p-5 shadow-lift">
                <p className="text-copper">{"★".repeat(item.rating)}</p>
                <p className="mt-2 text-sm">{item.comment || "Rated this campaign."}</p>
                <footer className="mt-3 text-xs text-ink/50">{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
