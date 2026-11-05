import { TRPCClientError } from "@trpc/client";

import type { AppRouter } from "@/server/routers/_app";

export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const { data } = error as TRPCClientError<AppRouter>;
    const fieldErrors = data?.zodError?.fieldErrors as Record<string, string[] | undefined> | undefined;
    const firstFieldError = fieldErrors && Object.values(fieldErrors).flat().find(Boolean);
    if (firstFieldError) return firstFieldError;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
