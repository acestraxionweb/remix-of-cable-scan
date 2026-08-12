import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const TEST_CODES = [
  { elid: "HDGBQY02DZI4QV", entity: "cableMaster", description: "Fiber-optic, 48 fibers" },
  { elid: "060I5XCW2PRIPB", entity: "powerCable", description: "PWR-1044" },
  { elid: "WZ41CWBR8A1D1K", entity: "dataCable", description: "FCBL-1072" },
  { elid: "ET45DWFK89DZCD", entity: "cableMaster", description: "Power cable type" },
];

export const Route = createFileRoute("/test-qrcodes")({
  head: () => ({
    meta: [
      { title: "Test QR codes — Cable Scanner" },
      {
        name: "description",
        content: "Sample cable ELID QR codes to test the Cable Scanner PWA from a second screen.",
      },
      { property: "og:title", content: "Test QR codes — Cable Scanner" },
      {
        property: "og:description",
        content: "Sample cable ELID QR codes for testing continuous scanning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestCodes,
});

function TestCodes() {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const QRCode = (await import("qrcode")).default;
      const entries = await Promise.all(
        TEST_CODES.map(
          async (code) =>
            [
              code.elid,
              await QRCode.toDataURL(code.elid, { margin: 1, width: 320, color: { light: "#fff" } }),
            ] as const,
        ),
      );
      setImages(Object.fromEntries(entries));
    })();
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">Test QR codes</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Open this page on a computer and scan the codes with the phone running the scanner.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TEST_CODES.map((code) => (
          <article key={code.elid} className="rounded-2xl border border-border bg-card p-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-white">
              {images[code.elid] ? (
                <img
                  src={images[code.elid]}
                  alt={`QR code encoding cable ELID ${code.elid}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="h-full w-full animate-pulse bg-muted" />
              )}
            </div>
            <p className="mt-3 font-mono text-xs text-scan-accent">{code.elid}</p>
            <p className="text-xs text-muted-foreground">
              {code.entity} · {code.description}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
