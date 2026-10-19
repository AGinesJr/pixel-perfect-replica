import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep old bookmarks working while all resume tools live in one workspace.
export const Route = createFileRoute("/resume-match")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
});
