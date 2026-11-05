import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { TaskList } from "@/components/task-list";
import { PAGE_SIZE } from "@/lib/constants";
import { getQueryClient, trpc } from "@/trpc/server";

// tasks live in memory and change anytime, so never prerender this page
export const dynamic = "force-dynamic";

const FLASH_MESSAGES: Record<string, string> = {
  created: "Task created successfully.",
  updated: "Task updated successfully.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  // SSR: prefetch the first page here, the client hydrates from it
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1 className="mb-4 text-2xl font-bold">Tasks</h1>
      <TaskList initialFlash={status ? FLASH_MESSAGES[status] : undefined} />
    </HydrationBoundary>
  );
}
