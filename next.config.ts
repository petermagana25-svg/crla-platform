import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    const { hostname, protocol } = new URL(supabaseUrl);

    remotePatterns.push({
      hostname,
      protocol: protocol.replace(":", "") as "http" | "https",
    });
  }
} catch {
  // Ignore invalid env configuration here so local development can still boot.
}

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
