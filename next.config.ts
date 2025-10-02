import type { NextConfig } from "next";

// Check if we're running in GitHub Pages
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = 'foodscan';
const assetPrefix = isGithubActions ? `/${repoName}/` : '';
const basePath = isGithubActions ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: assetPrefix,
  basePath: basePath,
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure static export works with dynamic routes
  trailingSlash: true,
};

export default nextConfig;
