import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Scrypt } from "lucia";
import { requireAuth } from "./helpers";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    return user ? { exists: true } : { exists: false };
  },
});

const scrypt = new Scrypt();

export const changePin = mutation({
  args: {
    currentPin: v.string(),
    newPin: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const authAccount = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!authAccount || !authAccount.secret) {
      throw new Error("Account not found");
    }

    const isValid = await scrypt.verify(authAccount.secret, args.currentPin);
    if (!isValid) {
      throw new Error("Current PIN is incorrect");
    }

    const newHash = await scrypt.hash(args.newPin);
    await ctx.db.patch(authAccount._id, { secret: newHash });

    return { success: true };
  },
});
