import axios from 'axios';
import { YieldOpportunity, OpportunityCategory } from '../types/opportunities.js';
import { Provider } from './base.js';
import { BlobOptions } from 'buffer';

interface DefiLlamaAPRData {
  chain: string,
  project: string,
  symbol: string,
  tvlUsd: number,
  apyBase: number,
  apyReward: number | null,
  apy: number,
  rewardTokens: string[] | null,
  pool: string,
  apyPct1D: number | null,
  apyPct7D: number | null,
  apyPct30D: number | null,
  stablecoin: boolean,
  ilRisk: string,
  exposure: string,
  predictions: {
    predictedClass: string | null,
    predictedProbability: number | null,
    binnedConfidence: number | null,
  },
  poolMeta: string | null,
  mu: number,
  sigma: number,
  count: number,
  outlier: boolean,
  underlyingTokens: string[],
  il7d: number | null,
  apyBase7d: number | null,
  apyMean30d: number,
  volumeUsd1d: number | null,
  volumeUsd7d: number | null,
  apyBaseInception: number | null,
}

// DEFILLAMA API response interface
interface DefiLlamaAPRResponse {
  status: string,
  data: DefiLlamaAPRData[],
}
// can be overridden by env variables
const DEFILLAMA_API_URL = 'https://yields.llama.fi/pools';
const DEFILLAMA_INTERVAL_MS = 60000; // 1 minute
const DEFILLAMA_TIMEOUT_MS = 10000; // 1 secs

/**
 * Lido provider for fetching staking APR data
 * 
 * This provider fetches APR data from Lido's API and maps it to our unified
 * YieldOpportunity format.
 */
