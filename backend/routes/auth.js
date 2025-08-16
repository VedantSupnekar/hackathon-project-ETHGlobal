/**
 * Authentication API Routes
 * Handles user registration, login, wallet management, and credit scoring
 */

const express = require('express');
const router = express.Router();
const userAuthService = require('../services/userAuthService');
const experianMock = require('../services/experianMock');
const fdcWeb2JsonService = require('../services/fdcWeb2JsonService');

/**
 * POST /api/auth/register
 * Register a new user
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

    // Register user
    const result = await userAuthService.registerUser({
      email,
      password,
      firstName,
      lastName,
      ssn,
      dateOfBirth
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in register route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await userAuthService.loginUser({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get user profile (requires authentication)
 */
router.get('/profile', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const result = await userAuthService.getUserProfile(req.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching profile'
    });
  }
});

/**
 * POST /api/auth/wallet/create
 * Create a new wallet for user
 */
router.post('/wallet/create', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const result = await userAuthService.createWallet(req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating wallet'
    });
  }
});

/**
 * POST /api/auth/wallet/link
 * Link an existing wallet to user
 */
router.post('/wallet/link', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and signature are required'
      });
    }

    const result = await userAuthService.linkWallet(req.userId, walletAddress, signature);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error linking wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while linking wallet'
    });
  }
});

/**
 * GET /api/auth/score/onchain
 * Get on-chain credit score for user's wallets
 */
router.get('/score/onchain', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const result = await userAuthService.calculateCompositeScore(req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      onChainScore: result.scores.onChain,
      breakdown: result.breakdown,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Error calculating on-chain score:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while calculating on-chain score'
    });
  }
});

/**
 * POST /api/auth/score/offchain
 * Update off-chain credit score using FDC Web2JSON
 */
router.post('/score/offchain', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const { ssn, firstName, lastName, dateOfBirth } = req.body;

    if (!ssn) {
      return res.status(400).json({
        success: false,
        error: 'SSN is required for off-chain credit score'
      });
    }

    // Get user profile
    const userProfile = await userAuthService.getUserProfile(req.userId);
    if (!userProfile.success) {
      return res.status(404).json(userProfile);
    }

    const user = userProfile.profile;

    // Get credit data from Experian mock
    const creditData = await experianMock.getSimplifiedCreditData(ssn);
    if (!creditData) {
      return res.status(404).json({
        success: false,
        error: 'No credit data found for provided SSN'
      });
    }

    // Add SSN for FDC processing
    creditData.ssn = ssn;

    // Use primary wallet for FDC attestation
    const walletAddress = user.primaryWallet || user.wallets[0]?.address;
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet found. Please create or link a wallet first.'
      });
    }

    // Process FDC Web2JSON attestation
    const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
      creditData,
      walletAddress
    );

    if (!fdcResult.success) {
      return res.status(500).json({
        success: false,
        error: `FDC attestation failed: ${fdcResult.error}`
      });
    }

    // Update user's off-chain score
    const updateResult = await userAuthService.updateOffChainScore(
      req.userId,
      creditData.creditScore,
      fdcResult
    );

    if (!updateResult.success) {
      return res.status(500).json(updateResult);
    }

    res.json({
      success: true,
      offChainScore: creditData.creditScore,
      compositeScore: updateResult.compositeScore,
      fdcAttestation: fdcResult,
      message: 'Off-chain credit score updated successfully'
    });
  } catch (error) {
    console.error('Error updating off-chain score:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating off-chain score'
    });
  }
});

/**
 * GET /api/auth/score/composite
 * Get composite credit score (on-chain + off-chain weighted)
 */
router.get('/score/composite', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const result = await userAuthService.calculateCompositeScore(req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      scores: result.scores,
      weights: result.weights,
      breakdown: result.breakdown,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Error calculating composite score:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while calculating composite score'
    });
  }
});

/**
 * POST /api/auth/complete-onboarding
 * Complete user onboarding with wallet creation/linking and credit scoring
 */
