import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../store";

export const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

const taskIdSchema = z.object({ id: z.string().min(1) });

function taskNotFound(id: string): TRPCError {
  return new TRPCError({ code: "NOT_FOUND", message: `Task "${id}" was not found.` });
}

export const taskRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(({ input }) => listTasks(input)),

  byId: publicProcedure.input(taskIdSchema).query(({ input }) => {
    const task = getTask(input.id);
    if (!task) throw taskNotFound(input.id);
    return task;
  }),

  create: publicProcedure
    .input(taskInputSchema)
    .mutation(({ input }) => createTask(input)),

  update: publicProcedure
    .input(taskIdSchema.extend(taskInputSchema.shape))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      const task = updateTask(id, data);
      if (!task) throw taskNotFound(id);
      return task;
    }),

  delete: publicProcedure.input(taskIdSchema).mutation(({ input }) => {
    if (!deleteTask(input.id)) throw taskNotFound(input.id);
    return { id: input.id };
  }),
});
