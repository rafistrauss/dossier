import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Dossier",
    short_name: "Dossier",
    description: "Your job search, on your server.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eeebe4",
    theme_color: "#eeebe4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
