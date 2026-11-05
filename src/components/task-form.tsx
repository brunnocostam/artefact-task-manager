"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { useTRPC } from "@/trpc/client";

type TaskFormProps =
  | { mode: "create" }
  | { mode: "edit"; task: { id: string; title: string; description?: string } };

export function TaskForm(props: TaskFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const initial = props.mode === "edit" ? props.task : undefined;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);

  const onSuccess = async (status: "created" | "updated") => {
    await queryClient.invalidateQueries({ queryKey: trpc.task.pathKey() });
    router.push(`/?status=${status}`);
  };

  const createTask = useMutation(trpc.task.create.mutationOptions({ onSuccess: () => onSuccess("created") }));
  const updateTask = useMutation(trpc.task.update.mutationOptions({ onSuccess: () => onSuccess("updated") }));
  const mutation = props.mode === "create" ? createTask : updateTask;

  // validated here for quick feedback, the server validates again with zod
  function validateTitle(value: string): string | null {
    if (!value.trim()) return "Title is required.";
    if (value.trim().length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateTitle(title);
    setTitleError(error);
    if (error) return;

    const data = { title: title.trim(), description: description.trim() || undefined };
    if (props.mode === "create") createTask.mutate(data);
    else updateTask.mutate({ id: props.task.id, ...data });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded border bg-white p-4">
      {mutation.isError && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {getErrorMessage(mutation.error)}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(validateTitle(e.target.value));
          }}
          onBlur={() => setTitleError(validateTitle(title))}
          maxLength={TITLE_MAX}
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? "title-error" : undefined}
          className={`w-full rounded border px-3 py-2 ${titleError ? "border-red-500" : ""}`}
          placeholder="e.g. Write release notes"
          autoFocus
        />
        {titleError && (
          <p id="title-error" className="mt-1 text-sm text-red-600">
            {titleError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : props.mode === "create" ? "Create task" : "Save changes"}
        </button>
        <Link href="/" className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
