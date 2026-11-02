const clients = new Set();

function subscribe(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  });
  res.write(`data: ${JSON.stringify({ type: "hello", at: new Date().toISOString() })}\n\n`);
  clients.add(res);
  const ping = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  }, 25000);
  req.on("close", () => {
    clearInterval(ping);
    clients.delete(res);
  });
}

function broadcast(payload) {
  const line = `data: ${JSON.stringify({ ...payload, at: new Date().toISOString() })}\n\n`;
  for (const client of clients) {
    try {
      client.write(line);
    } catch {
      clients.delete(client);
    }
  }
}

module.exports = { subscribe, broadcast };
