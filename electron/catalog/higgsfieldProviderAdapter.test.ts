import { describe, expect, it, vi } from "vitest";

import type { ProviderInvokeRequest } from "../../src/platform/generation/provider";
import {
  assertProviderResultEnvelope,
  defineGenerationProviderContract,
  providerRequest,
} from "../../src/platform/generation/provider.contract.test";
import { HIGGSFIELD_PROVIDER_MANIFEST } from "./higgsfieldProviderManifest";
import { HIGGSFIELD_OUTPUT_LIMITS, createHiggsfieldProviderAdapter } from "./higgsfieldProviderAdapter";

const MODEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["prompt"],
  properties: {
    prompt: { type: "string", maxLength: 4_000, cliFlag: "--prompt" },
    image: { type: "string", maxLength: 4_000, cliFlag: "--image" },
    duration: { type: "integer", minimum: 1, maximum: 30, cliFlag: "--duration" },
  },
} as const;

const WORKFLOW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["script"],
  properties: {
    script: { type: "string", maxLength: 8_000, cliFlag: "--script" },
    aspectRatio: {
      type: "string",
      enum: ["16:9", "9:16"],
      maxLength: 8,
      cliFlag: "--aspect-ratio",
    },
  },
} as const;

const CATALOG_SNAPSHOTS = {
  models: {
    "wan-2.5": MODEL_SCHEMA,
  },
  workflows: {
    "workflow:ugc-ad": WORKFLOW_SCHEMA,
  },
} as const;

const success = (value: unknown) => ({
  kind: "success" as const,
  exitCode: 0,
  stdout: JSON.stringify(value),
  stderr: "",
});

function createExecutor(result: unknown = success({ version: "1.1.13" })) {
  return {
    execute: vi.fn(async () => result),
  };
}

function createAdapter(overrides: Record<string, unknown> = {}) {
  const executor = createExecutor();
  return {
    executor,
    provider: createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
      ...overrides,
    }),
  };
}

function request(operationId: string, input: unknown = {}, overrides: Partial<ProviderInvokeRequest> = {}) {
  return providerRequest(operationId, {
    manifestVersion: HIGGSFIELD_PROVIDER_MANIFEST.manifestVersion,
    input,
    ...overrides,
  });
}

function generationRequest(
  operationId: "higgsfield.generate.create" | "higgsfield.generate.workflow" = "higgsfield.generate.create",
  overrides: Partial<ProviderInvokeRequest> = {},
) {
  const input =
    operationId === "higgsfield.generate.create"
      ? { targetKey: "wan-2.5", parameters: { prompt: "A sunrise", duration: 5 }, assets: [] }
      : {
          targetKey: "workflow:ugc-ad",
          parameters: { script: "A short spot", aspectRatio: "9:16" },
          assets: [],
        };

  return request(operationId, input, {
    idempotencyKey: `idem-${operationId}-0001`,
    policyContext: {
      projectId: "project-001",
      claimIds: ["generation.submit"],
      spendGrantId: "grant-001",
    },
    ...overrides,
  });
}

defineGenerationProviderContract("local Higgsfield adapter", () => createAdapter().provider, "policy_denied");