export class DeFiLlamaProvider extends Provider {
  constructor() {
    const apiUrl = process.env.DEFILLAMA_API_URL || DEFILLAMA_API_URL;
    const interval = parseInt(process.env.DEFILLAMA_INTERVAL_MS || '') || DEFILLAMA_INTERVAL_MS;
    const timeout = parseInt(process.env.DEFILLAMA_TIMEOUT_MS || '') || DEFILLAMA_TIMEOUT_MS;
      
      super('defillama', apiUrl, interval, timeout);
    }
      /**
   * Fetch APR data from Lido API
   */
  private async fetchAPR(): Promise<DefiLlamaAPRResponse> {
    try {
      const response = await axios.get<DefiLlamaAPRResponse>(this.apiUrl, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Yield-Fetcher/1.0.0'
        }
      });
      if (response.data.status !== 'success') {
        throw new Error(`Failed to fetch DEFILLAMA APR: ${response.data.status}`);
      }
      return response.data;
    } catch (error) {
      this.logError('Error fetching APR', error);
      throw new Error(`Failed to fetch DEFILLAMA APR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected calculateRiskScore(opportunity: DefiLlamaAPRData): number {
  // 1. Sigma (volatility) score from 0 to 1
  let sigma = opportunity.sigma ?? 0;
  let sigmaScore = Math.min(sigma / 0.5, 1); // if more than 50% volatility, then it's a high risk

  // 2. Volatility from APY changes (1D/7D/30D) from 0 to 1
  let apy1d = opportunity.apyPct1D ?? 0;
  let apy7d = opportunity.apyPct7D ?? 0;
  let apy30d = opportunity.apyPct30D ?? 0;
  let change = (Math.abs(apy1d) + Math.abs(apy7d) + Math.abs(apy30d)) / 3; // average of 1d, 7d, 30d
  let volatilityScore = Math.min(change / 10, 1); // if more than 10% change, then it's a high risk

  // 3. TVL risk from 0 to 1
  let tvl = opportunity.tvlUsd ?? 0;
  let tvlScore = Math.max(0, 1 - tvl / 1e9); // billion tvl sounds good

  // 4. Impermanent loss, if there is add a little bit of risk from 0 to 1
  let ilScore = opportunity.ilRisk === 'yes' ? 1 : 0;

  // 6. Stablecoin adjustment from 0 to 1
  let stableAdjustment = opportunity.stablecoin === true ? 0 : 1; // if it's a stablecoin, then it's a low risk

  // 7. Category adjustment
  let categoryRisk = 0;
  const category = this.getCategory(opportunity);
  switch(category ?? '') {
    case OpportunityCategory.STAKING:
      categoryRisk = 0.15; break;
    case OpportunityCategory.LENDING:
      categoryRisk = 0.30; break;
    case OpportunityCategory.VAULT:
      categoryRisk = 0.45; break;
    default:
      categoryRisk = 0.1;
  }

  // 8. Lockup risk
  let lockupRisk = 0;
  if (this.isLocked(opportunity)) {
    lockupRisk = 0.2;
  }

  // Weighted sum
  let score = 0.20 * sigmaScore +
              0.20 * volatilityScore +
              0.20 * tvlScore +
              0.10 * ilScore +
              0.10 * stableAdjustment +
              0.10 * categoryRisk +
              0.10 * lockupRisk;

  // Clamp between 0 and 1
  score = Math.max(0, Math.min(score, 1));

  // Rescale to 0–10
  return Math.round(score * 10) + 1;
  }

  private getChain(chain: string): 'ethereum' | 'solana' {
    if (chain === 'ethereum') {
      return 'ethereum';
    } else if (chain === 'solana') {
      return 'solana';
    }
    throw new Error(`Unknown chain: ${chain}`);
  }

  private getCategory(opportunity: DefiLlamaAPRData): OpportunityCategory {
    if (opportunity.project.toLowerCase().includes('lend') || (opportunity.poolMeta || "").toLowerCase().includes('lend')) {
      return OpportunityCategory.LENDING;
    } else if (opportunity.project.toLowerCase().includes('vault') || (opportunity.poolMeta || "").toLowerCase().includes('vault')) {
      return OpportunityCategory.VAULT;
    }
    return OpportunityCategory.STAKING
  }

  private isLocked(opportunity: DefiLlamaAPRData): boolean {
    return (opportunity.poolMeta || "").toLowerCase().includes("lock")
  }



  /**
   * Fetch and map Lido opportunities to unified format
   */
  async fetchOpportunities(): Promise<YieldOpportunity[]> {
    try {
      this.log('Fetching opportunities...');
      const response = await this.fetchAPR();
      // only include ethereum and solana pools
      let filteredResponse = response.data.filter(opportunity => opportunity.chain === 'Ethereum' || opportunity.chain === 'Solana');

      // filter those that are potentially staking, lending, vault
      filteredResponse = filteredResponse.filter((opportunity) => {
        return opportunity.project.toLowerCase().includes('stak') || 
        opportunity.project.toLowerCase().includes('lend') || 
        opportunity.project.toLowerCase().includes('vault') || 
        (opportunity.poolMeta || "").toLowerCase().includes('stak') || 
        (opportunity.poolMeta || "").toLowerCase().includes('lend') || 
        (opportunity.poolMeta || "").toLowerCase().includes('vault')
      });

      // apy more than 1%
      filteredResponse = filteredResponse.filter(opportunity => opportunity.apy > 1);
      const opportunities: YieldOpportunity[] = [];
      for (const opportunity of filteredResponse) {
        try {
          const chain = this.getChain(opportunity.chain.toLowerCase());
          opportunities.push({
            id: `${opportunity.project}-${opportunity.symbol}-${opportunity.poolMeta}`,
            name: `${opportunity.project} ${opportunity.symbol}`,
            provider: this.name,
            asset: opportunity.symbol,
            chain: chain,
            apr: opportunity.apy/ 100,
            category: this.getCategory(opportunity),
            liquidity: this.isLocked(opportunity) ? 'locked' : 'liquid',
            riskScore: this.calculateRiskScore(opportunity),
            updatedAt: new Date().toISOString(),
            yieldDate: new Date().toISOString(),
          })
        } catch (error) {
          continue;
        }
        
      }

      this.log(`Successfully fetched opportunity for ${this.name} provider`);
      return opportunities;
    } catch (error) {
      this.logError('Error fetching opportunities', error);
      throw error;
    }
  }
}