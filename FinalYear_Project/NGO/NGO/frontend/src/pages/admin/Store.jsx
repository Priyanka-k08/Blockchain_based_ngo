import { useEffect, useState } from "react";
import api from "../../api/client";

const empty = {
  name: "",
  category: "Education",
  description: "",
  image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
  unit: "piece",
  needed_qty: 20,
};

export default function AdminStore() {
  const [items, setItems] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const res = await api.get("/admin/store");
    setItems(res.data.items);
    setPledges(res.data.pledges);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/store", form);
    setForm(empty);
    load();
  }

  async function receive(id) {
    await api.patch(`/admin/pledges/${id}`, { status: "received" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Store & pledges</h1>
      <form onSubmit={create} className="mt-6 grid gap-2 rounded-3xl bg-white p-5 md:grid-cols-2">
        <input className="rounded-2xl border px-3 py-2" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-2xl border px-3 py-2" placeholder="needed qty" type="number" value={form.needed_qty} onChange={(e) => setForm({ ...form, needed_qty: e.target.value })} />
        <textarea className="rounded-2xl border px-3 py-2 md:col-span-2" placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="rounded-full bg-ink py-2 text-sand md:col-span-2">Add item</button>
      </form>
      <h2 className="mt-8 font-display text-2xl">Pledges</h2>
      <ul className="mt-3 space-y-2">
        {pledges.map((p) => (
          <li key={p.id} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm">
            {p.donor} pledged {p.quantity} × {p.item_name} ({p.status})
            {p.status !== "received" && (
              <button onClick={() => receive(p.id)} className="text-pine">
                Mark received
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink/50">{items.length} catalogue items</p>
    </div>
  );
}
