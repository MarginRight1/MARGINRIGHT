import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
  title: "MarginRight Auth",
  description: "Secure sign-in and account recovery for MarginRight.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
