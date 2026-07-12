/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail the production build on lint-only issues (unused vars, `any`,
    // prefer-const, unescaped entities). TypeScript still gates the build.
    // Re-enable once the team does a lint cleanup pass.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
