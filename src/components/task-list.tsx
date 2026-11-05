"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { FlashMessage, type Flash } from "@/components/flash-message";
import { PAGE_SIZE } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/trpc/client";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function TaskList({ initialFlash }: { initialFlash?: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [flash, setFlash] = useState<Flash | null>(
    initialFlash ? { type: "success", text: initialFlash } : null,
  );
  const dismissFlash = useCallback(() => setFlash(null), []);

  useEffect(() => {
    if (initialFlash) window.history.replaceState(null, "", "/");
  }, [initialFlash]);

  // same options as the prefetch in page.tsx, so the SSR data is reused
  const tasksQuery = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: async () => {
        setFlash({ type: "success", text: "Task deleted successfully." });
        await queryClient.invalidateQueries({ queryKey: trpc.task.list.pathKey() });
      },
      onError: (error) => setFlash({ type: "error", text: getErrorMessage(error) }),
    }),
  );

  // infinite scroll: load the next page when the sentinel at the bottom shows up
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = tasksQuery;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (tasksQuery.isPending) return <p className="text-gray-500">Loading tasks…</p>;

  if (tasksQuery.isError) {
    return (
      <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load tasks: {getErrorMessage(tasksQuery.error)}{" "}
        <button type="button" onClick={() => tasksQuery.refetch()} className="underline">
          Try again
        </button>
      </div>
    );
  }

  const tasks = tasksQuery.data.pages.flatMap((page) => page.items);

  return (
    <>
      <FlashMessage flash={flash} onDismiss={dismissFlash} />

      {tasks.length === 0 ? (
        <p className="text-gray-500">
          No tasks yet.{" "}
          <Link href="/tasks/new" className="text-blue-600 underline">
            Create the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const isDeleting = deleteTask.isPending && deleteTask.variables?.id === task.id;
            return (
              <li
                key={task.id}
                className={`rounded border bg-white p-4 ${isDeleting ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-medium break-words">{task.title}</h2>
                    {task.description && (
                      <p className="mt-1 text-sm whitespace-pre-line text-gray-600">{task.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Created {dateFormatter.format(task.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 text-sm">
                    <Link href={`/tasks/${task.id}/edit`} className="rounded border px-2 py-1 hover:bg-gray-50">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteTask.mutate({ id: task.id })}
                      disabled={isDeleting}
                      className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinelRef} className="py-6 text-center text-sm text-gray-400">
        {isFetchingNextPage ? "Loading more…" : hasNextPage ? "" : tasks.length > 0 ? "You've reached the end." : ""}
      </div>
    </>
  );
}