describe("Higgsfield local provider adapter argv and compatibility", () => {
  it.each([
    ["higgsfield.system.version", {}, ["version", "--json"]],
    ["higgsfield.account.status", {}, ["account", "status", "--json"]],
    ["higgsfield.workspace.status", {}, ["workspace", "status", "--json"]],
    ["higgsfield.model.list", {}, ["model", "list", "--json"]],
    ["higgsfield.model.get", { modelKey: "wan-2.5" }, ["model", "get", "wan-2.5", "--json"]],
    ["higgsfield.workflow.list", {}, ["workflow", "list", "--json"]],
    ["higgsfield.workflow.get", { workflowKey: "workflow:ugc-ad" }, ["workflow", "get", "ugc-ad", "--json"]],
    ["higgsfield.voices.get", { voiceId: "voice-001" }, ["voices", "get", "voice-001", "--json"]],
  ])("builds the fixed literal argv for %s", async (operationId, input, argv) => {
    const executor = createExecutor(success({}));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    await provider.invoke(request(operationId, input));

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(executor.execute.mock.calls[0][0].argv).toEqual(argv);
    expect(Array.isArray(executor.execute.mock.calls[0][0].argv)).toBe(true);
    expect(executor.execute.mock.calls[0][0]).not.toHaveProperty("command");
    expect(executor.execute.mock.calls[0][0]).not.toHaveProperty("shell");
    expect(executor.execute.mock.calls[0][0]).not.toHaveProperty("executable");
  });

  it("preserves model job_type identity and existing wait argv semantics", async () => {
    const executor = createExecutor(success({ id: "job-model-001", status: "completed", assets: [] }));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    await provider.invoke(generationRequest());

    expect(executor.execute.mock.calls[0][0].argv).toEqual([
      "generate",
      "create",
      "wan-2.5",
      "--prompt",
      "A sunrise",
      "--duration",
      "5",
      "--wait",
      "--wait-timeout",
      "20m",
      "--wait-interval",
      "5s",
      "--json",
    ]);
    expect(executor.execute.mock.calls[0][0].argv).not.toContain("grant-001");
    expect(executor.execute.mock.calls[0][0].argv).not.toContain("idem-higgsfield.generate.create-0001");
  });

  it("preserves workflow:<job_type> identity while using the workflow CLI path", async () => {
    const executor = createExecutor(success({ id: "job-workflow-001", status: "completed", assets: [] }));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    await provider.invoke(generationRequest("higgsfield.generate.workflow"));

    expect(executor.execute.mock.calls[0][0].argv).toEqual([
      "generate",
      "workflow",
      "ugc-ad",
      "--script",
      "A short spot",
      "--aspect-ratio",
      "9:16",
      "--wait",
      "--wait-timeout",
      "20m",
      "--wait-interval",
      "5s",
      "--json",
    ]);
  });

  it("returns a typed result carrying safe job metadata and the one-way idempotency hash", async () => {
    const rawKey = "idem-never-return-this-0001";
    const executor = createExecutor(success({ id: "job-123", status: "queued", assets: [] }));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });
    const invocation = generationRequest("higgsfield.generate.create", { idempotencyKey: rawKey });

    const result = await provider.invoke(invocation);

    assertProviderResultEnvelope(result, invocation);
    expect(result.ok).toBe(true);
    expect(result.meta).toMatchObject({
      idempotencyKeyHash: expect.any(String),
      remoteJobId: "job-123",
      remoteState: "accepted",
      cancellation: "not_requested",
    });
    expect(result.meta.idempotencyKeyHash).not.toBe(rawKey);
    expect(JSON.stringify(result)).not.toContain(rawKey);
  });
});

