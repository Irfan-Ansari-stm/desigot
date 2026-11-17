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
        source: "/seller/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/seller/dashboard",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/seller/services",
        destination: "/dashboard/service-management/all",
        permanent: false,
      },
      {
        source: "/seller/products",
        destination: "/dashboard/digital-products/all",
        permanent: false,
      },
      {
        source: "/seller/orders",
        destination: "/dashboard/orders-bookings/all",
        permanent: false,
      },
      {
        source: "/seller/earnings",
        destination: "/dashboard/payments-finance/seller-earnings",
        permanent: false,
      },
      {
        source: "/seller/payouts",
        destination: "/dashboard/payments-finance/payout-processing",
        permanent: false,
      },
      {
        source: "/seller/profile",
        destination: "/dashboard/profile",
        permanent: false,
      },
      {
        source: "/account/profile",
        destination: "/dashboard/profile",
        permanent: false,
      },
      {
        source: "/account/settings",
        destination: "/dashboard/profile",
        permanent: false,
      },
      {
        source: "/account/orders",
        destination: "/dashboard/orders-bookings/all",
        permanent: false,
      },
      {
        source: "/account/bookings",
        destination: "/dashboard/orders-bookings/all",
        permanent: false,
      },
      {
        source: "/account/messages",
        destination: "/dashboard/communication/conversations",
        permanent: false,
      },
      {
        source: "/account/reviews",
        destination: "/dashboard/reviews/all",
        permanent: false,
      },
      {
        source: "/account/:path*",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/account",
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
