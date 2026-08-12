import { useCallback, useEffect, useRef, useState } from "react";

import { CableInfoCard } from "@/components/CableInfoCard";
import { cacheGet, cacheSet } from "@/lib/cable-cache";
import { getCable, type CableLookupResult, type CableValue } from "@/lib/cable.functions";

type CardState =
  | { status: "idle" }
  | { status: "loading"; elid: string }
  | { status: "found"; elid: string; data: Record<string, CableValue> }
  | { status: "error"; elid: string; message: string };

const DEBOUNCE_MS = 2000;
const READER_ID = "cable-reader";

export function CableScanner() {
  const [card, setCard] = useState<CardState>({ status: "idle" });
  const [scanCount, setScanCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<unknown>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const lookup = useCallback(async (rawCode: string) => {
    const elid = rawCode.trim();
    if (!elid) return;
    setCard({ status: "loading", elid });
    setScanCount((count) => count + 1);

    const cached = await cacheGet<Record<string, CableValue>>(elid.toUpperCase());
    if (cached) {
      setCard({ status: "found", elid, data: cached });
      return;
    }

    try {
      const result = (await getCable({ data: { elid } })) as CableLookupResult;
      setOnline(true);
      if (result.success) {
        await cacheSet(elid.toUpperCase(), result.data);
        setCard({ status: "found", elid, data: result.data });
      } else {
        setCard({ status: "error", elid, message: result.message });
      }
    } catch {
      setOnline(false);
      setCard({
        status: "error",
        elid,
        message: "Network error — could not reach the cable service.",
      });
    }
  }, []);

  const onDecoded = useCallback(
    (text: string) => {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last.code === text && now - last.at < DEBOUNCE_MS) return;
      lastScanRef.current = { code: text, at: now };
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
      void lookup(text);
    },
    [lookup],
  );

  // Continuous scanning loop, restarted whenever the camera facing mode changes.
  useEffect(() => {
    let cancelled = false;
    let instance: {
      start: (
        camera: unknown,
        config: unknown,
        onSuccess: (text: string) => void,
        onError: () => void,
      ) => Promise<void>;
      stop: () => Promise<void>;
      clear: () => void;
      pause: (shouldPause?: boolean) => void;
      resume: () => void;
      getState: () => number;
    } | null = null;

    void (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        instance = new Html5Qrcode(READER_ID) as unknown as typeof instance;
        scannerRef.current = instance;
        await instance!.start(
          { facingMode: facing },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.777 },
          (text: string) => onDecoded(text),
          () => {},
        );
        if (!cancelled) setCameraError(null);
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error instanceof Error
              ? `Camera unavailable: ${error.message}`
              : "Camera unavailable on this device.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const current = instance;
      scannerRef.current = null;
      if (current) {
        current
          .stop()
          .then(() => current.clear())
          .catch(() => {});
      }
    };
  }, [facing, onDecoded]);

  // Pause the camera while the tab is hidden, resume when it comes back.
  useEffect(() => {
    const onVisibility = () => {
      const scanner = scannerRef.current as {
        pause?: (s?: boolean) => void;
        resume?: () => void;
        getState?: () => number;
      } | null;
      if (!scanner) return;
      try {
        if (document.hidden) scanner.pause?.(true);
        else scanner.resume?.();
      } catch {
        /* scanner not in a pausable state */
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const toggleTorch = async () => {
    const scanner = scannerRef.current as {
      applyVideoConstraints?: (c: MediaTrackConstraints) => Promise<void>;
    } | null;
    if (!scanner?.applyVideoConstraints) return;
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      } as unknown as MediaTrackConstraints);
      setTorchOn((on) => !on);
    } catch {
      setCameraError("Torch is not supported by this camera.");
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <div id={READER_ID} className="absolute inset-0 h-full w-full bg-background" />

      {/* Scan region overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative h-64 w-64 rounded-2xl border-2 border-scan-accent/70 shadow-[0_0_0_9999px_oklch(0.15_0.04_285_/_55%)]"
          style={{ ["--scan-height" as string]: "248px" }}
        >
          <div className="absolute inset-x-2 top-1 h-0.5 rounded-full bg-scan-accent animate-scanline shadow-[0_0_12px_var(--scan-accent)]" />
        </div>
      </div>

      {/* Top bar */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-scan-header/70 px-4 py-3 backdrop-blur-md">
        <span
          aria-label={online ? "Connected" : "Offline"}
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-scan-accent" : "bg-scan-danger"}`}
        />
        <h1 className="flex-1 truncate text-sm font-semibold tracking-wide">Cable Scanner</h1>
        <span className="rounded-full bg-background/50 px-2.5 py-1 text-xs font-semibold text-scan-accent">
          {scanCount} scans
        </span>
        <button
          onClick={() => void toggleTorch()}
          aria-label="Toggle flashlight"
          className={`rounded-full px-2.5 py-1 text-base ${torchOn ? "bg-scan-accent/25" : "bg-background/50"}`}
        >
          🔦
        </button>
        <button
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          aria-label="Switch camera"
          className="rounded-full bg-background/50 px-2.5 py-1 text-base"
        >
          🔄
        </button>
        <button
          onClick={() => setManualOpen((open) => !open)}
          aria-label="Enter ELID manually"
          className="rounded-full bg-background/50 px-2.5 py-1 text-base"
        >
          ⌨️
        </button>
      </header>

      {manualOpen && (
        <form
          className="absolute inset-x-0 top-14 z-20 flex gap-2 px-4"
          onSubmit={(event) => {
            event.preventDefault();
            void lookup(manualValue);
            setManualValue("");
          }}
        >
          <input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Enter ELID, ID or visible ID"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card/80 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Look up
          </button>
        </form>
      )}

      {cameraError && (
        <p className="absolute inset-x-0 top-1/2 z-10 mx-6 -translate-y-40 rounded-lg bg-card/85 p-3 text-center text-xs text-muted-foreground">
          {cameraError} Use the keyboard button to enter an ELID manually.
        </p>
      )}

      <CableInfoCard state={card} onClose={() => setCard({ status: "idle" })} />
    </div>
  );
}
