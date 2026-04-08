import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "**.supabase.co",
  },
];

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    const { hostname, protocol } = new URL(supabaseUrl);

    const normalizedProtocol = protocol.replace(":", "") as "http" | "https";
    const alreadyIncluded = remotePatterns.some(
      (pattern) =>
        pattern.hostname === hostname && pattern.protocol === normalizedProtocol
    );

    if (!alreadyIncluded) {
      remotePatterns.push({
        hostname,
        protocol: normalizedProtocol,
      });
    }
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
