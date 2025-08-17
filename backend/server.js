/**
 * DeFi Lending Platform Backend Server
 * Main entry point for the API server
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const creditScoreRoutes = require('./routes/creditScore');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DeFi Lending Platform API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    services: {
      experianMock: 'Available',
      web2JsonFDC: 'Available',
      flareNetwork: 'Connected'
    }
  });
});

// API Routes
app.use('/api/credit-score', creditScoreRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to DeFi Lending Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      creditScore: '/api/credit-score',
      authentication: '/api/auth',
      documentation: '/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    title: 'DeFi Lending Platform API Documentation',
    version: '1.0.0',
    endpoints: {
      creditScore: {
        test: {
          method: 'GET',
          path: '/api/credit-score/test',
          description: 'Test credit score API availability'
        },
        experianReport: {
          method: 'POST',
          path: '/api/credit-score/experian/report',
          description: 'Get full credit report from Experian (mock)',
          body: {
            ssn: 'string (required)',
            firstName: 'string (required)',
            lastName: 'string (required)',
            dateOfBirth: 'string (optional)',
            address: 'object (optional)'
          }
        },
        experianSimplified: {
          method: 'POST',
          path: '/api/credit-score/experian/simplified',
          description: 'Get simplified credit data for blockchain mapping',
          body: {
            ssn: 'string (required)'
          }
        },
        web2jsonAttest: {
          method: 'POST',
          path: '/api/credit-score/web2json/attest',
          description: 'Create Web2JSON attestation for credit score data (Legacy mock)',
          body: {
            ssn: 'string (required)',
            userAddress: 'string (required)'
          }
        },
        fdcAttest: {
          method: 'POST',
          path: '/api/credit-score/fdc/attest',
          description: 'Create FDC Web2JSON attestation for credit score data (Real FDC implementation)',
          body: {
            ssn: 'string (required)',
            userAddress: 'string (required)'
          }
        },
        completeFlow: {
          method: 'POST',
          path: '/api/credit-score/complete-flow',
          description: 'Complete flow: Experian -> FDC Web2JSON -> Smart Contract Ready Data',
          body: {
            ssn: 'string (required)',
            firstName: 'string (required)',
            lastName: 'string (required)',
            dateOfBirth: 'string (optional)',
            userAddress: 'string (required)'
          }
        },
        mockData: {
          method: 'GET',
          path: '/api/credit-score/mock-data',
          description: 'Get available mock SSNs for testing'
        }
      },
      authentication: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          body: {
            email: 'string (required)',
            password: 'string (required)',
            firstName: 'string (required)',
            lastName: 'string (required)',
            ssn: 'string (required)',
            dateOfBirth: 'string (optional)'
          }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login user and get JWT token',
          body: {
            email: 'string (required)',
            password: 'string (required)'
          }
        },
        profile: {
          method: 'GET',
          path: '/api/auth/profile',
          description: 'Get user profile (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          }
        },
        createWallet: {
          method: 'POST',
          path: '/api/auth/wallet/create',
          description: 'Create a new wallet for user (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          }
        },
        linkWallet: {
          method: 'POST',
          path: '/api/auth/wallet/link',
          description: 'Link existing wallet to user (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          },
          body: {
            walletAddress: 'string (required)',
            signature: 'string (required)'
          }
        },
        onChainScore: {
          method: 'GET',
          path: '/api/auth/score/onchain',
          description: 'Get on-chain credit score (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          }
        },
        offChainScore: {
          method: 'POST',
          path: '/api/auth/score/offchain',
          description: 'Update off-chain credit score using FDC (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          },
          body: {
            ssn: 'string (required)',
            firstName: 'string (optional)',
            lastName: 'string (optional)',
            dateOfBirth: 'string (optional)'
          }
        },
        compositeScore: {
          method: 'GET',
          path: '/api/auth/score/composite',
          description: 'Get composite credit score (on-chain + off-chain weighted) (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          }
        },
        completeOnboarding: {
          method: 'POST',
          path: '/api/auth/complete-onboarding',
          description: 'Complete user onboarding with wallet and credit scoring (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          },
          body: {
            createWallet: 'boolean (optional)',
            linkWallet: 'boolean (optional)',
            walletAddress: 'string (required if linkWallet=true)',
            signature: 'string (required if linkWallet=true)',
            ssn: 'string (optional)',
            firstName: 'string (optional)',
            lastName: 'string (optional)',
            dateOfBirth: 'string (optional)'
          }
        },
        dashboard: {
          method: 'GET',
          path: '/api/auth/dashboard',
          description: 'Get complete user dashboard data (requires authentication)',
          headers: {
            Authorization: 'Bearer <jwt_token>'
          }
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
🚀 DeFi Lending Platform API Server Started
📍 Environment: ${config.nodeEnv}
🌐 Server running on: http://localhost:${PORT}
📚 API Documentation: http://localhost:${PORT}/api/docs
🔍 Health Check: http://localhost:${PORT}/health

Available Services:
✅ Experian Mock API
✅ Web2JSON FDC Integration
✅ Flare Network Connection

Ready to process credit score attestations!
  `);
});

module.exports = app;
