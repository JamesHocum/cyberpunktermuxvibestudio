import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long (max 4000 characters)")
    .refine(
      (val) => val.trim().length > 0,
      "Message cannot be only whitespace"
    ),
});

export const validateMessage = (content: string) => {
  return messageSchema.parse({ content });
};

export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(minIntervalMs: number = 2000) {
    this.minInterval = minIntervalMs;
  }

  checkLimit(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < this.minInterval) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  }

  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastRequestTime;
    return Math.max(0, this.minInterval - elapsed);
  }
}
