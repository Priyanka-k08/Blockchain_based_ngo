import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-copper">404</p>
      <h1 className="mt-3 font-display text-5xl">This page is not on the ledger.</h1>
      <p className="mt-4 text-ink/70">The route does not exist. Head back to campaigns or the public audit desk.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="rounded-full bg-ink px-5 py-3 text-sand">
          Home
        </Link>
        <Link to="/campaigns" className="rounded-full border border-ink/15 px-5 py-3">
          Campaigns
        </Link>
      </div>
    </main>
  );
}
