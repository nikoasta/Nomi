import { describe, expect, it } from "vitest";

import { HIGGSFIELD_PROVIDER_MANIFEST, getHiggsfieldOperation } from "./higgsfieldProviderManifest";

type InventoryRow = readonly [
  id: string,
  cliPath: string,
  execution: "immediate" | "job" | "stream",
  exposure: "allowed" | "gated" | "deferred" | "prohibited",
];

const EXPECTED_INVENTORY = [
  ["higgsfield.system.version", "version", "immediate", "allowed"],
  ["higgsfield.auth.login", "auth login", "stream", "gated"],
  ["higgsfield.auth.logout", "auth logout", "immediate", "gated"],
  ["higgsfield.auth.token", "auth token", "immediate", "prohibited"],
  ["higgsfield.account.status", "account status", "immediate", "allowed"],
  ["higgsfield.account.transactions", "account transactions", "immediate", "deferred"],
  ["higgsfield.workspace.list", "workspace list", "immediate", "deferred"],
  ["higgsfield.workspace.set", "workspace set", "immediate", "gated"],
  ["higgsfield.workspace.status", "workspace status", "immediate", "allowed"],
  ["higgsfield.workspace.unset", "workspace unset", "immediate", "gated"],
  ["higgsfield.model.list", "model list", "immediate", "allowed"],
  ["higgsfield.model.get", "model get", "immediate", "allowed"],
  ["higgsfield.workflow.list", "workflow list", "immediate", "allowed"],
  ["higgsfield.workflow.get", "workflow get", "immediate", "allowed"],
  ["higgsfield.voices.list", "voices list", "immediate", "allowed"],
  ["higgsfield.voices.get", "voices get", "immediate", "allowed"],
  ["higgsfield.upload.list", "upload list", "immediate", "deferred"],
  ["higgsfield.upload.create", "upload create", "job", "gated"],
  ["higgsfield.generate.cost", "generate cost", "immediate", "gated"],
  ["higgsfield.generate.create", "generate create", "job", "gated"],
  ["higgsfield.generate.workflow", "generate workflow", "job", "gated"],
  ["higgsfield.generate.get", "generate get", "immediate", "gated"],
  ["higgsfield.generate.list", "generate list", "immediate", "deferred"],
  ["higgsfield.generate.wait", "generate wait", "stream", "gated"],
  ["higgsfield.soul-id.create", "soul-id create", "job", "gated"],
  ["higgsfield.soul-id.get", "soul-id get", "immediate", "gated"],
  ["higgsfield.soul-id.list", "soul-id list", "immediate", "gated"],
  ["higgsfield.soul-id.wait", "soul-id wait", "stream", "gated"],
  ["higgsfield.marketing-studio.ad-formats.list", "marketing-studio ad-formats list", "immediate", "gated"],
  ["higgsfield.marketing-studio.ad-references.create", "marketing-studio ad-references create", "job", "gated"],
  ["higgsfield.marketing-studio.ad-references.get", "marketing-studio ad-references get", "immediate", "gated"],
  ["higgsfield.marketing-studio.ad-references.list", "marketing-studio ad-references list", "immediate", "gated"],
  ["higgsfield.marketing-studio.avatars.create", "marketing-studio avatars create", "job", "gated"],
  ["higgsfield.marketing-studio.avatars.list", "marketing-studio avatars list", "immediate", "gated"],
  ["higgsfield.marketing-studio.brand-kits.fetch", "marketing-studio brand-kits fetch", "job", "gated"],
  ["higgsfield.marketing-studio.brand-kits.get", "marketing-studio brand-kits get", "immediate", "gated"],
  ["higgsfield.marketing-studio.brand-kits.list", "marketing-studio brand-kits list", "immediate", "gated"],
  ["higgsfield.marketing-studio.dtc-ads.generate", "marketing-studio dtc-ads generate", "job", "gated"],
  ["higgsfield.marketing-studio.hooks.list", "marketing-studio hooks list", "immediate", "gated"],
  ["higgsfield.marketing-studio.products.create", "marketing-studio products create", "job", "gated"],
  ["higgsfield.marketing-studio.products.fetch", "marketing-studio products fetch", "job", "gated"],
  ["higgsfield.marketing-studio.products.list", "marketing-studio products list", "immediate", "gated"],
  ["higgsfield.marketing-studio.settings.list", "marketing-studio settings list", "immediate", "gated"],
  ["higgsfield.marketing-studio.webproducts.create", "marketing-studio webproducts create", "job", "gated"],
  ["higgsfield.marketing-studio.webproducts.fetch", "marketing-studio webproducts fetch", "job", "gated"],
  ["higgsfield.marketing-studio.webproducts.list", "marketing-studio webproducts list", "immediate", "gated"],
  ["higgsfield.product-photoshoot.create", "product-photoshoot create", "job", "gated"],
  ["higgsfield.marketplace-cards.create", "marketplace-cards create", "job", "gated"],
  ["higgsfield.website.list", "website list", "immediate", "deferred"],
  ["higgsfield.website.status", "website status", "immediate", "deferred"],
  ["higgsfield.website.create", "website create", "job", "prohibited"],
  ["higgsfield.website.deploy", "website deploy", "job", "prohibited"],
  ["higgsfield.website.contest", "website contest", "job", "prohibited"],
  ["higgsfield.website.publish", "website publish", "job", "prohibited"],
  ["higgsfield.website.rename", "website rename", "job", "prohibited"],
  ["higgsfield.website.repo-access", "website repo-access", "immediate", "prohibited"],
  ["higgsfield.website.db.tables", "website db tables", "immediate", "prohibited"],
  ["higgsfield.website.db.schema", "website db schema", "immediate", "prohibited"],
  ["higgsfield.website.db.rows", "website db rows", "immediate", "prohibited"],
  ["higgsfield.website.db.query", "website db query", "immediate", "prohibited"],
  ["higgsfield.website.secrets.list", "website secrets list", "immediate", "prohibited"],
  ["higgsfield.website.secrets.set", "website secrets set", "immediate", "prohibited"],
  ["higgsfield.website.secrets.delete", "website secrets delete", "immediate", "prohibited"],
  ["higgsfield.game.deploy", "game deploy", "job", "prohibited"],
  ["higgsfield.game.publish", "game publish", "job", "prohibited"],
] as const satisfies readonly InventoryRow[];

