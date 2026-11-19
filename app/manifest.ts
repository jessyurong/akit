import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Anti-Stress Playground",
    short_name: "Playground",
    description:
      "A tiny digital toy box for a happier brain. Pop, squish, spin, doodle, breathe, and reset — offline-ready.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0d1020",
    theme_color: "#0d1020",
    lang: "en",
    dir: "ltr",
    categories: ["health", "lifestyle", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Pop bubbles",
        short_name: "Pop",
        description: "Straight to the bubble wrap",
        url: "/#instant",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Calm breathing",
        short_name: "Breathe",
        description: "Guided 4-4-4 breathing",
        url: "/#calm",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Zen canvas",
        short_name: "Doodle",
        description: "Finger paint something ugly",
        url: "/#calm",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
