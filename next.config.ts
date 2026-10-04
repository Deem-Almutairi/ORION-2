import type { NextConfig } from "next";

// EXPORT=1 builds a static site (out/) with relative asset paths, for hosting
// as a plain folder. Normal builds (Vercel, `npm run build`) are unaffected.
const staticExport = process.env.EXPORT === "1";

const nextConfig: NextConfig = staticExport
  ? { output: "export", assetPrefix: ".", images: { unoptimized: true }, trailingSlash: true }
  : {};

export default nextConfig;