const REQUIRED_IDEMPOTENCY = new Set([
  "higgsfield.upload.create",
  "higgsfield.generate.create",
  "higgsfield.generate.workflow",
  "higgsfield.soul-id.create",
  "higgsfield.marketing-studio.ad-references.create",
  "higgsfield.marketing-studio.avatars.create",
  "higgsfield.marketing-studio.brand-kits.fetch",
  "higgsfield.marketing-studio.dtc-ads.generate",
  "higgsfield.marketing-studio.products.create",
  "higgsfield.marketing-studio.products.fetch",
  "higgsfield.marketing-studio.webproducts.create",
  "higgsfield.marketing-studio.webproducts.fetch",
  "higgsfield.product-photoshoot.create",
  "higgsfield.marketplace-cards.create",
]);

const REQUIRED_CLAIMS: Readonly<Record<string, readonly string[]>> = {
  "higgsfield.auth.login": ["desktop.setup.interactive"],
  "higgsfield.auth.logout": ["desktop.setup.interactive"],
  "higgsfield.workspace.set": ["workspace.select"],
  "higgsfield.workspace.unset": ["workspace.select"],
  "higgsfield.upload.create": ["asset.upload"],
  "higgsfield.generate.cost": ["generation.estimate"],
  "higgsfield.generate.create": ["generation.submit"],
  "higgsfield.generate.workflow": ["generation.submit"],
  "higgsfield.generate.get": ["generation.read"],
  "higgsfield.generate.wait": ["generation.read"],
  "higgsfield.soul-id.create": ["soul.manage"],
  "higgsfield.soul-id.get": ["soul.read"],
  "higgsfield.soul-id.list": ["soul.read"],
  "higgsfield.soul-id.wait": ["soul.read"],
  "higgsfield.marketing-studio.ad-formats.list": ["marketing.read"],
  "higgsfield.marketing-studio.ad-references.create": ["marketing.manage"],
  "higgsfield.marketing-studio.ad-references.get": ["marketing.read"],
  "higgsfield.marketing-studio.ad-references.list": ["marketing.read"],
  "higgsfield.marketing-studio.avatars.create": ["marketing.manage"],
  "higgsfield.marketing-studio.avatars.list": ["marketing.read"],
  "higgsfield.marketing-studio.brand-kits.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.brand-kits.get": ["marketing.read"],
  "higgsfield.marketing-studio.brand-kits.list": ["marketing.read"],
  "higgsfield.marketing-studio.dtc-ads.generate": ["marketing.generate"],
  "higgsfield.marketing-studio.hooks.list": ["marketing.read"],
  "higgsfield.marketing-studio.products.create": ["marketing.manage"],
  "higgsfield.marketing-studio.products.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.products.list": ["marketing.read"],
  "higgsfield.marketing-studio.settings.list": ["marketing.read"],
  "higgsfield.marketing-studio.webproducts.create": ["marketing.manage"],
  "higgsfield.marketing-studio.webproducts.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.webproducts.list": ["marketing.read"],
  "higgsfield.product-photoshoot.create": ["product-pipeline.generate"],
  "higgsfield.marketplace-cards.create": ["product-pipeline.generate"],
};

