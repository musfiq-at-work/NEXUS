/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

const isDev = process.env.NODE_ENV === "development";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  webpack: (config) => {
      config.resolve.alias.canvas = false;
      return config;
  },

  output: "standalone",

  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         // CSP (includes frame protection + trusted types)
  //         {
  //           key: "Content-Security-Policy",
  //           value: [
  //               "default-src 'self'",
  //               `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""}`,
  //               "style-src 'self' 'unsafe-inline'",
  //               "img-src 'self' data: blob:",
  //               "font-src 'self'",
  //               "connect-src 'self'",
  //               "frame-ancestors 'none'",
  //               "base-uri 'self'",
  //               "form-action 'self'"
  //           ].join("; ")
  //         },

  //         // HSTS
  //         {
  //           key: "Strict-Transport-Security",
  //           value: "max-age=63072000; includeSubDomains; preload",
  //         },

  //         // Isolation
  //         {
  //           key: "Cross-Origin-Opener-Policy",
  //           value: "same-origin",
  //         },
  //         {
  //           key: "Cross-Origin-Resource-Policy",
  //           value: "same-origin",
  //         },

  //         // Hardening
  //         {
  //           key: "X-Content-Type-Options",
  //           value: "nosniff",
  //         },
  //         {
  //           key: "X-Frame-Options",
  //           value: "DENY",
  //         },
  //         {
  //           key: "Referrer-Policy",
  //           value: "strict-origin-when-cross-origin",
  //         },
  //         {
  //           key: "Permissions-Policy",
  //           value: "camera=(), microphone=(), geolocation=()",
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default config;