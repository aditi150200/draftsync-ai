import express from "express";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { DocumentStore } from "./document-store.js";
import { analyzeWriting } from "./suggestions.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/collaborate" });
const port = process.env.PORT || 3000;
const document = new DocumentStore("Great writing is not created in isolation. It becomes sharper when ideas can move quickly between people. DraftSync gives teams one calm space to shape those ideas together.");
const participants = new Map();

app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ status: "ok", connections: participants.size }));
app.get("/api/document", (_req, res) => res.json(document.snapshot()));
app.post("/api/suggestions", (req, res) => {
  if (typeof req.body?.text !== "string") return res.status(400).json({ error: "text must be a string" });
  return res.json(analyzeWriting(req.body.text));
});

function broadcast(message, except = null) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client !== except && client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function presence() {
  return [...participants.values()].map(({ id, name, color }) => ({ id, name, color }));
}

wss.on("connection", socket => {
  const id = randomUUID();
  participants.set(socket, { id, name: `Guest ${participants.size + 1}`, color: "#738f54" });
  socket.send(JSON.stringify({ type: "init", id, document: document.snapshot(), participants: presence() }));
  broadcast({ type: "presence", participants: presence() });

  socket.on("message", raw => {
    try {
      const message = JSON.parse(raw.toString());
      const participant = participants.get(socket);
      if (message.type === "join" && typeof message.name === "string") {
        participant.name = message.name.trim().slice(0, 30) || participant.name;
        broadcast({ type: "presence", participants: presence() });
      }
      if (message.type === "edit") {
        const result = document.commit({ ...message.operation, clientId: participant.id });
        broadcast({ type: "document", ...result });
      }
      if (message.type === "cursor") {
        broadcast({ type: "cursor", userId: participant.id, position: Number(message.position) || 0 }, socket);
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: error.message, document: document.snapshot() }));
    }
  });

  socket.on("close", () => {
    participants.delete(socket);
    broadcast({ type: "presence", participants: presence() });
  });
});

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => console.log(`DraftSync AI running on http://localhost:${port}`));
}

export { app, server };

