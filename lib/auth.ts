import { auth, currentUser } from "@clerk/nextjs/server";

import { featureFlags } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

export async function getAdminContext() {
  if (!featureFlags.clerk) {
    return {
      configured: false,
      isAdmin: false,
      user: null,
      email: "",
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      configured: true,
      isAdmin: false,
      user: null,
      email: "",
    };
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase() ?? "";
  const isAdmin = siteConfig.adminEmails.some((value) => value.toLowerCase() === email);

  return {
    configured: true,
    isAdmin,
    user,
    email,
  };
}
