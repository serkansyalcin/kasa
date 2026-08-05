import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LAN IP / başka cihazdan erişimde _next chunk 403'lerini önler
  allowedDevOrigins: ["10.0.1.206", "*.local"],
};

export default nextConfig;
