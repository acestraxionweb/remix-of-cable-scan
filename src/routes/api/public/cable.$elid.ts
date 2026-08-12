import { createFileRoute } from "@tanstack/react-router";

import { lookupCable } from "@/lib/fnt.server";

export const Route = createFileRoute("/api/public/cable/$elid")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const elid = params.elid;
        const hit = await lookupCable(elid);
        if (!hit) {
          return Response.json(
            {
              success: false,
              error: "CABLE_NOT_FOUND",
              message: `No cable found with ELID: ${elid}`,
            },
            { status: 404 },
          );
        }
        return Response.json({ success: true, data: hit });
      },
    },
  },
});
