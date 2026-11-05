import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">New task</h1>
      <TaskForm mode="create" />
    </>
  );
}
