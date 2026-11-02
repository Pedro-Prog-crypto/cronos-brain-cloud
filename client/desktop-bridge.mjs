#!/usr/bin/env node
import { discoverConnection } from "./connection-config.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node client/desktop-bridge.mjs <arquivo-ou-pasta-extraída> [--once]");
  process.exit(2);
}
const config = await discoverConnection(file);
const base = new URL(config.baseUrl);
if (base.protocol !== "https:" && !(base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname)))
  throw Error("A ponte exige HTTPS ou servidor local em 127.0.0.1/localhost.");
if (!/^[0-9a-f-]{36}$/i.test(config.deviceId) || !/^[0-9a-f]{64}$/i.test(config.credential))
  throw Error("Arquivo de conexão inválido.");
const endpoint = (path) => new URL(path, base).href;
let token = "", expires = 0;
async function request(path, method = "GET", payload, authorization = false) {
  const response = await fetch(endpoint(path), {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(authorization ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
  return response.json();
}
async function heartbeat() {
  if (Date.now() >= expires) {
    const session = await request("/v1/auth/sessions", "POST", {
      deviceId: config.deviceId,
      credential: config.credential,
    });
    token = session.accessToken;
    expires = Date.now() + Math.min(session.expiresIn - 90, 720) * 1000;
  }
  await request("/v1/devices/heartbeat", "POST", { client: "CRONOS Desktop bridge/0.4.4" }, true);
  console.log(`CRONOS conectado ao Brain Cloud: ${new Date().toLocaleTimeString("pt-BR")}`);
}
if (process.argv.includes("--once")) {
  await heartbeat();
} else {
  console.log("Ponte CRONOS iniciada. Mantenha esta janela aberta; Ctrl+C encerra a presença.");
  while (true) {
    try { await heartbeat(); }
    catch (error) { console.error(`Conexão indisponível: ${error.message}`); token = ""; expires = 0; }
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
}
