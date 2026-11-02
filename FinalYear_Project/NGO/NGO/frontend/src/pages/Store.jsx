import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Store() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(null);
  const [pledge, setPledge] = useState({ quantity: 1, pickup_city: "" });

  useEffect(() => {
    api.get("/store").then((res) => setItems(res.data.items));
  }, []);

  function startPledge(item) {
    if (!user) {
      navigate("/login?next=/store");
      return;
    }
    setActive(item.id);
    setPledge({ quantity: 1, pickup_city: user.city || "Madurai" });
  }

  async function submitPledge(item) {
    const res = await api.post("/store/pledge", {
      item_id: item.id,
      quantity: Number(pledge.quantity),
      pickup_city: pledge.pickup_city,
    });
    setMessage(res.data.message);
    setItems((prev) => prev.map((row) => (row.id === item.id ? res.data.item : row)));
    setActive(null);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">In-kind store</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Pledge unused books, clothes, food packs or medical kits. Volunteers collect from your city.
      </p>
      {message && <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm">{message}</p>}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map((item) => {
          const pct = Math.min(100, Math.round((item.pledged_qty / item.needed_qty) * 100));
          return (
            <article key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-lift">
              <img src={item.image_url} alt="" className="h-44 w-full object-cover" />
              <div className="space-y-3 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-copper">{item.category}</p>
                <h2 className="font-display text-2xl">{item.name}</h2>
                <p className="text-sm text-ink/70">{item.description}</p>
                <p className="text-sm">
                  {item.pledged_qty}/{item.needed_qty} {item.unit}s pledged
                </p>
                <div className="h-2 rounded-full bg-mist">
                  <div className="h-full rounded-full bg-pine" style={{ width: `${pct}%` }} />
                </div>
                {active === item.id ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-2xl border px-3 py-2 text-sm"
                      value={pledge.quantity}
                      onChange={(e) => setPledge({ ...pledge, quantity: e.target.value })}
                    />
                    <input
                      className="w-full rounded-2xl border px-3 py-2 text-sm"
                      value={pledge.pickup_city}
                      onChange={(e) => setPledge({ ...pledge, pickup_city: e.target.value })}
                    />
                    <button
                      onClick={() => submitPledge(item)}
                      className="w-full rounded-full bg-pine py-2 text-sm text-white"
                    >
                      Confirm pledge
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={item.status !== "open"}
                    onClick={() => startPledge(item)}
                    className="w-full rounded-full bg-ink py-2 text-sm text-sand disabled:opacity-40"
                  >
                    {item.status === "open" ? "Pledge this item" : "Fulfilled"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
