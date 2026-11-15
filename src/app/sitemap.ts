import type { MetadataRoute } from "next";
import { brand } from "@/constants/brand";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy/", "/terms/", "/contact/"].map((path) => ({
    url: brand.url + path,
    changeFrequency: "monthly",
    priority: path ? 0.3 : 1,
  }));
}
