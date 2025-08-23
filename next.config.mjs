/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.app", // 추가
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
  },
  compiler: {},

  experimental: {
    optimizePackageImports: ["lucide-react", "@/components"],
    webVitalsAttribution: ["CLS", "LCP"],
  },
  compress: true,
  trailingSlash: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Link",
            value: [
              "<https://fonts.googleapis.com>; rel=preconnect",
              "<https://fonts.gstatic.com>; rel=preconnect; crossorigin",
              "<https://firebasestorage.googleapis.com>; rel=preconnect",
            ].join(", "),
          },
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://vercel.live https://va.vercel-scripts.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://picsum.photos;
              connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://vitals.vercel-analytics.com https://va.vercel-scripts.com https://firebasestorage.googleapis.com https://*.firebasestorage.app;
              frame-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
          // COOP 헤더
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // COEP 헤더

          // 추가 보안 헤더들
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