function visitSchema(schema: unknown, path: string) {
  expect(schema, path).not.toBeNull();
  expect(typeof schema, path).toBe("object");
  if (schema === null || typeof schema !== "object") return;

  const node = schema as Record<string, unknown>;
  if (node.type === "string") {
    expect(node.maxLength, `${path}.maxLength`).toEqual(expect.any(Number));
  }
  if (node.type === "array") {
    expect(node.maxItems, `${path}.maxItems`).toEqual(expect.any(Number));
  }
  if (node.type === "object") {
    expect(node.additionalProperties, `${path}.additionalProperties`).toBe(false);
  }

  for (const key of ["properties", "$defs"]) {
    const children = node[key];
    if (!children || typeof children !== "object") continue;
    for (const [name, child] of Object.entries(children)) visitSchema(child, `${path}.${key}.${name}`);
  }
  for (const key of ["items", "not"]) {
    if (node[key] !== undefined) visitSchema(node[key], `${path}.${key}`);
  }
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (!Array.isArray(node[key])) continue;
    node[key].forEach((child, index) => visitSchema(child, `${path}.${key}[${index}]`));
  }
}

function collectSchemaFieldNames(schema: unknown, names: string[] = []): string[] {
  if (schema === null || typeof schema !== "object") return names;
  const node = schema as Record<string, unknown>;
  for (const key of ["properties", "$defs"]) {
    const children = node[key];
    if (!children || typeof children !== "object") continue;
    for (const [name, child] of Object.entries(children)) {
      names.push(name.toLowerCase());
      collectSchemaFieldNames(child, names);
    }
  }
  for (const key of ["items", "not"]) collectSchemaFieldNames(node[key], names);
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (!Array.isArray(node[key])) continue;
    for (const child of node[key]) collectSchemaFieldNames(child, names);
  }
  return names;
}

