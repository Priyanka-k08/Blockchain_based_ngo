import { useEffect, useState } from "react";
import api from "../api/client";

export default function Beneficiaries() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    api.get("/beneficiaries").then((res) => setPeople(res.data.beneficiaries));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">Approved beneficiaries</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Only field-verified people and groups appear here. Names of minors are shortened.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {people.map((person) => (
          <article key={person.id} className="grid grid-cols-[140px_1fr] overflow-hidden rounded-3xl bg-white shadow-lift">
            <img src={person.image_url} alt="" className="h-full min-h-[180px] w-full object-cover" />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-copper">
                {person.category} · {person.location}
              </p>
              <h2 className="mt-1 font-display text-2xl">{person.name}</h2>
              <p className="mt-2 text-sm text-ink/70">{person.story}</p>
              <p className="mt-3 text-sm font-medium">Need: {person.need_summary}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
