import { TRPCError } from "@trpc/server";

import { createCaller } from "./_app";

// calls the router directly, same code path as the API but without HTTP
const caller = createCaller({});

async function expectTRPCError(promise: Promise<unknown>, code: TRPCError["code"]) {
  await expect(promise).rejects.toBeInstanceOf(TRPCError);
  await expect(promise).rejects.toMatchObject({ code });
}

async function listAll(limit: number) {
  const items = [];
  let cursor: number | null = null;
  do {
    const page = await caller.task.list({ limit, cursor });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return items;
}

describe("task router", () => {
  it("creates a task and lists it first", async () => {
    const task = await caller.task.create({ title: "  Write tests  ", description: "With Jest" });

    expect(task.id).toEqual(expect.any(String));
    expect(task.title).toBe("Write tests");
    expect(task.createdAt).toBeInstanceOf(Date);

    const { items } = await caller.task.list({ limit: 5 });
    expect(items[0].id).toBe(task.id);
  });

  it("rejects a task without a title", async () => {
    await expectTRPCError(caller.task.create({ title: "" }), "BAD_REQUEST");
    await expectTRPCError(caller.task.create({ title: "   " }), "BAD_REQUEST");
  });

  it("updates title and description, keeping createdAt", async () => {
    const task = await caller.task.create({ title: "Old title", description: "Old" });

    const updated = await caller.task.update({ id: task.id, title: "New title" });

    expect(updated.title).toBe("New title");
    expect(updated.description).toBeUndefined();
    expect(updated.createdAt).toEqual(task.createdAt);
  });

  it("returns NOT_FOUND when updating or deleting a missing task", async () => {
    await expectTRPCError(caller.task.update({ id: "missing", title: "x" }), "NOT_FOUND");
    await expectTRPCError(caller.task.delete({ id: "missing" }), "NOT_FOUND");
    await expectTRPCError(caller.task.byId({ id: "missing" }), "NOT_FOUND");
  });

  it("deletes a task", async () => {
    const task = await caller.task.create({ title: "Temporary" });

    await caller.task.delete({ id: task.id });

    await expectTRPCError(caller.task.byId({ id: task.id }), "NOT_FOUND");
  });

  it("paginates through every task without duplicates", async () => {
    const all = await listAll(50);
    const paged = await listAll(7);

    expect(paged.map((t) => t.id)).toEqual(all.map((t) => t.id));
    expect(new Set(paged.map((t) => t.id)).size).toBe(paged.length);
  });
});
