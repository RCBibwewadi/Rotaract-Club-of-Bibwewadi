import type { MetadataRoute } from "next";

const BASE_URL = "https://www.rcbibwewadipune.org/";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/board",
    "/contact",
    "/events",
    "/join",
    "/legacy",
    "/projects",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