describe("Higgsfield local provider adapter allowlisting and policy", () => {
  it.each([
    ["higgsfield.auth.token", "policy_denied"],
    ["higgsfield.website.publish", "policy_denied"],
    ["higgsfield.website.repo-access", "policy_denied"],
    ["higgsfield.website.db.query", "policy_denied"],
    ["higgsfield.website.secrets.list", "policy_denied"],
    ["higgsfield.game.deploy", "policy_denied"],
    ["higgsfield.account.transactions", "unsupported"],
    ["higgsfield.generate.list", "unsupported"],
    ["higgsfield.website.list", "unsupported"],
    ["higgsfield.future.command", "invalid_input"],
  ])("fails closed before executor invocation for %s", async (operationId, code) => {
    const { executor, provider } = createAdapter();

    const result = await provider.invoke(request(operationId));

    expect(result).toMatchObject({ ok: false, error: { code, retryable: false } });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it.each([
    ["higgsfield.soul-id.create", { name: "soul" }],
    ["higgsfield.marketing-studio.dtc-ads.generate", { prompt: "ad" }],
    ["higgsfield.product-photoshoot.create", { assetId: "asset-1" }],
    ["higgsfield.marketplace-cards.create", { assetId: "asset-1" }],
  ])("denies unapproved gated product operation %s before spawn", async (operationId, input) => {
    const { executor, provider } = createAdapter();

    const result = await provider.invoke(request(operationId, input, { idempotencyKey: "idem-gated-product-0001" }));

    expect(result).toMatchObject({
      ok: false,
      error: { code: "policy_denied", retryable: false },
      meta: { remoteState: "not_started" },
    });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("requires every claim and spend grant before paid generation can spawn", async () => {
    const { executor, provider } = createAdapter();
    const missingClaim = generationRequest("higgsfield.generate.create", {
      policyContext: { projectId: "project-001", claimIds: [], spendGrantId: "grant-001" },
    });
    const missingGrant = generationRequest("higgsfield.generate.create", {
      policyContext: { projectId: "project-001", claimIds: ["generation.submit"] },
    });

    await expect(provider.invoke(missingClaim)).resolves.toMatchObject({
      ok: false,
      error: { code: "policy_denied" },
    });
    await expect(provider.invoke(missingGrant)).resolves.toMatchObject({
      ok: false,
      error: { code: "policy_denied" },
    });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it.each(["", "short", "contains whitespace", "--global-flag", "line\nbreak", "x".repeat(513)])(
    "rejects a missing or malformed required idempotency key before spawn",
    async (key) => {
      const { executor, provider } = createAdapter();
      const invocation = generationRequest("higgsfield.generate.create", {
        idempotencyKey: key || undefined,
      });

      const result = await provider.invoke(invocation);

      expect(result).toMatchObject({
        ok: false,
        error: { code: "invalid_input", retryable: false },
        meta: { remoteState: "not_started" },
      });
      expect(executor.execute).not.toHaveBeenCalled();
    },
  );
});

describe("Higgsfield local provider adapter argv injection resistance", () => {
  it.each([
    "wan-2.5; touch /tmp/pwned",
    "$(touch /tmp/pwned)",
    "`touch /tmp/pwned`",
    "wan-2.5\n--help",
    "--help",
    "../../etc/passwd",
    "wan-2.5\u2028--help",
    "wan-2.5\u2029--help",
  ])("rejects hostile target identity %j before argv construction", async (targetKey) => {
    const { executor, provider } = createAdapter();
    const invocation = generationRequest("higgsfield.generate.create", {
      input: { targetKey, parameters: { prompt: "hello" }, assets: [] },
    });

    const result = await provider.invoke(invocation);

    expect(result).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it.each([
    { targetKey: "wan-2.5", parameters: { prompt: "ok", unknownFlag: "value" }, assets: [] },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, args: ["auth", "token"] },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, command: "auth token" },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, executable: "/bin/sh" },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, globalFlags: ["--debug"] },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, fromFile: "/tmp/request.json" },
    { targetKey: "wan-2.5", parameters: { prompt: "ok" }, path: "../../etc/passwd" },
  ])("rejects unknown params and pass-through fields before spawn", async (input) => {
    const { executor, provider } = createAdapter();

    const result = await provider.invoke(generationRequest("higgsfield.generate.create", { input }));

    expect(result).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("keeps shell metacharacters in an approved prompt as one literal argv element", async () => {
    const prompt = "literal ; $(echo no) `no` && | > <";
    const executor = createExecutor(success({ id: "job-literal", status: "queued", assets: [] }));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    await provider.invoke(
      generationRequest("higgsfield.generate.create", {
        input: { targetKey: "wan-2.5", parameters: { prompt }, assets: [] },
      }),
    );

    const execution = executor.execute.mock.calls[0][0];
    expect(execution.argv).toContain(prompt);
    expect(execution.argv.filter((part: string) => part === prompt)).toHaveLength(1);
    expect(execution).not.toHaveProperty("command");
    expect(execution).not.toHaveProperty("shell");
  });
});

describe("Higgsfield local provider adapter safe execution boundary", () => {
  it("passes every fixed output bound and only the POSIX environment allowlist", async () => {
    const executor = createExecutor();
    const environment = {
      PATH: "/usr/local/bin:/usr/bin",
      HOME: "/Users/tester",
      TMPDIR: "/private/tmp",
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      SSL_CERT_FILE: "/etc/ssl/cert.pem",
      SSL_CERT_DIR: "/etc/ssl/certs",
      HIGGSFIELD_API_KEY: "hf-secret",
      HIGGSFIELD_BIN: "/attacker/higgsfield",
      HIGGS_BIN: "/attacker/hf",
      OPENAI_API_KEY: "openai-secret",
      AWS_SECRET_ACCESS_KEY: "aws-secret",
      GOOGLE_APPLICATION_CREDENTIALS: "/secret/google.json",
      AZURE_CLIENT_SECRET: "azure-secret",
      ELECTRON_TOKEN: "electron-secret",
      AUTHORIZATION: "Bearer raw-token",
      COOKIE: "session=raw-cookie",
      HTTPS_PROXY: "https://user:password@proxy.example",
    };
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment,
      platform: "posix",
    });

    await provider.invoke(request("higgsfield.system.version"));

    expect(HIGGSFIELD_OUTPUT_LIMITS).toEqual({
      stdoutBytes: 1_048_576,
      stderrBytes: 262_144,
      combinedBytes: 1_310_720,
      jsonDepth: 32,
      arrayItems: 10_000,
      stringBytes: 65_536,
      artifactCount: 100,
    });
    expect(executor.execute.mock.calls[0][0]).toMatchObject({
      limits: HIGGSFIELD_OUTPUT_LIMITS,
      env: {
        PATH: "/usr/local/bin:/usr/bin",
        HOME: "/Users/tester",
        TMPDIR: "/private/tmp",
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8",
        SSL_CERT_FILE: "/etc/ssl/cert.pem",
        SSL_CERT_DIR: "/etc/ssl/certs",
      },
      timeoutMs: expect.any(Number),
    });
    expect(Object.keys(executor.execute.mock.calls[0][0].env).sort()).toEqual(
      ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"].sort(),
    );
  });

  it("uses only the Windows environment allowlist", async () => {
    const executor = createExecutor();
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      platform: "win32",
      environment: {
        PATH: "C:\\Windows\\System32",
        USERPROFILE: "C:\\Users\\tester",
        APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
        LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
        TEMP: "C:\\Temp",
        TMP: "C:\\Tmp",
        HOME: "/must/not/pass",
        AWS_SESSION_TOKEN: "must-not-pass",
      },
    });

    await provider.invoke(request("higgsfield.system.version"));

    expect(executor.execute.mock.calls[0][0].env).toEqual({
      PATH: "C:\\Windows\\System32",
      USERPROFILE: "C:\\Users\\tester",
      APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
      LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
      TEMP: "C:\\Temp",
      TMP: "C:\\Tmp",
    });
  });

  it.each(["stdoutBytes", "stderrBytes", "combinedBytes", "jsonDepth", "arrayItems", "stringBytes", "artifactCount"])(
    "maps a %s executor bound violation without parsing partial output",
    async (limit) => {
      const partial = "Bearer partial-secret /Users/tester/.config/higgsfield";
      const executor = createExecutor({
        kind: "output_limit_exceeded",
        limit,
        stdout: partial,
        stderr: partial,
      });
      const diagnostics: unknown[] = [];
      const provider = createHiggsfieldProviderAdapter({
        executor,
        manifest: HIGGSFIELD_PROVIDER_MANIFEST,
        catalogSnapshots: CATALOG_SNAPSHOTS,
        environment: {},
        platform: "posix",
        onDiagnostic: (diagnostic: unknown) => diagnostics.push(diagnostic),
      });

      const result = await provider.invoke(request("higgsfield.system.version"));

      expect(result).toMatchObject({
        ok: false,
        error: { code: "output_limit_exceeded", retryable: false },
      });
      expect(JSON.stringify({ result, diagnostics })).not.toContain(partial);
    },
  );
});

describe("Higgsfield local provider adapter error redaction", () => {
  const hostileValues = [
    "hf_live_0123456789abcdef",
    "Bearer super-secret-token",
    "Cookie: sid=session-secret",
    "session=private-session-value",
    "https://user:password@example.com/result?X-Amz-Signature=signed-secret",
    "person@example.com",
    "/Users/niko.dev/Library/Application Support/higgsfield/credentials.json",
    "/private/tmp/higgsfield-input-123",
    "C:\\Users\\niko\\AppData\\Roaming\\higgsfield\\credentials.json",
    "Error: provider failed\n    at secret (/app/private/provider.ts:10:2)",
  ];

  it("never returns or diagnoses hostile stdout, stderr, nested causes, or provider bodies", async () => {
    const hostile = hostileValues.join(" | ");
    const nested = { cause: { response: { body: hostile }, authorization: hostile } };
    const executor = createExecutor({
      kind: "failure",
      exitCode: 1,
      stdout: hostile,
      stderr: hostile,
      error: Object.assign(new Error(hostile), nested),
    });
    const diagnostics: unknown[] = [];
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
      onDiagnostic: (diagnostic: unknown) => diagnostics.push(diagnostic),
    });

    const result = await provider.invoke(request("higgsfield.system.version"));
    const serialized = JSON.stringify({ result, diagnostics });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "provider_rejected", message: expect.any(String) },
    });
    for (const hostileValue of hostileValues) expect(serialized).not.toContain(hostileValue);
    expect(serialized).not.toContain("stdout");
    expect(serialized).not.toContain("stderr");
    expect(serialized).not.toContain("credentials.json");
  });

  it("normalizes a rejected throwing object without inspecting it or throwing publicly", async () => {
    const throwingObject = new Proxy(Object.create(null), {
      get() {
        throw new Error("Bearer getter-secret");
      },
      ownKeys() {
        throw new Error("Cookie: getter-session");
      },
    });
    const executor = { execute: vi.fn(async () => Promise.reject(throwingObject)) };
    const diagnostics: unknown[] = [];
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
      onDiagnostic: (diagnostic: unknown) => diagnostics.push(diagnostic),
    });

    const promise = provider.invoke(request("higgsfield.system.version"));

    await expect(promise).resolves.toMatchObject({
      ok: false,
      error: { code: "internal", retryable: false },
    });
    expect(JSON.stringify(await promise)).not.toContain("getter-secret");
    expect(JSON.stringify(diagnostics)).not.toContain("getter-session");
  });
});

