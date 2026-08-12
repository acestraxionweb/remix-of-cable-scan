import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CableValue = string | number | boolean | null;

export type CableLookupResult =
  | { success: true; data: Record<string, CableValue> }
  | { success: false; error: string; message: string };

export const getCable = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ elid: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }): Promise<CableLookupResult> => {
    const { lookupCable } = await import("./fnt.server");
    const hit = await lookupCable(data.elid);
    if (!hit) {
      return {
        success: false,
        error: "CABLE_NOT_FOUND",
        message: `No cable found with ELID: ${data.elid}`,
      };
    }
    const clean: Record<string, CableValue> = {};
    for (const [key, value] of Object.entries(hit)) {
      clean[key] =
        value === null || ["string", "number", "boolean"].includes(typeof value)
          ? (value as CableValue)
          : JSON.stringify(value);
    }
    return { success: true, data: clean };
  });

export const getCacheStats = createServerFn({ method: "GET" }).handler(async () => {
  const { cacheStats } = await import("./fnt.server");
  return cacheStats();
});

export const refreshCache = createServerFn({ method: "POST" }).handler(async () => {
  const { cacheStats } = await import("./fnt.server");
  return cacheStats(true);
});
