import { PrismaClient } from '@prisma/client';
import { YieldOpportunity } from '../types/opportunities.js';

// Global prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Database operations for yield opportunities
 */


export class DatabaseClient {
  /**
   * Upsert a yield opportunity (insert or update)
   */
  async upsertOpportunity(opportunity: YieldOpportunity): Promise<void> {
    try {
      await prisma.opportunity.upsert({
        where: { id: opportunity.id },
        update: {
          name: opportunity.name,
          provider: opportunity.provider,
          asset: opportunity.asset,
          chain: opportunity.chain,
          apr: opportunity.apr,
          category: opportunity.category,
          liquidity: opportunity.liquidity,
          riskScore: opportunity.riskScore,
          yieldDate: new Date(opportunity.yieldDate),
          updatedAt: new Date(opportunity.updatedAt)
        },
        create: {
          id: opportunity.id,
          name: opportunity.name,
          provider: opportunity.provider,
          asset: opportunity.asset,
          chain: opportunity.chain,
          apr: opportunity.apr,
          category: opportunity.category,
          liquidity: opportunity.liquidity,
          riskScore: opportunity.riskScore,
          yieldDate: new Date(opportunity.yieldDate),
          updatedAt: new Date(opportunity.updatedAt)
        }
      });
    } catch (error) {
      console.error('Error upserting opportunity:', error);
      throw error;
    }
  }

  /**
   * Batch upsert multiple yield opportunities in a single transaction
   */
  async batchUpsertOpportunities(opportunities: YieldOpportunity[]): Promise<{ success: number; failed: number }> {
    if (opportunities.length === 0) {
      return { success: 0, failed: 0 };
    }
    try {
      
      await prisma.$transaction(
        opportunities.map((opportunity) =>
          prisma.opportunity.upsert({
            where: { id: opportunity.id },
            update: {
              name: opportunity.name,
              provider: opportunity.provider,
              asset: opportunity.asset,
              chain: opportunity.chain,
              apr: opportunity.apr,
              category: opportunity.category,
              liquidity: opportunity.liquidity,
              riskScore: opportunity.riskScore,
              yieldDate: new Date(opportunity.yieldDate),
              updatedAt: new Date(opportunity.updatedAt),
            },
            create: {
              id: opportunity.id,
              name: opportunity.name,
              provider: opportunity.provider,
              asset: opportunity.asset,
              chain: opportunity.chain,
              apr: opportunity.apr,
              category: opportunity.category,
              liquidity: opportunity.liquidity,
              riskScore: opportunity.riskScore,
              yieldDate: new Date(opportunity.yieldDate),
              updatedAt: new Date(opportunity.updatedAt),
            },
          })
        )
      );
      console.log("All upserts succeeded!");
      return { success: opportunities.length, failed: 0 };
    } catch (error) {
      console.error('Error in batch upsert transaction:', error);
      return { success: 0, failed: opportunities.length };
    }

    
  }

  /**
   * Get all yield opportunities
   */
  async getAllOpportunities(): Promise<YieldOpportunity[]> {
    try {
      const opportunities = await prisma.opportunity.findMany({
        orderBy: { yieldDate: 'desc' }
      });

      return opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        provider: opp.provider,
        asset: opp.asset,
        chain: opp.chain as 'ethereum' | 'solana',
        apr: opp.apr,
        category: opp.category as any,
        liquidity: opp.liquidity as 'liquid' | 'locked',
        riskScore: opp.riskScore,
        yieldDate: opp.yieldDate.toISOString(),
        updatedAt: opp.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get user match configuration by user ID
   */
  async getUserMatch(userId: string) {
    try {
      const userMatch = await prisma.userMatch.findUnique({
        where: { userId }
      });
      return userMatch;
    } catch (error) {
      console.error('Error fetching user match:', error);
      throw error;
    }
  }

  /**
   * Upsert user match configuration
   */
  async upsertUserMatch(userId: string, matchData: {
    walletBalance: Record<string, number>;
    riskTolerance: number;
    maxAllocationPct: number;
    investmentHorizon: number;
  }) {
    try {
      const userMatch = await prisma.userMatch.upsert({
        where: { userId },
        update: {
          walletBalance: matchData.walletBalance,
          riskTolerance: matchData.riskTolerance,
          maxAllocationPct: matchData.maxAllocationPct,
          investmentHorizon: matchData.investmentHorizon,
          updatedAt: new Date()
        },
        create: {
          userId,
          walletBalance: matchData.walletBalance,
          riskTolerance: matchData.riskTolerance,
          maxAllocationPct: matchData.maxAllocationPct,
          investmentHorizon: matchData.investmentHorizon
        }
      });
      return userMatch;
    } catch (error) {
      console.error('Error upserting user match:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const db = new DatabaseClient();
