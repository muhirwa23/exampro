import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const strongPassword = z.string().min(12).max(128);

export const signUpSchema = z.object({
  email,
  name: z.string().trim().min(1).max(160),
  password: strongPassword,
  organizationName: z.string().trim().min(1).max(160),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/).toUpperCase().optional(),
}).strict();

export const emailSchema = z.object({ email }).strict();

export const signInSchema = z.object({
  email,
  password: z.string().min(1).max(128),
}).strict();

export const tokenSchema = z.object({
  token: z.string().min(40).max(128).regex(/^[A-Za-z0-9_-]+$/),
}).strict();

export const resetPasswordSchema = tokenSchema.extend({ password: strongPassword }).strict();

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/).toUpperCase().optional(),
}).strict();

export type SignUpInput = z.infer<typeof signUpSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export class ZodBodyPipe<TSchema extends z.ZodType> implements PipeTransform<unknown, z.infer<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.infer<TSchema> {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;
    throw new BadRequestException({
      message: "Request validation failed",
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
}
