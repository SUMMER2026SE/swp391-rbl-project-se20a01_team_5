/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.229"],
  async rewrites() {
    const configuredBase = process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    const backendBase = configuredBase?.startsWith("http")
      ? configuredBase
      : "http://localhost:8080/api/v1";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBase.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
