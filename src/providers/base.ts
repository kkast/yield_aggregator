import { OpportunityCategory, YieldOpportunity } from '../types/opportunities.js';

/**
 * Base Provider class that all yield providers should extend
 * 
 * This class defines the common interface and provides shared functionality
 * for all yield opportunity providers.
 */
export abstract class Provider {
  protected readonly name: string;
  protected readonly apiUrl: string;
  protected readonly interval: number;
  protected readonly timeout: number;

  constructor(name: string, apiUrl: string, interval: number = 10000, timeout: number = 10000) {
    this.name = name;
    this.apiUrl = apiUrl;
    this.interval = interval;
    this.timeout = timeout;
  }

  /**
   * Fetch opportunities from the provider
   */
  abstract fetchOpportunities(): Promise<YieldOpportunity[]>;

  /**
   * Log provider-specific information
   */
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  /**
   * Get the provider name
   */
  getName(): string {
    return this.name;
  }

    /**
   * Get the provider Interval
   */
    getInterval(): number {
      return this.interval;
    }

  /**
   * Log provider-specific errors
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.name}] ${message}`, error || '');
  }
}
