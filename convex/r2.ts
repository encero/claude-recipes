import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const r2 = new R2(components.r2);

// Export client API for frontend uploads
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
  },
});

// Helper to get public URL for an R2 key
export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL environment variable not set");
  }
  // Remove trailing slash if present
  const baseUrl = publicUrl.replace(/\/$/, "");
  return `${baseUrl}/${key}`;
}
