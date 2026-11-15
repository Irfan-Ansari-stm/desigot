import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/seller-dashboard/listings/new",
        destination: "/dashboard/listings/new",
        permanent: false,
      },
      {
        source: "/seller-dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/seller-dashboard",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
