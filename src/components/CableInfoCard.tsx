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

const TYPE_LABELS: Record<string, string> = {
  building: "Building",
  room: "Room",
  floor: "Floor",
  campus: "Campus",
  cableMaster: "Cable type",
  powerCable: "Power cable",
  dataCable: "Data cable",
};

const CABLE_TYPES = ["cableMaster", "powerCable", "dataCable"];

function typeLabel(entityType: unknown) {
  if (typeof entityType !== "string" || !entityType) return null;
  return TYPE_LABELS[entityType] ?? entityType;
}

function CableBody({ data }: { data: Record<string, CableValue> }) {
  return (
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
        <Field label="Weight" value={data["weight"] != null ? `${data["weight"]} kg/km` : null} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Manufacturer" value={data["manufacturer"]} />
        <Field label="Part #" value={data["manufacturerArticleNumber"]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Length" value={data["length"] != null ? `${data["length"]} m` : null} />
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
  );
}

function Title({ value }: { value: CableValue | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return <h2 className="text-xl font-semibold text-foreground">{String(value)}</h2>;
}

const HIDDEN_KEYS = new Set(["_entityType", "elid", "name", "description"]);

function EntityBody({ data }: { data: Record<string, CableValue> }) {
  const entityType = typeof data["_entityType"] === "string" ? data["_entityType"] : "";

  if (entityType === "building" || entityType === "room") {
    return (
      <div className="space-y-4">
        <Title value={data["name"]} />
        <Field label="Description" value={data["description"]} />
        <div className="grid grid-cols-2 gap-4">
          {entityType === "building" ? (
            <>
              <Field label="Campus" value={data["campus"]} />
              <Field label="Location" value={data["location"]} />
            </>
          ) : (
            <>
              <Field label="Building" value={data["building"]} />
              <Field label="Floor" value={data["floor"]} />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {entityType === "room" && (
            <Field label="Area" value={data["area"] != null ? `${data["area"]} m²` : null} />
          )}
          <Field label="Remark" value={data["remark"]} />
        </div>
      </div>
    );
  }

  if (entityType === "floor" || entityType === "campus") {
    return (
      <div className="space-y-4">
        <Title value={data["name"]} />
        <Field label="Description" value={data["description"]} />
      </div>
    );
  }

  // Fallback: name/description plus all remaining fields.
  return (
    <div className="space-y-4">
      <Title value={data["name"]} />
      <Field label="Description" value={data["description"]} />
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data)
          .filter(([key]) => !HIDDEN_KEYS.has(key))
          .map(([key, value]) => (
            <Field key={key} label={key} value={value} />
          ))}
      </div>
    </div>
  );
}

export function CableInfoCard({ state, onClose }: Props) {
  if (state.status === "idle") return null;

  const data = state.status === "found" ? state.data : null;
  const ok = state.status === "found";
  const label = data ? typeLabel(data["_entityType"]) : null;
  const isCable =
    !!data && typeof data["_entityType"] === "string" && CABLE_TYPES.includes(data["_entityType"]);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 animate-in slide-in-from-bottom duration-300">
      <div className="glass-card mx-2 mb-2 rounded-t-3xl border border-border shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Dismiss entity details"
          className="mx-auto mt-2 block h-1.5 w-12 rounded-full bg-muted-foreground/50"
        />
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3">
          <div className="flex items-center gap-2">
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
            {label && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {label}
              </span>
            )}
          </div>
          <span className="truncate font-mono text-xs text-muted-foreground">
            ELID: {state.elid}
          </span>
        </div>

        <div className="max-h-[52vh] overflow-y-auto border-t border-border px-5 py-4">
          {state.status === "loading" && <Skeleton />}

          {state.status === "error" && <p className="text-sm text-scan-danger">{state.message}</p>}

          {data && (isCable ? <CableBody data={data} /> : <EntityBody data={data} />)}
        </div>
      </div>
    </div>
  );
}

