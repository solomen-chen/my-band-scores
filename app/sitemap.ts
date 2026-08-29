//app/sitemap.ts

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://my-band-scores.vercel.app",
      lastModified: new Date(),
    },
  ];
}