import { z } from 'zod';

const contractIdSchema = z.object({
  contractId: z.string().trim().min(1, 'contractId is required'),
});

export const pauseSubscriptionInputSchema = contractIdSchema.extend({
  resumeDate: z.string().datetime().optional(),
});

export const resumeSubscriptionInputSchema = contractIdSchema;

export const skipNextDeliveryInputSchema = contractIdSchema;

export const cancelSubscriptionInputSchema = contractIdSchema.extend({
  reason: z.string().max(2000).optional(),
});

export type PauseSubscriptionInput = z.infer<typeof pauseSubscriptionInputSchema>;
export type ResumeSubscriptionInput = z.infer<typeof resumeSubscriptionInputSchema>;
export type SkipNextDeliveryInput = z.infer<typeof skipNextDeliveryInputSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionInputSchema>;

export function validationUserErrors(err: z.ZodError): {
  field: string[] | null;
  message: string;
  code: string | null;
}[] {
  return err.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.map(String) : null,
    message: issue.message,
    code: 'VALIDATION',
  }));
}
