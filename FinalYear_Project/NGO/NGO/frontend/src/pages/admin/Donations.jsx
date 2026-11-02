import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatInr } from "../../lib/format";

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [note, setNote] = useState("");

  async function load() {
    const res = await api.get("/admin/donations");
    setDonations(res.data.donations);
  }

  useEffect(() => {
    load();
  }, []);

  async function publish(id) {
    const res = await api.patch(`/admin/donations/${id}/publish`);
    setNote(res.data.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Donations</h1>
      <p className="mt-2 text-sm text-ink/60">
        Payments complete in Razorpay first. They reach the public audit desk only when you publish.
      </p>
      {note && <p className="mt-3 text-sm text-pine">{note}</p>}
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-ink/50">
              <th className="px-4 py-3">Receipt</th>
              <th>Donor</th>
              <th>Campaign</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{d.receipt_no}</td>
                <td>{d.donor}</td>
                <td>{d.campaign}</td>
                <td>{formatInr(d.amount)}</td>
                <td>
                  {d.status}
                  {d.published ? " · public" : " · hidden"}
                </td>
                <td>
                  {d.status === "completed" && !d.published && (
                    <button onClick={() => publish(d.id)} className="text-pine">
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