describe("Higgsfield local provider adapter cancellation and cleanup", () => {
  it("returns cancelled before spawn for an already-aborted signal", async () => {
    const { executor, provider } = createAdapter();
    const controller = new AbortController();
    controller.abort();

    const result = await provider.invoke(generationRequest(), { signal: controller.signal });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "cancelled", retryable: false },
      meta: {
        remoteState: "not_started",
        cancellation: "before_start",
      },
    });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("forwards cancellation, preserves a safely known job ID, and claims only local wait stopped", async () => {
    const executor = {
      execute: vi.fn(
        ({ signal }: { signal?: AbortSignal }) =>
          new Promise((resolve) => {
            signal?.addEventListener(
              "abort",
              () =>
                resolve({
                  kind: "cancelled",
                  remoteJobId: "job-known-before-cancel",
                  remoteState: "accepted",
                }),
              { once: true },
            );
          }),
      ),
    };
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });
    const controller = new AbortController();

    const pending = provider.invoke(generationRequest(), { signal: controller.signal });
    await vi.waitFor(() => expect(executor.execute).toHaveBeenCalledTimes(1));
    expect(executor.execute.mock.calls[0][0].signal).toBe(controller.signal);
    controller.abort();
    const result = await pending;

    expect(result).toMatchObject({
      ok: false,
      error: { code: "cancelled", retryable: false },
      meta: {
        remoteJobId: "job-known-before-cancel",
        remoteState: "accepted",
        cancellation: "local_wait_stopped",
      },
    });
    expect(JSON.stringify(result).toLowerCase()).not.toContain("remote_cancel");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("provider_cancel");
  });

  it.each([
    success({ id: "job-clean", status: "completed", assets: [] }),
    { kind: "failure", exitCode: 1, stdout: "", stderr: "failed" },
    { kind: "timed_out" },
    { kind: "output_limit_exceeded", limit: "combinedBytes" },
    { kind: "cancelled", remoteState: "unknown" },
  ])("cleans materialized project assets for executor outcome %#", async (executorResult) => {
    const cleanup = vi.fn(async () => undefined);
    const materializeProjectAsset = vi.fn(async () => ({
      cliValue: "/private/tmp/trusted-project-input/asset-001.png",
      cleanup,
    }));
    const executor = createExecutor(executorResult);
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
      materializeProjectAsset,
    });
    const invocation = generationRequest("higgsfield.generate.create", {
      input: {
        targetKey: "wan-2.5",
        parameters: { prompt: "asset test" },
        assets: [{ assetId: "asset-001", parameter: "image" }],
      },
    });

    const result = await provider.invoke(invocation);

    expect(materializeProjectAsset).toHaveBeenCalledWith({
      projectId: "project-001",
      assetId: "asset-001",
    });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("/private/tmp/trusted-project-input");
  });
});

