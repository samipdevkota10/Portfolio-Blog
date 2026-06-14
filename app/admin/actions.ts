"use server";

import { revalidatePath } from "next/cache";

import { moderateComment } from "@/lib/db/queries";
import { getAdminContext } from "@/lib/auth";

export async function updateCommentStatus(formData: FormData) {
  const admin = await getAdminContext();

  if (!admin.isAdmin) {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as "approved" | "rejected";

  if (!id || (status !== "approved" && status !== "rejected")) {
    throw new Error("Invalid moderation request");
  }

  await moderateComment(id, status);
  revalidatePath("/admin");
}
