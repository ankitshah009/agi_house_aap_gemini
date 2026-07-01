"use client";

import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_WORKOS_AUTH_ENABLED !== "1") {
    return <>{children}</>;
  }
  return <AuthKitProvider>{children}</AuthKitProvider>;
}
