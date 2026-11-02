import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api.get("/admin/messages").then((res) => setMessages(res.data.messages));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Contact messages</h1>
      <ul className="mt-6 space-y-3">
        {messages.map((row) => (
          <li key={row.id} className="rounded-3xl bg-white p-5">
            <p className="font-medium">
              {row.name} · <span className="text-ink/60">{row.email}</span>
            </p>
            <p className="mt-2 text-sm text-ink/75">{row.message}</p>
            <p className="mt-2 text-xs text-ink/40">{row.created_at}</p>
          </li>
        ))}
        {!messages.length && <p className="text-sm text-ink/50">No messages yet.</p>}
      </ul>
    </div>
  );
}
