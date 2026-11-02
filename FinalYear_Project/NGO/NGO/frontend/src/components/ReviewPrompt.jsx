import { useState } from "react";
import api from "../api/client";

export default function ReviewPrompt({ donationId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/reviews", { donation_id: donationId, rating, comment });
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the review.");
    }
  }

  if (done) {
    return <p className="text-sm text-pine">Thank you — your rating is on the campaign page.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="font-display text-2xl">How was this gift experience?</p>
      <p className="text-sm text-ink/60">Rate the checkout, receipt and trust in how we will use the amount.</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setRating(value)}
            className={`h-10 w-10 rounded-full text-sm ${
              value <= rating ? "bg-copper text-white" : "bg-mist text-ink"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        className="h-24 w-full rounded-2xl border px-4 py-3 text-sm"
        placeholder="Optional review"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-copper">{error}</p>}
      <button className="w-full rounded-full bg-pine py-3 text-white">Submit rating</button>
    </form>
  );
}
