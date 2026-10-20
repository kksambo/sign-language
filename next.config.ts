import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker needs standalone. Vercel uses its own output and sets VERCEL=1.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
