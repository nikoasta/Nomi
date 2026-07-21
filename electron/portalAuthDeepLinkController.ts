import { BrowserWindow } from "electron";
import type { App } from "electron";
import { PORTAL_AUTH_PROTOCOL, portalAuthDeepLinkToRendererUrl } from "./portalAuthDeepLink";

type CreateWindow = (options?: { rendererUrl?: string }) => Promise<BrowserWindow>;

export function createPortalAuthDeepLinkController(options: {
  app: App;
  getRendererUrl: () => string;
  createWindow: CreateWindow;
}) {
  let pendingRendererUrl: string | null = null;

  function rendererUrlFromDeepLink(deepLinkUrl: string): string | null {
    return portalAuthDeepLinkToRendererUrl({ deepLinkUrl, rendererUrl: options.getRendererUrl() });
  }

  function extractDeepLinkUrl(values: readonly string[]): string | null {
    for (const value of values) {
      if (rendererUrlFromDeepLink(value)) return value;
    }
    return null;
  }

  function openDeepLink(deepLinkUrl: string): boolean {
    const rendererUrl = rendererUrlFromDeepLink(deepLinkUrl);
    if (!rendererUrl) return false;
    const [existing] = BrowserWindow.getAllWindows();
    if (existing && !existing.isDestroyed()) {
      if (existing.isMinimized()) existing.restore();
      existing.focus();
      void existing.loadURL(rendererUrl).catch((error) => {
        console.error("[nomi:desktop] failed to open portal auth callback:", error);
      });
      return true;
    }
    pendingRendererUrl = rendererUrl;
    if (options.app.isReady()) {
      void options.createWindow({ rendererUrl }).catch((error) => {
        console.error("[nomi:desktop] failed to create portal auth callback window:", error);
      });
    }
    return true;
  }

  function registerProtocolClient(): void {
    options.app.setAsDefaultProtocolClient(PORTAL_AUTH_PROTOCOL);
    options.app.on("open-url", (event, url) => {
      event.preventDefault();
      openDeepLink(url);
    });
  }

  function consumePendingRendererUrl(): string | null {
    const rendererUrl = pendingRendererUrl;
    pendingRendererUrl = null;
    return rendererUrl;
  }

  return { consumePendingRendererUrl, extractDeepLinkUrl, openDeepLink, registerProtocolClient };
}
