import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGHPages ? '/settleit' : '',
  assetPrefix: isGHPages ? '/settleit/' : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGHPages ? '/settleit' : '',
  },
};

export default nextConfig;
