const SW_PATH = "/sw.js";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.top !== window.self) return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    return new URLSearchParams(window.location.search).get("sw") === "off";
  }
  return false;
}

async function unregisterAppServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const url = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? "";
        return url.endsWith(SW_PATH);
      })
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppServiceWorkers();
    return;
  }
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_PATH, { scope: "/" }).catch(() => {});
  });
}