describe("Higgsfield CLI 1.1.13 provider manifest", () => {
  it("freezes provider identity, evidence, versioning, and all 65 stable operations", () => {
    expect(HIGGSFIELD_PROVIDER_MANIFEST).toMatchObject({
      schemaVersion: "provider-capabilities.v1",
      providerId: "higgsfield-cli",
      manifestVersion: expect.any(String),
      source: {
        product: "higgsfield",
        cliVersion: "1.1.13",
        evidenceRevision: "11bfed2733870848f3489335c1bf3d91961ccd4a",
      },
    });
    expect(HIGGSFIELD_PROVIDER_MANIFEST.manifestVersion.length).toBeGreaterThan(0);

    const actual = HIGGSFIELD_PROVIDER_MANIFEST.operations.map((operation) => [
      operation.id,
      operation.cliPath.join(" "),
      operation.execution,
      operation.policy.exposure,
    ]);
    expect(actual).toEqual(EXPECTED_INVENTORY);
    expect(new Set(actual.map(([id]) => id)).size).toBe(65);
  });

  it("freezes default decisions, required claims, idempotency, and side-effect policy", () => {
    for (const operation of HIGGSFIELD_PROVIDER_MANIFEST.operations) {
      expect(operation.policy.defaultDecision).toBe(operation.policy.exposure === "allowed" ? "allow" : "deny");
      expect(operation.policy.requiredClaims).toEqual(REQUIRED_CLAIMS[operation.id] ?? []);
      expect(operation.idempotency).toBe(REQUIRED_IDEMPOTENCY.has(operation.id) ? "required" : "none");
      expect(["none", "local-auth", "account-state", "upload", "paid-job", "publish-admin"]).toContain(
        operation.policy.sideEffect,
      );
      if (operation.policy.exposure === "prohibited") {
        expect(operation.policy.reasonCode).toEqual(expect.any(String));
        expect(operation.policy.reasonCode?.length).toBeGreaterThan(0);
      }
    }

    expect(getHiggsfieldOperation("higgsfield.auth.login")?.policy.sideEffect).toBe("local-auth");
    expect(getHiggsfieldOperation("higgsfield.upload.create")?.policy.sideEffect).toBe("upload");
    expect(getHiggsfieldOperation("higgsfield.generate.create")?.policy.sideEffect).toBe("paid-job");
    expect(getHiggsfieldOperation("higgsfield.website.publish")?.policy.sideEffect).toBe("publish-admin");
  });

  it("embeds closed bounded JSON Schema 2020-12 inputs and outputs with stable IDs", () => {
    for (const operation of HIGGSFIELD_PROVIDER_MANIFEST.operations) {
      const suffix = operation.id.replace(/^higgsfield\./, "");
      for (const [direction, schema] of [
        ["input", operation.inputSchema],
        ["output", operation.outputSchema],
      ] as const) {
        expect(schema).toMatchObject({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: `hf://schema/1.1.13/${suffix}/${direction}@1`,
          additionalProperties: false,
        });
        visitSchema(schema, `${operation.id}.${direction}`);
        const fieldNames = collectSchemaFieldNames(schema);
        for (const forbidden of [
          "apikey",
          "api_key",
          "authorization",
          "cookie",
          "credential",
          "password",
          "rawoutput",
          "stderr",
          "stdout",
          "token",
        ]) {
          expect(
            fieldNames.some((name) => name.includes(forbidden)),
            `${operation.id}.${direction} contains field ${forbidden}`,
          ).toBe(false);
        }
      }
    }
  });

  it("does not accept aliases, global flags, generic commands, or future operations", () => {
    for (const unknown of [
      "help",
      "hf generate create",
      "higgs generate create",
      "--version",
      "higgsfield.run",
      "higgsfield.command",
      "higgsfield.generate.cancel",
      "higgsfield.mcp.future-command",
    ]) {
      expect(getHiggsfieldOperation(unknown)).toBeUndefined();
    }

    const serialized = JSON.stringify(HIGGSFIELD_PROVIDER_MANIFEST);
    expect(serialized).not.toContain("args: string[]");
    expect(serialized).not.toContain("executableOverride");
    expect(serialized).not.toContain("--from-file");
  });
});
