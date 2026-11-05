import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";

import { appRouter, createCaller } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";
import { makeQueryClient } from "./query-client";

// server components call the router directly, no HTTP round trip
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const serverCaller = cache(async () => createCaller(await createTRPCContext()));
