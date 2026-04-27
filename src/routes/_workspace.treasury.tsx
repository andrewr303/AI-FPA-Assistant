import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL alias: the Treasury dashboard moved to "/" but bookmarks/links
// pointing at /treasury still exist. Redirect them instead of 404'ing.
export const Route = createFileRoute("/_workspace/treasury")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
