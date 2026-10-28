import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Monthly House Bill Tracker" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Simple monthly rent and electricity bill tracker with printable receipts." },
      { property: "og:title", content: "Monthly House Bill Tracker" },
      { property: "og:description", content: "Simple monthly rent and electricity bill tracker with printable receipts." },
    ],
  }),
});
