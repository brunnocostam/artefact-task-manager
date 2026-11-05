import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

export async function createTRPCContext() {
  return {};
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  // superjson so createdAt stays a Date on the client
  transformer: superjson,
  // expose zod field errors so the form can show "Title is required"
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
