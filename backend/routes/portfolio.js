/**
 * Portfolio API Routes
 * Handles multi-wallet portfolio management and scoring
 */

const express = require('express');
const router = express.Router();
const userPortfolioService = require('../services/userPortfolioService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate user
 */
async function authenticateUser(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * POST /api/portfolio/login
 * Simple login endpoint (for demo purposes)
 */
router.post('/login', async (req, res) => {
  // 🚨 SECURITY: This endpoint has been disabled
  // It was automatically creating users without password validation!
  res.status(410).json({
    success: false,
    error: '🚨 SECURITY: This endpoint has been disabled',
    message: 'This endpoint was creating users without password validation!',
    solution: 'Use /api/auth/login for secure authentication',
    redirect: '/api/auth/login'
  });
});

/**
 * POST /api/portfolio/register
 * Register new user with unique Web3 ID
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, ssn, dateOfBirth } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !ssn) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName, ssn'
      });
    }

    // Create user with portfolio service
    const result = await userPortfolioService.createUser({
      email,
      firstName,
      lastName,
      ssn,
      dateOfBirth
    });

    // Hash password and create JWT token
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      { userId: result.userId, web3Id: result.web3Id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Store password (in production, use proper database)
    result.userProfile.passwordHash = hashedPassword;

    console.log(`👤 New user registered with portfolio system:`);
    console.log(`   Email: ${email}`);
    console.log(`   Web3 ID: ${result.web3Id}`);
    console.log(`   User ID: ${result.userId}`);

    res.json({
      success: true,
      message: 'User registered successfully with Web3 ID',
      token,
      user: {
        userId: result.userId,
        web3Id: result.web3Id,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed: ' + error.message
    });
  }
});

/**
 * POST /api/portfolio/link-wallet
 * Link a transaction wallet to user's portfolio
 */
router.post('/link-wallet', authenticateUser, async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const result = await userPortfolioService.linkWallet(
      req.userId,
      walletAddress,
      signature || 'demo_signature'
    );

    console.log(`🔗 Wallet linked to portfolio:`);
    console.log(`   User ID: ${req.userId}`);
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Portfolio Size: ${result.portfolioWallets} wallets`);

    res.json({
      success: true,
      message: 'Wallet linked to portfolio successfully',
      wallet: result.wallet,
      portfolioSummary: {
        totalWallets: result.portfolioWallets,
        aggregatedOnChainScore: result.aggregatedOnChainScore
      }
    });
  } catch (error) {
    console.error('Wallet linking error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/portfolio/set-offchain-score
 * Set off-chain score via FDC Web2JSON
 */
router.post('/set-offchain-score', authenticateUser, async (req, res) => {
  try {
    const { ssn, firstName, lastName } = req.body;

    if (!ssn) {
      return res.status(400).json({
        success: false,
        error: 'SSN is required for off-chain score'
      });
    }

    const result = await userPortfolioService.setOffChainScore(req.userId, {
      ssn,
      firstName: firstName || 'Demo',
      lastName: lastName || 'User'
    });

    console.log(`🌐 Off-chain score set via FDC:`);
    console.log(`   User ID: ${req.userId}`);
    console.log(`   Score: ${result.offChainScore}`);
    console.log(`   FDC Attestation: ${result.fdcAttestation.attestationId}`);

    res.json({
      success: true,
      message: 'Off-chain score set via FDC Web2JSON',
      offChainScore: result.offChainScore,
      fdcAttestation: {
        attestationId: result.fdcAttestation.attestationId,
        fdcImplementation: result.fdcAttestation.fdcImplementation,
        documentationRef: result.fdcAttestation.documentationRef
      }
    });
  } catch (error) {
    console.error('Off-chain score error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/portfolio/scores
 * Get complete portfolio scores (on-chain, off-chain, composite)
 */
// Demo: Reset all data
router.post('/demo/reset', async (req, res) => {
  try {
    // Import userAuthService to reset authentication data
    const userAuthService = require('../services/userAuthService');
    
    // Reset both portfolio and authentication data
    const portfolioResult = userPortfolioService.resetAllData();
    const authResult = userAuthService.resetAllData();
    
    console.log('🧹 Demo reset completed - cleared both auth and portfolio data');
    
    res.json({
      success: true,
      message: 'All demo data has been reset (authentication + portfolio)',
      timestamp: new Date().toISOString(),
      details: {
        portfolio: portfolioResult,
        authentication: authResult
      }
    });
  } catch (error) {
    console.error('Demo reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset demo data'
    });
  }
});

// Demo: Get system stats
router.get('/demo/stats', async (req, res) => {
  try {
    const stats = userPortfolioService.getSystemStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Demo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats'
    });
  }
});

// Blockchain: Get storage status
router.get('/blockchain/status', async (req, res) => {
  try {
    const hybridStorageService = require('../services/hybridStorageService');
    const status = hybridStorageService.getServiceStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain status'
    });
  }
});

// Blockchain: Get storage stats
router.get('/blockchain/stats', async (req, res) => {
  try {
    const hybridStorageService = require('../services/hybridStorageService');
    const stats = await hybridStorageService.getStorageStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blockchain stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain stats'
    });
  }
});

router.get('/scores', authenticateUser, async (req, res) => {
  try {
    const result = await userPortfolioService.updateCompositeScore(req.userId);
    const portfolio = userPortfolioService.getUserPortfolio(req.userId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'User portfolio not found'
      });
    }

    res.json({
      success: true,
      scores: result.scores,
      weights: result.weights,
      portfolioSummary: {
        totalWallets: result.portfolioWallets,
        walletBreakdown: portfolio.portfolioSummary.walletScores,
        lastUpdate: portfolio.lastScoreUpdate
      }
    });
  } catch (error) {
    console.error('Score retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/portfolio/details
 * Get complete user portfolio details
 */
router.get('/details', authenticateUser, async (req, res) => {
  try {
    const portfolio = userPortfolioService.getUserPortfolio(req.userId);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'User portfolio not found'
      });
    }

    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Portfolio details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/portfolio/demo-scenario
 * Create demo scenario with multiple wallets for hackathon
 */
router.post('/demo-scenario', async (req, res) => {
  try {
    const { scenarioType } = req.body;

    let demoData;

    if (scenarioType === 'USER_X') {
      // User X: Mixed portfolio (2 excellent + 1 bad)
      demoData = {
        user: {
          email: 'userx@demo.com',
          firstName: 'User',
          lastName: 'X',
          ssn: '111-11-1111', // Excellent off-chain score
          password: 'DemoX123!'
        },
        wallets: [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Excellent Alice
          '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', // Premium Henry
          '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'  // Bad Eve
        ]
      };
    } else if (scenarioType === 'USER_Y') {
      // User Y: Consistent portfolio (2 good)
      demoData = {
        user: {
          email: 'usery@demo.com',
          firstName: 'User',
          lastName: 'Y',
          ssn: '222-22-2222', // Good off-chain score
          password: 'DemoY123!'
        },
        wallets: [
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Good Bob
          '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'  // Student Ivy
        ]
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenario type. Use USER_X or USER_Y'
      });
    }

    res.json({
      success: true,
      message: `Demo scenario ${scenarioType} ready`,
      demoData,
      instructions: {
        step1: 'Register user with provided data',
        step2: 'Link wallets one by one to show score progression',
        step3: 'Set off-chain score with SSN',
        step4: 'Show final composite score calculation'
      }
    });
  } catch (error) {
    console.error('Demo scenario error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
