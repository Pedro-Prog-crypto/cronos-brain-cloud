import { pdfFixture } from "./fixtures.mjs";
import { migrate } from "./migrate.mjs";
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { Miniflare } from "miniflare";
import { createHash, randomUUID } from "node:crypto";
const mf = new Miniflare({
  modules: true,
  scriptPath: "dist/worker.mjs",
  compatibilityDate: "2026-07-30",
  d1Databases: { DB: "ui-smoke" },
  bindings: { PROVIDERS_JSON: "[]" },
});
const db = await mf.getD1Database("DB");
await migrate(db);
const credentials = { deviceId: randomUUID(), credential: "f".repeat(64) },
  userId = randomUUID();
await db.prepare("INSERT INTO users(id) VALUES (?)").bind(userId).run();
await db
  .prepare("INSERT INTO devices VALUES (?,?,?,?,?,NULL)")
  .bind(
    credentials.deviceId,
    userId,
    "Browser test",
    createHash("sha256").update(credentials.credential).digest("hex"),
    "owner",
  )
  .run();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const origin = (await mf.ready).origin;
try {
  await page.goto(origin + "/admin");
  await page.locator("#login-form [name=deviceId]").fill(credentials.deviceId);
  await page
    .locator("#login-form [name=credential]")
    .fill(credentials.credential);
  await page.locator("#login-form button").click();
  await page.locator("#metrics .metric").first().waitFor();
  assert.equal(
    await page
      .locator("#providers")
      .innerText()
      .then((s) => s.includes("Nenhum modelo conectado")),
    true,
  );
  await page.locator("#metrics .metric").first().click();
  await page.locator("#memory").waitFor({ state: "visible" });
  await page.locator("[data-tab=overview]").click();
  await page.locator("#overview").waitFor({ state: "visible" });
  assert.equal(await page.locator("#login").isVisible(), false);
  await page.locator(".flow-step").nth(2).click();
  await page.locator("#agents").waitFor({ state: "visible" });
  await page.locator("[data-tab=memory]").click();
  await page.waitForFunction(() => !document.querySelector("#memory").hasAttribute("aria-busy"));
  await page
    .locator("#memory-form [name=content]")
    .fill("Registro de validação do painel CRONOS");
  await page
    .locator("#memory-form [name=metadata]")
    .fill('{"topics":["Validação","Painel"]}');
  await page.locator("#memory-form button").click();
  await page
    .getByText("Registro de validação do painel CRONOS", { exact: true })
    .waitFor();
  await page.locator("[data-tab=graph]").click();
  await page
    .locator("#graph-accessible summary")
    .filter({ hasText: "2 assuntos" })
    .waitFor();
  await page.locator("#graph-search").fill("Painel");
  await page.locator("#graph-canvas").hover();
  await page.mouse.wheel(0, -200);
  mkdirSync("docs/screenshots", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/graph.png", fullPage: true, animations: "disabled" });
  await page.locator("[data-tab=tools]").click();
  await page
    .locator("#chart-form [name=points]")
    .fill('[{"label":"Leitura","value":4},{"label":"Exercícios","value":7}]');
  await page.locator("#chart-form button").click();
  await page.locator("#tool-result .bar").first().waitFor();
  await page.locator("#media-form select").selectOption("document.pdf");
  await page
    .locator("#media-form input[type=file]")
    .setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(pdfFixture(), "base64"),
    });
  await page.locator("#media-form button").click();
  await page
    .locator("#tool-result pre")
    .filter({ hasText: "CRONOS PDF real" })
    .waitFor();
  await page.locator("[data-tab=agents]").click();
  await page.locator("#agent-list article").nth(39).waitFor();
  assert.equal(await page.locator("#agent-list article").count(), 40);
  await page.locator("#agent-search").fill("Guardian");
  assert.equal(await page.locator("#agent-list article").count(), 1);
  await page.locator("#agent-list article").click();
  await page.locator("#agent-run-form textarea").fill("Verificar permissões");
  await page.locator("#agent-run-form button").click();
  await page
    .locator("#agent-run-result pre")
    .filter({ hasText: "externalActionsAllowed" })
    .waitFor();
  await page.locator("#agent-search").fill("");
  await page.locator("[data-tab=memory]").click();
  await page
    .locator("#memory-list button")
    .filter({ hasText: "Editar" })
    .first()
    .click();
  await page
    .locator("#memory-form [name=content]")
    .fill("Registro de validação atualizado");
  await page.locator("#memory-form button").click();
  await page
    .getByText("Registro de validação atualizado", { exact: true })
    .waitFor();
  await page
    .locator("#memory-list button")
    .filter({ hasText: "Histórico" })
    .first()
    .click();
  await page
    .locator("#memory-history")
    .getByText("Registro de validação do painel CRONOS", { exact: true })
    .waitFor();
  await page.locator("[data-tab=personality]").click();
  await page.locator("#personality-form [name=detail]").fill("35");
  await page.locator("#personality-form button").click();
  await page
    .getByText("Preferências salvas na conta", { exact: true })
    .waitFor();
  await page.locator("[data-tab=models]").click();
  await page.locator("#model-tools .item").first().waitFor();
  await page.locator("[data-tab=personality]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#personality-form [name=detail]").value === "35",
  );
  await db.prepare("DELETE FROM rate_limits").run();
  await page.locator("[data-tab=events]").click();
  await page.waitForFunction(() => !document.querySelector("#events").hasAttribute("aria-busy"));
  await page.locator("#event-form [name=title]").fill("Rotina de validação");
  await page.locator("#event-form [name=dueAt]").fill("2026-11-09T10:00");
  await page.locator("#event-form [name=recurrenceDays]").selectOption("7");
  await page.locator("#event-form button").click();
  await page.getByText("Rotina registrada.", { exact: false }).waitFor();
  assert.equal((await db.prepare("SELECT recurrence_days FROM events WHERE title=?").bind("Rotina de validação").first()).recurrence_days, 7);
  await page.locator("[data-tab=research]").click();
  for (const name of ["Artigos acadêmicos", "Fontes confiáveis", "Tendências", "Alertas", "Monitoramento"])
    assert.equal(await page.locator(`[data-research-mode="${name}"]`).isEnabled(), true);
  await page.locator('[data-research-mode="Artigos acadêmicos"]').click();
  await page.locator("#research-scope").filter({ hasText: "Crossref" }).waitFor();
  await page.locator('[data-research-mode="Alertas"]').click();
  await page.locator('#research-controls input').fill('CRONOS');
  await page.locator('#research-controls button').filter({ hasText: 'Adicionar alerta' }).click();
  await page.locator('[data-research-mode="Monitoramento"]').click();
  await page.locator('#research-controls').filter({ hasText: 'CRONOS' }).waitFor();
  await page.locator('[data-research-mode="Pesquisa"]').click();
  // Capture every reference page, checking both desktop and narrow layouts.
  // Fixture limits are reset directly in this isolated test database between sweeps.
  await db.prepare("DELETE FROM rate_limits").run();
  const pages = [
    "overview",
    "graph",
    "agents",
    "models",
    "events",
    "settings",
    "research",
    "tools",
    "memory",
    "diagnostics",
    "personality",
    "integration",
  ];
  for (const tab of pages) {
    await page.locator(`[data-tab=${tab}]`).click();
    await page.waitForFunction(
      (id) => !document.querySelector("#" + id).hidden && !document.querySelector("#" + id).hasAttribute("aria-busy"),
      tab,
    );
    await page.waitForLoadState("networkidle");
    await page.evaluate(
      () => (document.querySelector("#notice").hidden = true),
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `Desktop overflow: ${tab}`,
    );
    await page.screenshot({
      path: `docs/screenshots/${tab}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await db.prepare("DELETE FROM rate_limits").run();
  await page.setViewportSize({ width: 960, height: 760 });
  for (const tab of ["overview", "events", "settings", "tools"]) {
    await page.locator(`[data-tab=${tab}]`).click();
    await page.waitForFunction(
      (id) => !document.querySelector("#" + id).hasAttribute("aria-busy"),
      tab,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `Reference-width overflow: ${tab}`,
    );
    await page.screenshot({ path: `docs/screenshots/reference-960-${tab}.png`, fullPage: true, animations: "disabled" });
  }
  await db.prepare("DELETE FROM rate_limits").run();
  await page.locator("[data-tab=integration]").click();
  await page.locator("#permission-state").filter({ hasText: "não tem ações" }).waitFor();
  await page.locator("#permissions-form [name=show_notification]").check();
  await page.locator("#permissions-form button").click();
  await page.locator("#permission-state").filter({ hasText: "carregadas" }).waitFor();
  await page.locator("[data-tab=settings]").click();
  await page.locator("[data-tab=integration]").click();
  await page.waitForFunction(() => !document.querySelector("#integration").hasAttribute("aria-busy"));
  assert.equal(await page.locator("#permissions-form [name=show_notification]").isChecked(), true);
  const [createdResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/v1/devices') && r.request().method() === 'POST'),
    page.locator('#connect-desktop').click(),
  ]);
  const paired = await createdResponse.json();
  await page.locator('#download-desktop-config').waitFor();
  const bridgeDir = mkdtempSync(join(tmpdir(), 'cronos-bridge-'));
  try {
    const file = join(bridgeDir, 'cronos-desktop.json');
    writeFileSync(file, JSON.stringify({ baseUrl: origin, deviceId: paired.id, credential: paired.credential }), { mode: 0o600 });
    const { stdout } = await promisify(execFile)(process.execPath, ['client/desktop-bridge.mjs', file, '--once'], { timeout: 15000 });
    assert.match(stdout, /CRONOS conectado ao Brain Cloud/);
  } finally {
    rmSync(bridgeDir, { recursive: true, force: true });
  }
  await page.locator('#check-desktop').click();
  await page.locator('#connection-status').filter({ hasText: 'Conectado:' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tab of pages) {
    await page.locator(`[data-tab=${tab}]`).click();
    await page.waitForFunction(id=>!document.querySelector('#'+id).hasAttribute('aria-busy'),tab);
    await page.waitForLoadState("networkidle");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `Mobile overflow: ${tab}`,
    );
  }
  await page.locator("[data-tab=overview]").click();
  await page.locator("#metrics .metric").first().waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.locator("#logout").click();
  await page.locator("#login-form").waitFor();
  assert.equal(await page.locator("#workspace").isVisible(), false);
  assert.equal(await page.locator("#structured-output").innerText(), "");
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: 12 pages desktop/mobile, login/logout, memory editing/history, atlas, chart, PDF, agent filtering/execution, personality persistence; no JS exceptions.",
  );
} finally {
  await browser.close();
  await mf.dispose();
}
