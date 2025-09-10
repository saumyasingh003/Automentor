import { db } from "@/db";
import { user } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/tRPC/init";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.auth.user.id))
      .limit(1);

    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return currentUser;
  }),

  upgradePlan: protectedProcedure
    .input(z.object({ plan: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({ 
          plan: input.plan,
          updatedAt: new Date()
        })
        .where(eq(user.id, ctx.auth.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return updatedUser;
    }),

  downgradePlan: protectedProcedure
    .input(z.object({ plan: z.enum(["free"]) }))
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({ 
          plan: input.plan,
          updatedAt: new Date()
        })
        .where(eq(user.id, ctx.auth.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return updatedUser;
    }),
});
