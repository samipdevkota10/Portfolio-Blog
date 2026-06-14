"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

type ProvidersProps = {
  children: ReactNode;
  clerkEnabled: boolean;
};

export function Providers({ children, clerkEnabled }: ProvidersProps) {
  if (!clerkEnabled) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
