import { YieldOpportunity } from '../types/opportunities.js';
import { Provider } from './base.js';
import { LidoStethProvider } from './lido-steth.js';
import { MarinadeMsolProvider } from './marinade-msol.js';
import { DeFiLlamaProvider } from './defillama.js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all available provider classes
// Note: These will be instantiated based on ENABLED_PROVIDERS env var
const AVAILABLE_PROVIDER_CLASSES: Record<string, new () => Provider> = {
  lidosteth: LidoStethProvider,
  marinademsol: MarinadeMsolProvider,
  defillama: DeFiLlamaProvider,
  // Add new providers here:
};

/**
 * Provider registry and management
 * 
 * This module centralizes all provider operations and makes it easy to
 * add new providers in the future. Simply:
 * 1. Create a new provider file in providers/ directory
 * 2. Add it to AVAILABLE_PROVIDERS above
 * 3. The fetcher will automatically include enabled providers
 */
export class ProviderRegistry {
  private enabledProviders: Provider[] = [];
  private initialized: boolean = false;

  constructor(){
    if (this.initialized) {
      return;
    }

    const enabledProvidersStr = process.env.ENABLED_PROVIDERS;
    if (!enabledProvidersStr) {
      throw new Error('ENABLED_PROVIDERS environment variable is not set');
    }
    const enabledProviderNames = enabledProvidersStr
      .split(',')
      .map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0);

    console.log(`Initializing providers: ${enabledProviderNames.join(', ')}`);

    for (const name of enabledProviderNames) {
      if (name in AVAILABLE_PROVIDER_CLASSES) {
        const provider = new AVAILABLE_PROVIDER_CLASSES[name]();
        this.enabledProviders.push(provider);
        console.log(`✅ Provider '${name}' enabled`);
      } else {
        console.warn(`⚠️  Provider '${name}' not found. Available providers: ${Object.keys(AVAILABLE_PROVIDER_CLASSES).join(', ')}`);
      }
    }

    if (this.enabledProviders.length === 0) {
      console.error('❌ No providers enabled. Please set ENABLED_PROVIDERS environment variable.');
      console.error(`Available providers: ${Object.keys(AVAILABLE_PROVIDER_CLASSES).join(', ')}`);
      process.exit(1);
    }

    this.initialized = true;
  }

  /**
   * Get list of all enabled providers
   */
  getEnabledProviders(): Provider[] {
    return [...this.enabledProviders];
  }

}
