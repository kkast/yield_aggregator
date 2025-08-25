import axios from 'axios';
import { YieldOpportunity, OpportunityCategory } from '../types/opportunities.js';
import { Provider } from './base.js';

// Lido API response interface
interface LidoAPRResponse {
  data: {
    timeUnix: number;
    apr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}
// can be overridden by env variables
const LIDO_STETH_API_URL = 'https://eth-api.lido.fi/v1/protocol/steth/apr/last';
const LIDO_STETH_INTERVAL_MS = 300000; // 5 minutes but can be more because seems like this url is updated daily
const LIDO_STETH_TIMEOUT_MS = 10000; // 5 minutes

/**
 * Lido provider for fetching staking APR data
 * 
 * This provider fetches APR data from Lido's API and maps it to our unified
 * YieldOpportunity format.
 */
export class LidoStethProvider extends Provider {
  constructor() {
    const apiUrl = process.env.LIDO_STETH_API_URL || LIDO_STETH_API_URL;
    const interval = parseInt(process.env.LIDO_STETH_INTERVAL_MS || '') || LIDO_STETH_INTERVAL_MS;
    const timeout = parseInt(process.env.LIDO_STETH_TIMEOUT_MS || '') || LIDO_STETH_TIMEOUT_MS;
      
      super('lidosteth', apiUrl, interval, timeout);
    }
      /**
   * Fetch APR data from Lido API
   */
  private async fetchAPR(): Promise<LidoAPRResponse> {
    try {
      const response = await axios.get<LidoAPRResponse>(this.apiUrl, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Yield-Fetcher/1.0.0'
        }
      });
      return response.data;
    } catch (error) {
      this.logError('Error fetching APR', error);
      throw new Error(`Failed to fetch Lido APR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected calculateRiskScore(): number {
    // Lido is a well-established liquid staking protocol and ethereum is a well-established asset and chain
    // it also has a lot of liquidity and isnt locked since it is a liquid staking protocol
    return 2;
  }

  /**
   * Fetch and map Lido opportunities to unified format
   */
  async fetchOpportunities(): Promise<YieldOpportunity[]> {
    try {
      this.log('Fetching opportunities...');
      const response = await this.fetchAPR();

      // Create YieldOpportunity from fetched APR data
      const opportunity: YieldOpportunity = {
        id: 'lido-steth-staking',
        name: 'Lido stETH Staking',
        provider: this.name,
        asset: 'stETH',
        chain: 'ethereum',
        apr: response.data.apr / 100,
        category: OpportunityCategory.STAKING,
        liquidity: 'liquid',
        riskScore: this.calculateRiskScore(),
        updatedAt: new Date().toISOString(),
        yieldDate: new Date(response.data.timeUnix * 1000).toISOString()
      };

      this.log(`Successfully fetched opportunity for ${this.name} provider`);
      return [opportunity];
    } catch (error) {
      this.logError('Error fetching opportunities', error);
      throw error;
    }
  }
}