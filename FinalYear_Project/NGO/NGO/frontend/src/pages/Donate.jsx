import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatInr } from "../lib/format";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Razorpay."));
    document.body.appendChild(script);
  });
}

export default function Donate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    campaign_id: params.get("campaign") || "",
    amount: 1500,
    method: "UPI",
    note: "",
    whatsapp_phone: user?.phone || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoPay, setDemoPay] = useState(null);

  useEffect(() => {
    api.get("/campaigns", { params: { status: "active" } }).then((res) => {
      setCampaigns(res.data.campaigns);
      if (!form.campaign_id && res.data.campaigns[0]) {
        setForm((prev) => ({ ...prev, campaign_id: String(res.data.campaigns[0].id) }));
      }
    });
  }, []);

  useEffect(() => {
    if (user?.phone && !form.whatsapp_phone) {
      setForm((prev) => ({ ...prev, whatsapp_phone: user.phone }));
    }
  }, [user]);

  const finishPayment = useCallback(
    async (checkout, payment) => {
      const res = await api.post("/donations/verify", {
        donation_id: checkout.donation_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });
      navigate(`/receipts/${res.data.donation.receipt_no}`, {
        state: { whatsapp: res.data.whatsapp },
      });
    },
    [navigate]
  );

  async function submit(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login?next=/donate");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/donations/checkout", {
        ...form,
        campaign_id: Number(form.campaign_id),
        amount: Number(form.amount),
      });
      if (res.data.demo) {
        setDemoPay(res.data);
        setBusy(false);
        return;
      }
      await loadRazorpay();
      const options = {
        ...res.data.razorpay,
        handler: (response) => finishPayment(res.data, response),
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment window closed before completion.");
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Could not start payment.");
      setBusy(false);
    }
  }

  async function confirmDemo() {
    if (!demoPay) return;
    setBusy(true);
    try {
      await finishPayment(demoPay, {
        razorpay_order_id: demoPay.razorpay.order_id,
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_signature: `demo_${demoPay.razorpay.order_id}`,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Demo payment failed.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-5xl">Give money</h1>
      <p className="mt-3 text-ink/70">
        Checkout uses Razorpay (UPI, card or net banking). Without live keys, a demo gateway still
        verifies the order, issues a receipt and queues a WhatsApp confirmation. The public ledger
        stays unchanged until an admin publishes the record.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[2rem] bg-white p-6 shadow-lift">
        {error && <p className="text-sm text-copper">{error}</p>}
        <label className="block text-sm">
          Cause / campaign
          <select
            className="mt-1 w-full rounded-2xl border border-ink/10 px-4 py-3"
            value={form.campaign_id}
            onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cause} · {c.title} · {formatInr(c.target_amount - c.raised_amount)} remaining
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-sm">Amount (INR)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[500, 1500, 2500, 5000].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setForm({ ...form, amount })}
                className={`rounded-full border px-4 py-2 text-sm ${
                  Number(form.amount) === amount ? "border-pine bg-mist" : "border-ink/10"
                }`}
              >
                {formatInr(amount)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="100"
            className="mt-3 w-full rounded-2xl border border-ink/10 px-4 py-3"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          {["UPI", "Card", "NetBanking"].map((method) => (
            <button
              type="button"
              key={method}
              onClick={() => setForm({ ...form, method })}
              className={`flex-1 rounded-2xl border px-3 py-2 text-sm ${
                form.method === method ? "border-pine bg-mist" : "border-ink/10"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          WhatsApp number
          <input
            className="mt-1 w-full rounded-2xl border border-ink/10 px-4 py-3"
            placeholder="10-digit mobile"
            value={form.whatsapp_phone}
            onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Note (optional)
          <input
            className="mt-1 w-full rounded-2xl border border-ink/10 px-4 py-3"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>
        <button disabled={busy} className="w-full rounded-full bg-copper py-3 text-white">
          {busy ? "Opening gateway…" : "Pay securely"}
        </button>
      </form>

      {demoPay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-lift">
            <p className="text-xs uppercase tracking-[0.2em] text-copper">Razorpay demo</p>
            <h2 className="mt-2 font-display text-3xl">Confirm test payment</h2>
            <p className="mt-3 text-sm text-ink/70">
              Live Razorpay keys are not set. Completing this demo still records a payment ID,
              SHA-256 seal and WhatsApp confirmation log.
            </p>
            <p className="mt-4 font-display text-4xl">{formatInr(form.amount)}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-full border py-3"
                onClick={() => setDemoPay(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-full bg-pine py-3 text-white"
                onClick={confirmDemo}
              >
                {busy ? "Verifying…" : "Pay now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
