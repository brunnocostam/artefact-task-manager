export type Task = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskInput = {
  title: string;
  description?: string;
};

type Store = {
  tasks: Map<string, Task>;
  lastTimestamp: number;
};

// kept on globalThis so hot reload in dev doesn't wipe the tasks
const globalForStore = globalThis as unknown as { __taskStore?: Store };

// createdAt is the pagination cursor, so it has to be unique
function nextTimestamp(store: Store): number {
  const now = Date.now();
  store.lastTimestamp = now > store.lastTimestamp ? now : store.lastTimestamp + 1;
  return store.lastTimestamp;
}

function createSeededStore(): Store {
  const store: Store = { tasks: new Map(), lastTimestamp: 0 };
  const sampleTitles = [
    "Set up project repository",
    "Write onboarding guide",
    "Review pull request #42",
    "Plan sprint backlog",
    "Update dependencies",
    "Fix login page typo",
    "Prepare demo for stakeholders",
    "Refactor date utilities",
    "Add unit tests for parser",
    "Organize team retrospective",
    "Draft API documentation",
    "Clean up unused feature flags",
    "Investigate slow dashboard query",
    "Design empty state illustration",
    "Translate settings page",
    "Archive old reports",
    "Benchmark image compression",
    "Schedule 1:1 meetings",
    "Audit accessibility on forms",
    "Write release notes",
    "Rotate staging credentials",
    "Polish error messages",
    "Sketch mobile navigation",
    "Measure bundle size",
    "Celebrate the release",
  ];

  const start = Date.now() - sampleTitles.length * 10 * 60 * 1000;
  sampleTitles.forEach((title, index) => {
    const timestamp = start + index * 10 * 60 * 1000;
    const date = new Date(timestamp);
    const id = crypto.randomUUID();
    store.tasks.set(id, {
      id,
      title,
      description: index % 3 === 0 ? "Sample task created for demo purposes." : undefined,
      createdAt: date,
      updatedAt: date,
    });
    store.lastTimestamp = timestamp;
  });

  return store;
}

const store = (globalForStore.__taskStore ??= createSeededStore());

function normalizeDescription(description?: string): string | undefined {
  const trimmed = description?.trim();
  return trimmed ? trimmed : undefined;
}

// cursor instead of offset: deleting while scrolling doesn't skip items
export function listTasks({ limit, cursor }: { limit: number; cursor?: number | null }) {
  const sorted = [...store.tasks.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const remaining = cursor == null ? sorted : sorted.filter((t) => t.createdAt.getTime() < cursor);

  // limit + 1 just to know if there's a next page
  const page = remaining.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].createdAt.getTime() : null,
  };
}

export function getTask(id: string): Task | undefined {
  return store.tasks.get(id);
}

export function createTask(input: TaskInput): Task {
  const date = new Date(nextTimestamp(store));
  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title,
    description: normalizeDescription(input.description),
    createdAt: date,
    updatedAt: date,
  };
  store.tasks.set(task.id, task);
  return task;
}

export function updateTask(id: string, input: TaskInput): Task | undefined {
  const existing = store.tasks.get(id);
  if (!existing) return undefined;

  const updated: Task = {
    ...existing,
    title: input.title,
    description: normalizeDescription(input.description),
    updatedAt: new Date(),
  };
  store.tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string): boolean {
  return store.tasks.delete(id);
}
