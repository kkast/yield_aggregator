import { config } from 'dotenv';
import { ProviderRegistry } from '../providers/index.js';
import { db } from '../db/client.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Provider } from '../providers/base.js';
import { YieldOpportunity } from '../types/opportunities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from env.fetcher file
config({ path: path.join(__dirname, '..', '..', 'env.fetcher') });

/**
 * Fetcher Service
 * 
 * This service periodically fetches yield opportunities from enabled providers
 * and stores them in the database. Each provider can have its own fetch interval.
 */
class FetcherService {
  private providerRegistry: ProviderRegistry;
  private providerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.providerRegistry = new ProviderRegistry();
  }

  /**
   * Fetch and store opportunities from a specific provider
   */
  private async fetchAndStoreProvider(provider: Provider): Promise<void> {
    const name = provider.getName();
    try {
      console.log(`Starting fetch cycle for ${name}...`);
      const startTime = Date.now();

      // Fetch opportunities from this provider
      const opportunities = await provider.fetchOpportunities();
      
      if (opportunities.length === 0) {
        console.log(`No opportunities fetched from ${name}`);
        return;
      }

      // Store opportunities in batch for better performance
      const { success, failed } = await db.batchUpsertOpportunities(opportunities);
      
      const duration = Date.now() - startTime;
      console.log(`Fetch cycle for ${provider.getName()} completed in ${duration}ms. Stored ${success} opportunities, ${failed} failed.`);
    } catch (error) {
      console.error(`Error in fetch cycle for ${provider.getName()}:`, error);
    }
  }


  /**
   * Start the fetcher service
   */
  async start(): Promise<void> {
    try {
      console.log('Starting Fetcher Service...');
      
      const enabledProviders = this.providerRegistry.getEnabledProviders();

      // Test database connection
      const dbConnected = await db.testConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }
      console.log('Database connection successful');

      // Run initial fetch for each provider
      for (const provider of enabledProviders) {
        await this.fetchAndStoreProvider(provider);
      }

      for (const provider of enabledProviders) {
        const name = provider.getName();
        const interval = provider.getInterval();
        
        const intervalId = setInterval(() => {
          this.fetchAndStoreProvider(provider)
        }, interval);

        this.providerIntervals.set(name, intervalId);
        console.log(`Scheduled ${name} to run every ${interval}ms`);

      }

      console.log('Fetcher Service started successfully');
    } catch (error) {
      console.error('Failed to start Fetcher Service:', error);
      await this.stop(); // Ensure resources are cleaned up before exit
      process.exit(1);
    }
  }

  /**
   * Stop the fetcher service
   */
  async stop(): Promise<void> {
    // Clear all intervals
    for (const [name, intervalId] of this.providerIntervals) {
      clearInterval(intervalId);
      console.log(`Stopped interval for ${name}`);
    }
    this.providerIntervals.clear();
    
    await db.disconnect();
    console.log('Fetcher Service stopped');
  }

  /**
   * Handle graceful shutdown
   */
  setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Start the fetcher service
const fetcher = new FetcherService();
fetcher.setupGracefulShutdown();

fetcher.start().catch(async (error) => {
  console.error('Failed to start fetcher:', error);
  await fetcher.stop();
  process.exit(1);
});