router.post('/complete-onboarding', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    const { 
      createWallet, 
      linkWallet, 
      walletAddress, 
      signature, 
      ssn, 
      firstName, 
      lastName, 
      dateOfBirth 
    } = req.body;

    const results = {
      wallet: null,
      onChainScore: null,
      offChainScore: null,
      compositeScore: null
    };

    // Step 1: Handle wallet creation or linking
    if (createWallet) {
      console.log(`Creating new wallet for user ${req.userId}`);
      const walletResult = await userAuthService.createWallet(req.userId);
      if (!walletResult.success) {
        return res.status(400).json({
          success: false,
          error: `Wallet creation failed: ${walletResult.error}`
        });
      }
      results.wallet = walletResult.wallet;
    } else if (linkWallet && walletAddress && signature) {
      console.log(`Linking existing wallet ${walletAddress} for user ${req.userId}`);
      const linkResult = await userAuthService.linkWallet(req.userId, walletAddress, signature);
      if (!linkResult.success) {
        return res.status(400).json({
          success: false,
          error: `Wallet linking failed: ${linkResult.error}`
        });
      }
      results.wallet = linkResult.wallet;
    }

    // Step 2: Calculate on-chain score
    console.log(`Calculating on-chain score for user ${req.userId}`);
    const onChainResult = await userAuthService.calculateCompositeScore(req.userId);
    if (onChainResult.success) {
      results.onChainScore = onChainResult.scores.onChain;
    }

    // Step 3: Process off-chain score if SSN provided
    if (ssn) {
      console.log(`Processing off-chain score for user ${req.userId}`);
      
      // Get user profile to find wallet address
      const userProfile = await userAuthService.getUserProfile(req.userId);
      if (userProfile.success) {
        const user = userProfile.profile;
        const targetWallet = user.primaryWallet || user.wallets[0]?.address;

        if (targetWallet) {
          // Get credit data from Experian mock
          const creditData = await experianMock.getSimplifiedCreditData(ssn);
          if (creditData) {
            creditData.ssn = ssn;

            // Process FDC Web2JSON attestation
            const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
              creditData,
              targetWallet
            );

            if (fdcResult.success) {
              // Update user's off-chain score
              const updateResult = await userAuthService.updateOffChainScore(
                req.userId,
                creditData.creditScore,
                fdcResult
              );

              if (updateResult.success) {
                results.offChainScore = creditData.creditScore;
                results.compositeScore = updateResult.compositeScore;
              }
            }
          }
        }
      }
    }

    // Step 4: Final composite score calculation
    const finalScoreResult = await userAuthService.calculateCompositeScore(req.userId);
    if (finalScoreResult.success) {
      results.compositeScore = finalScoreResult.scores.composite;
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during onboarding'
    });
  }
});

/**
 * GET /api/auth/dashboard
 * Get complete user dashboard data
 */
router.get('/dashboard', userAuthService.authenticateToken.bind(userAuthService), async (req, res) => {
  try {
    // Get user profile
    const profileResult = await userAuthService.getUserProfile(req.userId);
    if (!profileResult.success) {
      return res.status(404).json(profileResult);
    }

    const user = profileResult.profile;

    // Calculate latest scores
    const scoreResult = await userAuthService.calculateCompositeScore(req.userId);

    // Get detailed wallet information
    const walletDetails = [];
    for (const wallet of user.wallets) {
      const onChainScore = await userAuthService.calculateOnChainScore(wallet.address);
      walletDetails.push({
        address: wallet.address,
        isGenerated: wallet.isGenerated,
        createdAt: wallet.createdAt,
        onChainScore: onChainScore.success ? onChainScore.score : wallet.initialOnChainScore,
        defiActivity: onChainScore.success ? onChainScore.defiActivity : null
      });
    }

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isSSNVerified: user.isSSNVerified,
          isKYCComplete: user.isKYCComplete,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        creditProfile: {
          onChainScore: scoreResult.success ? scoreResult.scores.onChain : null,
          offChainScore: scoreResult.success ? scoreResult.scores.offChain : null,
          compositeScore: scoreResult.success ? scoreResult.scores.composite : null,
          weights: scoreResult.success ? scoreResult.weights : null,
          lastUpdated: user.creditProfile.lastUpdated
        },
        wallets: {
          count: user.wallets.length,
          primary: user.primaryWallet,
          details: walletDetails
        },
        stats: {
          totalWallets: user.wallets.length,
          hasOffChainData: !!user.creditProfile.offChainScore,
          accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard'
    });
  }
});

module.exports = router;

