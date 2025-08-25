import { z } from 'zod';
import { OpportunityCategory } from '@prisma/client';

// Re-export the Prisma enum for use in the application
export { OpportunityCategory };

export interface YieldOpportunity {
  id: string; // Generated from provider + pool/symbol
  name: string; // Derived from project/provider name
  provider: string; // From API or known (lido, marinade, etc.)
  asset: string; // From symbol field
  chain: 'ethereum' | 'solana'; // From chain field or provider type
  apr: number; // From apy/apr field (decimal format: 0.041 = 4.1%)
  category: OpportunityCategory; // Derived from provider type
  liquidity: 'liquid' | 'locked'; // Derived from provider/opportunity type
  riskScore: number; // 1-10 scale (calculated)
  updatedAt: string; // ISO timestamp when fetched
  yieldDate: string; // ISO timestamp when fetched
}

// Zod schemas for validation
export const OpportunityCategorySchema = z.nativeEnum(OpportunityCategory);

export const YieldOpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  asset: z.string(),
  chain: z.enum(['ethereum', 'solana']),
  apr: z.number().min(0), // 0-100% as decimal
  category: OpportunityCategorySchema,
  liquidity: z.enum(['liquid', 'locked']),
  riskScore: z.number().int().min(1).max(10),
  yieldDate: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const YieldOpportunityArraySchema = z.array(YieldOpportunitySchema);

// Health check response schema
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  database: z.boolean()
});
