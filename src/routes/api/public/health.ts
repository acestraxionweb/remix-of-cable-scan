import { createFileRoute } from "@tanstack/react-router";

import { cacheStats } from "@/lib/fnt.server";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => Response.json({ success: true, status: "ok", cache: await cacheStats() }),
      POST: async () =>
        Response.json({ success: true, status: "refreshed", cache: await cacheStats(true) }),
    },
  },
});
