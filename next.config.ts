import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages use native Node.js internals or browser globals and must
  // not be bundled by Next.js — load them straight from node_modules at runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth'],
};

export default nextConfig;
