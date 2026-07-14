// Electron + renderer smoke e2e（规则 13/14）—— 可断言、可重复、零额度。
// 启动真实 Electron 主进程并等待 renderer 完成加载；随后用同一个 Vite renderer
// 断言主链路关键 UI（项目库 → 开项目 → 画布工具栏/导出入口）。
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
  libraryTitle: /项目库|Project Library|Библиотека проектов/,
  newBlankProject: /新建空白项目|New blank project|Новый пустой проект/,
  toolbar: [
    ["workspace creation", /创作|Create|Создать/],
    ["workspace generation", /生成|Generate|Генерация/],
    ["workspace preview", /预览|Preview|Просмотр/],
    ["export", /导出|Export|Экспорт|前往预览导出|Go to preview export|Перейти к экспорту/],
  ],
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

  console.log("  → checking renderer UI in browser");
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(rendererUrl, { waitUntil: "domcontentloaded" });
  await page.getByText(UI_TEXT.libraryTitle).first().waitFor({ timeout: 10000 });
  assert((await page.title()).toLowerCase().includes("nomi"), "窗口标题含 Nomi");

  const primaryCard = page.locator('[data-variant="primary"]', { hasText: UI_TEXT.newBlankProject });
  assert((await primaryCard.count()) > 0, "项目库主入口动作卡片「新建空白项目」可见（i18n）");

  const projectCard = page.locator("[data-project-card]").first();
  if ((await projectCard.count()) > 0) {
    await projectCard.click();
  } else {
    await page.getByText(UI_TEXT.newBlankProject).first().click();
  }
  await page.waitForTimeout(2500);

  for (const [label, name] of UI_TEXT.toolbar) {
    assert(await page.getByRole("button", { name }).first().isVisible(), `工作台工具栏 ${label} 可见（i18n）`);
  }
  assert(/projectId=/.test(page.url()), "工作台 URL 含 projectId");

  // 4) 生成画布 composer：超长提示词必须在编辑区内部滚动、底栏生成钮永远可点
  //（回归 2026-07-15：滚动容器无高度上限 → 长 prompt 溢出盖住底栏，提交钮点不到）。
  await page.getByRole("button", { name: UI_TEXT.toolbar[1][1] }).first().click();
  await page.waitForTimeout(800);
  await page.locator('button[aria-label="添加图片节点"], button[aria-label="Add image node"]').first().click();
  const composer = page.locator(".generation-canvas-v2-node__composer-card").first();
  await composer.waitFor({ timeout: 5000 });
  const longPrompt = Array.from({ length: 14 }, (_, i) => `第${i + 1}段：超长提示词溢出回归压测，逐行填满编辑区直到超过卡片高度上限，验证底栏不被盖住。`).join("\n");
  const promptInput = composer.locator(".generation-canvas-v2-node__prompt-input").first();
  await promptInput.click();
  await promptInput.fill(longPrompt);
  await page.waitForTimeout(500);
  // 画布平移：把 composer 拉进「AppBar 之下、窗口底之上」的可视带（节点落点随机，卡可能伸出窗口
  // → elementFromPoint 打在视口外恒 null，误报被挡）。wheel 落在远离卡片的空白区。
  for (let i = 0; i < 6; i++) {
    const box = await composer.boundingBox();
    if (!box) break;
    const vp = await page.evaluate(() => ({
      w: window.innerWidth,
      h: window.innerHeight,
      appbarBottom: document.querySelector(".nomi-appbar")?.getBoundingClientRect().bottom ?? 0,
    }));
    let dy = 0;
    if (box.y < vp.appbarBottom + 8) dy = box.y - (vp.appbarBottom + 8);
    else if (box.y + box.height > vp.h - 16) dy = Math.min(box.y + box.height - (vp.h - 16), box.y - (vp.appbarBottom + 8));
    if (Math.abs(dy) < 4) break;
    await page.mouse.move(vp.w - 80, Math.max(vp.appbarBottom + 40, 200));
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(250);
  }
  const composerCheck = await composer.evaluate((card) => {
    const editorEl = card.querySelector(".generation-canvas-v2-node__prompt-input");
    let scroller = editorEl;
    while (scroller && scroller !== card && !/(auto|scroll)/.test(window.getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const scrolls = Boolean(scroller && scroller !== card && scroller.scrollHeight > scroller.clientHeight);
    const btn = card.querySelector('button[aria-label="生成素材"], button[aria-label="重新生成"]');
    const r = btn?.getBoundingClientRect();
    const hitEl = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return { scrolls, btnClickable: Boolean(btn && hitEl && (btn === hitEl || btn.contains(hitEl))) };
  });
  assert(composerCheck.scrolls, "超长提示词在编辑区内部滚动（不撑爆卡片）");
  assert(composerCheck.btnClickable, "超长提示词下生成钮 hit-test 可点（底栏未被溢出文字盖住）");

  console.log(`\nSMOKE PASS: ${passed} assertions`);
  await finishAndExit(0);
} catch (error) {
  console.error(`\n${error?.message || error}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => undefined);
  await stopChild(electronProcess).catch(() => undefined);
  await stopChild(viteProcess).catch(() => undefined);
}
