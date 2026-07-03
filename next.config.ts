import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_ACTIONS === 'true';
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
const pad = (n: number) => String(n).padStart(2, '0');
const buildVersion = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}GMT+8`;

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGHPages ? '/settleit' : '',
  assetPrefix: isGHPages ? '/settleit/' : undefined,
  // Allow the dev server to serve its dev-only assets/HMR chunks to devices on
  // the local network (e.g. testing on a phone at http://192.168.254.x:3000).
  // Without this, Next.js blocks cross-origin dev requests, so the page renders
  // but the client JS never hydrates and buttons do nothing. Dev-only setting.
  allowedDevOrigins: ['192.168.254.*', '192.168.0.*', '192.168.1.*'],
  env: {
    NEXT_PUBLIC_BASE_PATH: isGHPages ? '/settleit' : '',
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
