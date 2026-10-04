import { z } from "zod";

export const apiStatusSchema = z.enum(["success", "error"]);
export type ApiStatus = z.infer<typeof apiStatusSchema>;

export const errorEnvelopeSchema = z.object({
  status: z.literal("error"),
  message: z.string().min(1),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});
export type BaseEntity = z.infer<typeof baseEntitySchema>;
