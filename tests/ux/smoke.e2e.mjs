// Electron + web renderer smoke e2e（规则 13/14）—— 可断言、可重复、零额度。
// 启动真实 Electron 主进程并等待 desktop runtime 完成加载；随后用同一个 Vite renderer
// 断言普通浏览器 runtime 会被 web portal auth gate 保护。
// 不触发真实 AI 生成/导出（不花额度）。
//
// 用法：pnpm run test:e2e
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vitePackagePath = require.resolve("vite/package.json");
const viteBin = path.join(path.dirname(vitePackagePath), "bin", "vite.js");
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "nomi-smoke-e2e-"));
const userDataDir = path.join(tempRoot, "user-data");
const projectsDir = path.join(tempRoot, "projects");
mkdirSync(projectsDir, { recursive: true });

let passed = 0;
function assert(cond, label) {
  if (!cond) throw new Error(`SMOKE FAIL: ${label}`);
  passed += 1;
  console.log(`  ✓ ${label}`);
}

const UI_TEXT = {
  webGateTitle: /Everville media portal|Everville 媒体门户|Медиа-портал Everville/,
  webGateBadge: /Private workspace|私有工作区|Закрытая рабочая область/,
  workEmail: /Work email|工作邮箱|Рабочая почта/,
  sendMagicLink: /Send magic link|发送登录链接|Отправить magic link/,
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findOpenPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  if (!address || typeof address === "string") throw new Error("SMOKE FAIL: no port allocated");
  return address.port;
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForTcpPort(port, child, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    if (child.exitCode !== null) throw new Error(`SMOKE FAIL: ${label} exited early (${child.exitCode})`);
    if (await canConnect("127.0.0.1", port)) return;
    await wait(200);
  }
  throw new Error(`SMOKE FAIL: ${label} did not open port ${port}`);
}

async function waitForElectronRendererReady(child, getLogs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    if (child.exitCode !== null) throw new Error(`SMOKE FAIL: Electron exited early (${child.exitCode})`);
    const logs = getLogs();
    if (logs.includes("[nomi:desktop] renderer dom ready") && logs.includes("[nomi:desktop] renderer did finish load")) {
      return;
    }
    await wait(200);
  }
  throw new Error("SMOKE FAIL: Electron renderer did not finish loading");
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    wait(3000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

const rendererPort = await findOpenPort();
const rendererUrl = `http://127.0.0.1:${rendererPort}/index.html#/studio`;

const viteProcess = spawn(process.execPath, [
  viteBin,
  "--host",
  "127.0.0.1",
  "--port",
  String(rendererPort),
  "--strictPort",
  "--clearScreen",
  "false",
], {
  cwd: repoRoot,
  env: { ...process.env },
  stdio: ["ignore", "pipe", "pipe"],
});
viteProcess.stdout.on("data", (chunk) => process.stdout.write(chunk));
viteProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

const electronEnv = {
  ...process.env,
  NOMI_DESKTOP_DEV: "1",
  VITE_DEV_SERVER_URL: rendererUrl,
  NOMI_RENDERER_URL: rendererUrl,
  NOMI_E2E: "1",
  NOMI_E2E_SMOKE: "1",
  NOMI_E2E_ALLOW_MULTI_INSTANCE: "1",
  NOMI_ELECTRON_USER_DATA_DIR: userDataDir,
  NOMI_SETTINGS_DIR: userDataDir,
  NOMI_PROJECTS_DIR: projectsDir,
  ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
};
delete electronEnv.ELECTRON_RUN_AS_NODE;

let electronLog = "";
const electronProcess = spawn(require("electron"), [".", `--user-data-dir=${userDataDir}`], {
  cwd: repoRoot,
  env: electronEnv,
  stdio: ["ignore", "pipe", "pipe"],
});
const onElectronOutput = (chunk) => {
  const text = String(chunk);
  electronLog += text;
  process.stdout.write(chunk);
};
electronProcess.stdout.on("data", onElectronOutput);
electronProcess.stderr.on("data", onElectronOutput);

let browser;

try {
  console.log(`  → waiting for Vite renderer port ${rendererPort}`);
  await waitForTcpPort(rendererPort, viteProcess, "Vite renderer");

  console.log("  → waiting for Electron renderer load");
  await waitForElectronRendererReady(electronProcess, () => electronLog);
  assert(true, "Electron 主进程加载 renderer 到 dom-ready / finish-load");

  console.log("  → checking web portal auth gate in browser");
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(rendererUrl, { waitUntil: "domcontentloaded" });
  await page.getByText(UI_TEXT.webGateTitle).first().waitFor({ timeout: 10000 });
  assert((await page.title()).toLowerCase().includes("nomi"), "窗口标题含 Nomi");
  assert(await page.getByText(UI_TEXT.webGateBadge).first().isVisible(), "web runtime 显示私有工作区 gate（i18n）");
  assert(await page.getByText(UI_TEXT.workEmail).first().isVisible(), "web runtime 显示工作邮箱字段（i18n）");
  assert(await page.getByRole("button", { name: UI_TEXT.sendMagicLink }).first().isVisible(), "web runtime 显示 magic-link 登录按钮（i18n）");
  assert(await page.locator("input[type='email']").first().isVisible(), "web runtime 登录 email input 可见");

  const languageSwitcher = page
    .getByRole("button", { name: /切换界面语言|Switch interface language|Переключить язык интерфейса/ })
    .first();
  assert(await languageSwitcher.isVisible(), "web runtime 语言切换器可见");
  await languageSwitcher.click();
  await page.getByRole("option", { name: "Русский" }).click();
  await page.getByText("Медиа-портал Everville").first().waitFor({ timeout: 4000 });
  assert((await page.evaluate(() => localStorage.getItem("nomi.interface-language"))) === "ru", "语言选择保存为 ru");
  assert(await page.getByRole("button", { name: "Отправить magic link" }).first().isVisible(), "切换到俄语后 web gate 立即刷新");

  console.log(`\nSMOKE PASS: ${passed} assertions`);
} catch (error) {
  console.error(`\n${error?.message || error}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => undefined);
  await stopChild(electronProcess).catch(() => undefined);
  await stopChild(viteProcess).catch(() => undefined);
}
