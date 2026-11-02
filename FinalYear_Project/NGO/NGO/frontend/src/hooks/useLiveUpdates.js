import { useEffect } from "react";

export function useLiveUpdates(onEvent) {
  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "hello" || payload.type === "ping") return;
        onEvent(payload);
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => source.close();
  }, [onEvent]);
}
