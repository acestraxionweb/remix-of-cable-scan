import type { CableValue } from "@/lib/cable.functions";

type Props = {
  state:
    | { status: "idle" }
    | { status: "loading"; elid: string }
    | { status: "found"; elid: string; data: Record<string, CableValue> }
    | { status: "error"; elid: string; message: string };
  onClose: () => void;
};

function Field({ label, value }: { label: string; value: CableValue | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-medium text-foreground">{String(value)}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[90, 60, 75, 50].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded-full bg-muted"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function CableInfoCard({ state, onClose }: Props) {
  if (state.status === "idle") return null;

  const data = state.status === "found" ? state.data : null;
  const ok = state.status === "found";

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 animate-in slide-in-from-bottom duration-300">
      <div className="glass-card mx-2 mb-2 rounded-t-3xl border border-border shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Dismiss cable details"
          className="mx-auto mt-2 block h-1.5 w-12 rounded-full bg-muted-foreground/50"
        />
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              state.status === "loading"
                ? "bg-secondary text-secondary-foreground"
                : ok
                  ? "bg-scan-accent/20 text-scan-accent"
                  : "bg-scan-danger/20 text-scan-danger"
            }`}
          >
            {state.status === "loading" ? "Looking up…" : ok ? "✓ Found" : "✕ Not found"}
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">
            ELID: {state.elid}
          </span>
        </div>

        <div className="max-h-[52vh] overflow-y-auto border-t border-border px-5 py-4">
          {state.status === "loading" && <Skeleton />}

          {state.status === "error" && (
            <p className="text-sm text-scan-danger">{state.message}</p>
          )}

          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" value={data["type"]} />
                <Field label="Category" value={data["category"]} />
              </div>
              <Field label="Description" value={data["explanation"]} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Object ID" value={data["id"] ?? data["visibleId"]} />
                <Field label="Entity" value={data["_entityType"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Connector 1" value={data["connector1"]} />
                <Field label="Connector 2" value={data["connector2"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Diameter"
                  value={data["diameter"] != null ? `${data["diameter"]} mm` : null}
                />
                <Field
                  label="Weight"
                  value={data["weight"] != null ? `${data["weight"]} kg/km` : null}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Manufacturer" value={data["manufacturer"]} />
                <Field label="Part #" value={data["manufacturerArticleNumber"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Length"
                  value={data["length"] != null ? `${data["length"]} m` : null}
                />
                <Field label="Medium" value={data["medium"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Plan status" value={data["planStatus"]} />
                <Field label="Install date" value={data["installDate"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Line name" value={data["tcoLinename"]} />
                <Field label="Service type" value={data["tcoServiceType"]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Attenuation"
                  value={data["attenuation"] != null ? `${data["attenuation"]} dB` : null}
                />
                <Field
                  label="Resistance"
                  value={data["resistance"] != null ? `${data["resistance"]} Ω` : null}
                />
              </div>
              <Field label="Remark" value={data["remark"]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
