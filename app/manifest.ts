import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Motive",
    short_name: "Motive",
    description: "Quests, XP, and shared progress.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#090b16",
    theme_color: "#090b16",
    orientation: "portrait",
    icons: [
      {
        src: "/motive-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/motive-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
