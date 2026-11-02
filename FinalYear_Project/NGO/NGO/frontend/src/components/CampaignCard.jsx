import { Link } from "react-router-dom";
import { formatInr } from "../lib/format";

export function ProgressBar({ raised, target }) {
  const pct = Math.min(100, Math.round((Number(raised) / Number(target || 1)) * 100));
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-pine" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink/60">
        <span>{formatInr(raised)} raised</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

export default function CampaignCard({ campaign }) {
  return (
    <Link
      to={`/campaigns/${campaign.slug}`}
      className="group overflow-hidden rounded-3xl bg-white shadow-lift"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={campaign.image_url}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-sand/90 px-3 py-1 text-xs">
          {campaign.cause}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-2xl leading-tight">{campaign.title}</h3>
        <p className="text-sm text-ink/70 line-clamp-3">{campaign.summary}</p>
        <ProgressBar raised={campaign.raised_amount} target={campaign.target_amount} />
      </div>
    </Link>
  );
}
