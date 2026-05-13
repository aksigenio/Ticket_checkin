import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Долгая отправка писем / загрузка чека на Vercel */
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
