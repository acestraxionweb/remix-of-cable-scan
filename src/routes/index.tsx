import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";

import { CableScanner } from "@/components/CableScanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cable Scanner — Scan cable barcodes for FNT Command data" },
      {
        name: "description",
        content:
          "Field scanner PWA: point your phone at a cable barcode or QR label and instantly see its FNT Command cable data, with continuous scanning.",
      },
      { property: "og:title", content: "Cable Scanner — Scan cable barcodes for FNT Command data" },
      {
        property: "og:description",
        content:
          "Field scanner PWA: point your phone at a cable barcode or QR label and instantly see its FNT Command cable data, with continuous scanning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1a1a2e" },
    ],
    links: [{ rel: "manifest", href: "/manifest.json" }],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-[100dvh] w-full bg-background">
      <ClientOnly
        fallback={
          <div className="flex h-[100dvh] items-center justify-center text-sm text-muted-foreground">
            Starting camera…
          </div>
        }
      >
        <CableScanner />
      </ClientOnly>
    </main>
  );
}
