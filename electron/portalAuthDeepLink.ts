export const PORTAL_AUTH_PROTOCOL = "nomi";
export const PORTAL_AUTH_HOST = "portal-auth";
export const PORTAL_AUTH_DEEP_LINK_ORIGIN = `${PORTAL_AUTH_PROTOCOL}://${PORTAL_AUTH_HOST}`;

export function isPortalAuthDeepLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === `${PORTAL_AUTH_PROTOCOL}:` && url.hostname === PORTAL_AUTH_HOST;
  } catch {
    return false;
  }
}

export function portalAuthDeepLinkToRendererUrl(input: { deepLinkUrl: string; rendererUrl: string }): string | null {
  try {
    const deepLinkUrl = new URL(input.deepLinkUrl);
    if (!isPortalAuthDeepLink(deepLinkUrl.toString())) return null;
    const authPayload = deepLinkUrl.hash || (deepLinkUrl.search ? `#${deepLinkUrl.search.slice(1)}` : "");
    if (!authPayload) return null;
    const rendererUrl = new URL(input.rendererUrl);
    rendererUrl.hash = authPayload;
    return rendererUrl.toString();
  } catch {
    return null;
  }
}
