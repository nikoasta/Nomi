import { describe, expect, it } from "vitest";

import { isPortalAuthDeepLink, portalAuthDeepLinkToRendererUrl } from "./portalAuthDeepLink";

describe("portal auth deep links", () => {
  it("recognizes only the Nomi portal auth callback", () => {
    expect(isPortalAuthDeepLink("nomi://portal-auth#access_token=token-1")).toBe(true);
    expect(isPortalAuthDeepLink("nomi://other#access_token=token-1")).toBe(false);
    expect(isPortalAuthDeepLink("https://cut.eva.mba/#access_token=token-1")).toBe(false);
  });

  it("maps a portal auth callback into the packaged renderer entry", () => {
    expect(
      portalAuthDeepLinkToRendererUrl({
        deepLinkUrl: "nomi://portal-auth#access_token=token-1&refresh_token=refresh-1&type=magiclink",
        rendererUrl: "file:///Applications/Nomi.app/Contents/Resources/app.asar/dist/index.html#/studio",
      }),
    ).toBe(
      "file:///Applications/Nomi.app/Contents/Resources/app.asar/dist/index.html#access_token=token-1&refresh_token=refresh-1&type=magiclink",
    );
  });

  it("rejects callback links without an auth payload", () => {
    expect(
      portalAuthDeepLinkToRendererUrl({
        deepLinkUrl: "nomi://portal-auth",
        rendererUrl: "file:///Applications/Nomi.app/Contents/Resources/app.asar/dist/index.html",
      }),
    ).toBeNull();
  });
});
