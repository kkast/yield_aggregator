import axios from 'axios';
import { YieldOpportunity, OpportunityCategory } from '../types/opportunities.js';
import { Provider } from './base.js';

// Mmarinade API response interface
interface MarinadeAPRResponse {
  value: number,
  end_time: string,
  end_price: number,
  start_time: string,
  start_price: number,
}
// can be overridden by env variables
const MARINADE_MSOL_API_URL = 'https://api.marinade.finance/msol/apy/14d'; // the apy they show on the website seems to be the 14 day apy
const MARINADE_MSOL_INTERVAL_MS = 60000; // couldnt find info on how often this is updated but i saw it updating roughly 30 minutes
const MARINADE_MSOL_TIMEOUT_MS = 10000;

/**
 * Lido provider for fetching staking APR data
 * 
 * This provider fetches APR data from Lido's API and maps it to our unified
 * YieldOpportunity format.
 */
export class MarinadeMsolProvider extends Provider {
  constructor() {
    const apiUrl = process.env.MARINADE_MSOL_API_URL || MARINADE_MSOL_API_URL;
    const interval = parseInt(process.env.MARINADE_MSOL_INTERVAL_MS || '') || MARINADE_MSOL_INTERVAL_MS;
    const timeout = parseInt(process.env.MARINADE_MSOL_TIMEOUT_MS || '') || MARINADE_MSOL_TIMEOUT_MS;
      
      super('marinademsol', apiUrl, interval, timeout);
    }
      /**
   * Fetch APR data from Lido API
   */
  private async fetchAPR(): Promise<MarinadeAPRResponse> {
    try {
      const response = await axios.get<MarinadeAPRResponse>(this.apiUrl, {
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
    // Marina is a well-established liquid staking protocol and sokana is a well-established asset and chain
    // it also has a lot of liquidity and isnt locked since it is a liquid staking protocol
    // but it is riskier than lido because it is a new protocol and solana is more volatile
    return 4;
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
        id: 'marinade-msol-staking',
        name: 'Marinade mSol Staking',
        provider: this.name,
        asset: 'mSOL',
        chain: 'solana',
        apr: response.value,
        category: OpportunityCategory.STAKING,
        liquidity: 'liquid',
        riskScore: this.calculateRiskScore(),
        updatedAt: new Date().toISOString(),
        yieldDate: new Date(response.end_time).toISOString()
      };

      this.log(`Successfully fetched opportunity for ${this.name} provider`);
      return [opportunity];
    } catch (error) {
      this.logError('Error fetching opportunities', error);
      throw error;
    }
  }
}