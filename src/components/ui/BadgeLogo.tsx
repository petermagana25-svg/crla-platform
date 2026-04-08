import Image from "next/image";

export default function BadgeLogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/images/branding/crla-logo.jpg"
        alt="CRLA — Certified Renovation Listing Agent"
        width={220}
        height={70}
        priority
        className="h-auto w-auto max-h-10 object-contain sm:max-h-12 md:max-h-14"
      />
    </div>
  );
}
