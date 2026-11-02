import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../api/client";
import ReviewPrompt from "../components/ReviewPrompt";
import { formatInr } from "../lib/format";

export default function Receipt() {
  const { receiptNo } = useParams();
  const location = useLocation();
  const [receipt, setReceipt] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    api.get(`/donations/receipt/${receiptNo}`).then((res) => {
      setReceipt(res.data.receipt);
      setReviewed(Boolean(Number(res.data.receipt.reviewed)));
    });
  }, [receiptNo]);

  if (!receipt) return <p className="p-16 text-center">Loading receipt…</p>;

  return (
    <main className="mx-auto max-w-lg px-4 py-12 space-y-6">
      <article className="rounded-[2rem] border border-dashed border-ink/20 bg-white p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-copper">KindLedger Trust</p>
        <h1 className="mt-2 font-display text-4xl">Donation receipt</h1>
        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Receipt" value={receipt.receipt_no} />
          <Row label="Donor" value={receipt.donor_name} />
          <Row label="Email" value={receipt.email} />
          <Row label="Campaign" value={receipt.title} />
          <Row label="Amount" value={formatInr(receipt.amount)} />
          <Row label="Gateway" value={receipt.gateway || "razorpay"} />
          <Row label="Payment ID" value={receipt.gateway_payment_id || "—"} />
          <Row label="WhatsApp" value={receipt.whatsapp_phone || "—"} />
          <Row label="Public ledger" value={receipt.published ? "Published" : "Waiting for admin"} />
          <Row label="Date" value={new Date(receipt.created_at).toLocaleString("en-IN")} />
          <Row label="Tx ref" value={receipt.tx_ref} />
        </dl>
        <p className="mt-6 break-all font-mono text-[11px] text-ink/50">{receipt.record_hash}</p>
        {location.state?.whatsapp && (
          <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm">
            WhatsApp confirmation {location.state.whatsapp.status === "sent" ? "sent" : "logged"} to{" "}
            {location.state.whatsapp.to || receipt.whatsapp_phone}.
          </p>
        )}
        <button className="mt-6 w-full rounded-full border py-2 text-sm" onClick={() => window.print()}>
          Print / save PDF
        </button>
      </article>
      {!reviewed && receipt.status === "completed" && (
        <div className="rounded-[2rem] bg-white p-8 shadow-lift">
          <ReviewPrompt donationId={receipt.id} onDone={() => setReviewed(true)} />
        </div>
      )}
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="max-w-[60%] break-all text-right">{value}</dd>
    </div>
  );
}
