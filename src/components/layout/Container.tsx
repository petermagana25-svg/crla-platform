import { ReactNode } from "react";

export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full px-6 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}