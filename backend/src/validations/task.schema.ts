import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assignedTo: z.number().optional(),
    playbookId: z.number().optional()
  })
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
  })
});

export const getTasksQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(), // usually ID
    limit: z.string().optional().default('10')
  })
});
