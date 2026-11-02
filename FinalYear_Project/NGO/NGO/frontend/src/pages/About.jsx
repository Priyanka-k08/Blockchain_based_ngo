export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-copper">Who we are</p>
      <h1 className="mt-3 font-display text-5xl">A field NGO that publishes its books.</h1>
      <p className="mt-6 text-lg text-ink/75">
        KindLedger Trust is a fictional nonprofit created as a complete student project. It is inspired
        by the idea of community kitchens, in-kind gifts and campaign pages — not by any single
        organisation’s branding or source code.
      </p>
      <p className="mt-4 text-ink/75">
        Ordinary application data lives in MySQL. Only completed money donations and fund-utilization
        expenses receive a SHA-256 seal and a transaction reference. That seal is designed so a later
        team can drop the same payload onto a blockchain network without rewriting the rest of the app.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-lift">
          <h2 className="font-display text-2xl">What we do</h2>
          <p className="mt-3 text-sm text-ink/70">
            Nutrition, shelter kits, a mobile clinic, after-school tutoring and well repairs around Madurai.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-lift">
          <h2 className="font-display text-2xl">What we refuse</h2>
          <p className="mt-3 text-sm text-ink/70">
            Putting the entire website “on chain”. Identity, search, photos and admin work stay in a
            normal database.
          </p>
        </div>
      </div>
    </main>
  );
}
