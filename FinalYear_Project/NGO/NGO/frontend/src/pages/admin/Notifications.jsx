import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/admin/notifications").then((res) => setNotifications(res.data.notifications));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">WhatsApp log</h1>
      <p className="mt-2 text-sm text-ink/60">
        Without Meta WhatsApp keys, messages are stored as demo. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send live.
      </p>
      <ul className="mt-6 space-y-3">
        {notifications.map((row) => (
          <li key={row.id} className="rounded-3xl bg-white p-5 text-sm">
            <p className="font-medium">
              {row.kind} · {row.status} · {row.recipient_phone || "no number"}
            </p>
            <p className="mt-2 text-ink/75">{row.body}</p>
            {row.video_url && (
              <a className="mt-2 inline-block text-pine" href={row.video_url} target="_blank" rel="noreferrer">
                Video
              </a>
            )}
          </li>
        ))}
        {!notifications.length && <p className="text-sm text-ink/50">No WhatsApp events yet.</p>}
      </ul>
    </div>
  );
}
