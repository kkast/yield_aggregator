import { z } from 'zod';

// User match configuration schema
export const MatchRequestSchema = z.object({
  walletBalance: z.record(z.string(), z.number().nonnegative()),
  riskTolerance: z.number().int().min(1).max(10),
  maxAllocationPct: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(0)
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;

// Default data structure for new users
export const defaultUserData: MatchRequest = {
  walletBalance: { ETH: 0, SOL: 0 },
  riskTolerance: 5,
  maxAllocationPct: 20,
  investmentHorizon: 365
};
