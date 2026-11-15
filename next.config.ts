import type { NextConfig } from "next";

// Not a static export any more: /api/summary runs on the server so the Gemini key never reaches the browser.
// Every page still opens with no login, and the demo path reads cached files in public/data.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // AGENTS.md holds the team's project rules; keep `next dev` from appending its own block to it.
  agentRules: false,
};

export default nextConfig;
