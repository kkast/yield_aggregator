import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { db } from '../db/client.js';
import { 
  YieldOpportunityArraySchema, 
  HealthResponseSchema,
  YieldOpportunity 
} from '../types/opportunities.js';
import { z } from 'zod';
import { extractUserIdFromToken } from './auth.js';
import { MatchRequestSchema, type MatchRequest } from '../types/user.js';
// Load environment variables
config();

const app = express();
const port = parseInt(process.env.PORT || '3000');

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * GET /api/earn/opportunities
 * Returns all yield opportunities from the database
 */
app.get('/api/earn/opportunities', async (req, res) => {
  try {
    const opportunities = await db.getAllOpportunities();
    
    // Validate response with Zod
    const validatedOpportunities = YieldOpportunityArraySchema.parse(opportunities);
    
    res.json({
      success: true,
      data: validatedOpportunities,
      count: validatedOpportunities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch opportunities',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health
 * Service health check + databse connectivity
 */
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();
    
    const healthResponse = HealthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected
    });

    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: false,
      error: 'Health check failed'
    });
  }
});

/**
 * match opportunities to a user's portfolio
 * if user has SOL, we will search for opportunities that are on solana
 * if user has ETH, we will search for opportunities that are on ethereum
 * if user specifies any other asset, we will search for opportunities that match that asset
 */
async function matchOpportunities(matchRequest: z.infer<typeof MatchRequestSchema>): Promise<YieldOpportunity[]> {
  const opportunities = await db.getAllOpportunities();
  const validatedOpportunities = YieldOpportunityArraySchema.parse(opportunities);
  let matchedOpportunities = validatedOpportunities.filter((opportunity) => {
    if (opportunity.riskScore > matchRequest.riskTolerance) {
      return false;
    }
    if(matchRequest.investmentHorizon < 60 && opportunity.liquidity === 'locked') {
      return false;
    }

    if(matchRequest.walletBalance[opportunity.asset]) {
      return true;
    }
    if(opportunity.chain === 'solana' && !matchRequest.walletBalance.SOL) {
      return false;
    }
    if(opportunity.chain === 'ethereum' && !matchRequest.walletBalance.ETH) {
      return false;
    }
    
    return true;
  })


  return matchedOpportunities;
}

/**
 * POST /api/earn/opportunities/match
 * match opportunities to a user's portfolio
 */
app.post('/api/earn/opportunities/match', async (req, res) => {
  try {
    // Validate the request body
    const parsedBody = MatchRequestSchema.parse(req.body);
    const matchedOpportunities = await matchOpportunities(parsedBody);
    res.status(200).json({
      success: true,
      data: matchedOpportunities,
      count: matchedOpportunities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * GET /api/user/match
 * Get user's match configuration
 */
app.get('/api/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = extractUserIdFromToken(authHeader);
    console.log('userId', userId)
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Valid JWT token required',
        timestamp: new Date().toISOString()
      });
    }

    const userMatch = await db.getUserMatch(userId);
    
    res.json({
      success: true,
      data: userMatch,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user match configuration',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/user/match
 * Create or update user's match configuration
 */
app.post('/api/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = extractUserIdFromToken(authHeader);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Valid JWT token required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate the request body
    const parsedBody = MatchRequestSchema.parse(req.body);
    
    const userMatch = await db.upsertUserMatch(userId, {
      walletBalance: parsedBody.walletBalance,
      riskTolerance: parsedBody.riskTolerance,
      maxAllocationPct: parsedBody.maxAllocationPct,
      investmentHorizon: parsedBody.investmentHorizon
    });

    res.json({
      success: true,
      data: userMatch,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Error upserting user match:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save user match configuration',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

/**
 * Start the API server
 */
async function startServer() {
  try {
    console.log('Starting API Server...');
    
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connection successful');
    
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
      console.log(`Health check: GET http://localhost:${port}/health`);
      console.log(`Opportunities: GET http://localhost:${port}/api/earn/opportunities`);
      console.log(`Match Opportunities: POST http://localhost:${port}/api/earn/opportunities/match`);
    });
  } catch (error) {
    console.error('Failed to start API Server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  await db.disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