describe("Higgsfield local provider adapter idempotency", () => {
  it("replays the same local submission key without spawning a second paid job", async () => {
    const executor = createExecutor(success({ id: "job-once", status: "queued", assets: [] }));
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });
    const first = generationRequest("higgsfield.generate.create", {
      requestId: "request-first",
      idempotencyKey: "idem-replay-00000001",
    });
    const second = generationRequest("higgsfield.generate.create", {
      requestId: "request-second",
      idempotencyKey: "idem-replay-00000001",
    });

    const [firstResult, secondResult] = await Promise.all([provider.invoke(first), provider.invoke(second)]);

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(firstResult.meta.idempotencyKeyHash).toBe(secondResult.meta.idempotencyKeyHash);
    expect(firstResult.meta.remoteJobId).toBe("job-once");
    expect(secondResult.meta.remoteJobId).toBe("job-once");
    expect(secondResult.meta.requestId).toBe("request-second");
  });

  it("does not automatically retry an ambiguous paid create", async () => {
    const executor = createExecutor({ kind: "ambiguous_submission" });
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    const result = await provider.invoke(generationRequest());

    expect(result).toMatchObject({
      ok: false,
      error: { code: "ambiguous_submission", retryable: false },
      meta: { remoteState: "unknown" },
    });
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it("does not treat absence of a remote job ID as permission to resubmit", async () => {
    const executor = createExecutor({ kind: "ambiguous_submission", remoteState: "unknown" });
    const provider = createHiggsfieldProviderAdapter({
      executor,
      manifest: HIGGSFIELD_PROVIDER_MANIFEST,
      catalogSnapshots: CATALOG_SNAPSHOTS,
      environment: {},
      platform: "posix",
    });

    const first = await provider.invoke(generationRequest());
    const replay = await provider.invoke(generationRequest());

    expect(first).toMatchObject({ ok: false, error: { code: "ambiguous_submission" } });
    expect(replay).toMatchObject({ ok: false, error: { code: "ambiguous_submission" } });
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });
});
