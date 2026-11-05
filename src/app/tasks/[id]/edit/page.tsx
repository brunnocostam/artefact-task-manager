import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { TaskForm } from "@/components/task-form";
import { serverCaller } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await serverCaller();

  let task;
  try {
    task = await caller.task.byId({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Edit task</h1>
      <TaskForm mode="edit" task={{ id: task.id, title: task.title, description: task.description }} />
    </>
  );
}
