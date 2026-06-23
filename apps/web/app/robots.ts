import type { MetadataRoute } from "next";

const BASE_URL = "https://www.rcbibwewadipune.org/";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/login", "/profile"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
