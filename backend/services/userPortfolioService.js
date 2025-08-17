/**
 * User Portfolio Service
 * Manages multi-wallet portfolios for comprehensive credit scoring
 */

const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const demoWalletService = require('./demoWalletService');
const fdcWeb2JsonService = require('./fdcWeb2JsonService');
const walletAnalysisService = require('./walletAnalysisService');

class UserPortfolioService {
  constructor() {
    // In-memory storage for demo (in production, use a database)
    this.userProfiles = new Map(); // userId -> userProfile
    this.walletToUser = new Map();  // walletAddress -> userId
    this.web3IdToUser = new Map();  // web3Id -> userId
  }

  /**
   * Create a new user with unique Web3 ID
   */
  async createUser(userData) {
    const userId = uuidv4();
    
    // Generate unique Web3 ID (could be a wallet address or custom ID)
    const web3IdWallet = ethers.Wallet.createRandom();
    const web3Id = web3IdWallet.address;

    const userProfile = {
      userId,
      web3Id,
      web3IdPrivateKey: web3IdWallet.privateKey,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      ssn: userData.ssn,
      dateOfBirth: userData.dateOfBirth,
      createdAt: new Date().toISOString(),
      
      // Portfolio data
      linkedWallets: [], // Array of connected transaction wallets
      onChainScore: null,
      offChainScore: null,
      compositeScore: null,
      
      // FDC attestation data
      fdcAttestation: null,
      lastScoreUpdate: null
    };

    this.userProfiles.set(userId, userProfile);
    this.web3IdToUser.set(web3Id, userId);

    console.log(`✅ Created user with Web3 ID: ${web3Id}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData.email}`);

    return {
      success: true,
      userId,
      web3Id,
      userProfile
    };
  }

  /**
   * Link a transaction wallet to user's portfolio
   */
  async linkWallet(userId, walletAddress, signature) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Validate wallet address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    // Check if wallet is already linked to another user
    if (this.walletToUser.has(walletAddress.toLowerCase())) {
      const existingUserId = this.walletToUser.get(walletAddress.toLowerCase());
      if (existingUserId !== userId) {
        throw new Error('Wallet already linked to another user');
      }
    }

    // Check if wallet is already linked to this user
    const existingWallet = userProfile.linkedWallets.find(
      w => w.address.toLowerCase() === walletAddress.toLowerCase()
    );
    if (existingWallet) {
      return {
        success: true,
        message: 'Wallet already linked',
        wallet: existingWallet
      };
    }

    // Calculate on-chain score for this wallet
    const onChainScore = await this.calculateWalletOnChainScore(walletAddress);

    // Create wallet entry
    const walletEntry = {
      address: walletAddress,
      linkedAt: new Date().toISOString(),
      onChainScore: onChainScore,
      signature: signature,
      isDemoWallet: demoWalletService.isDemoWallet(walletAddress),
      demoProfile: demoWalletService.isDemoWallet(walletAddress) 
        ? demoWalletService.getDemoWallet(walletAddress)?.profile 
        : null
    };

    // Add to user's portfolio
    userProfile.linkedWallets.push(walletEntry);
    this.walletToUser.set(walletAddress.toLowerCase(), userId);

    // Recalculate aggregated on-chain score
    await this.updateAggregatedOnChainScore(userId);

    console.log(`🔗 Linked wallet to user portfolio:`);
    console.log(`   User: ${userProfile.email} (${userProfile.web3Id})`);
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Individual Score: ${onChainScore}`);
    console.log(`   Portfolio Wallets: ${userProfile.linkedWallets.length}`);

    return {
      success: true,
      wallet: walletEntry,
      portfolioWallets: userProfile.linkedWallets.length,
      aggregatedOnChainScore: userProfile.onChainScore
    };
  }

  /**
   * Calculate on-chain score for individual wallet using real analysis
   */
  async calculateWalletOnChainScore(walletAddress) {
    try {
      const analysis = await walletAnalysisService.calculateWalletCreditScore(walletAddress);
      
      if (analysis.success) {
        console.log(`💰 Wallet analysis result: ${analysis.score} for ${walletAddress}`);
        if (analysis.breakdown) {
          console.log(`   Analysis: ${analysis.breakdown.analysis || 'Real wallet analysis'}`);
        }
        return analysis.score;
      } else {
        console.log(`⚠️  Wallet analysis failed for ${walletAddress}, using default score`);
        return 300; // Default score on failure
      }
    } catch (error) {
      console.error('Error in calculateWalletOnChainScore:', error);
      return 300; // Default score on error
    }
  }

  /**
   * Update aggregated on-chain score for user's portfolio
   */
  async updateAggregatedOnChainScore(userId) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;

    if (userProfile.linkedWallets.length === 0) {
      userProfile.onChainScore = null;
      return;
    }

    // Calculate weighted average based on wallet scores
    let totalScore = 0;
    let totalWeight = 0;

    for (const wallet of userProfile.linkedWallets) {
      // Weight could be based on wallet activity, age, etc.
      // For now, equal weighting
      const weight = 1;
      totalScore += wallet.onChainScore * weight;
      totalWeight += weight;
    }

    const aggregatedScore = Math.round(totalScore / totalWeight);
    userProfile.onChainScore = aggregatedScore;
    userProfile.lastScoreUpdate = new Date().toISOString();

    console.log(`📊 Updated aggregated on-chain score:`);
    console.log(`   User: ${userProfile.email}`);
    console.log(`   Wallets: ${userProfile.linkedWallets.length}`);
    console.log(`   Individual Scores: ${userProfile.linkedWallets.map(w => w.onChainScore).join(', ')}`);
    console.log(`   Aggregated Score: ${aggregatedScore}`);

    return aggregatedScore;
  }

  /**
   * Set off-chain score via FDC Web2JSON
   */
  async setOffChainScore(userId, ssnData) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    console.log(`🌐 Processing off-chain score for user: ${userProfile.email}`);
    console.log(`   Web3 ID: ${userProfile.web3Id}`);
    console.log(`   SSN: ${ssnData.ssn}`);

    // Process FDC Web2JSON attestation
    const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
      ssnData,
      userProfile.web3Id // Use Web3 ID as the address for FDC
    );

    if (!fdcResult.success) {
      throw new Error(`FDC attestation failed: ${fdcResult.error}`);
    }

    // Extract off-chain score from FDC result
    const offChainScore = fdcResult.attestationData.creditScore;
    
    // Update user profile
    userProfile.offChainScore = offChainScore;
    userProfile.fdcAttestation = fdcResult;
    userProfile.lastScoreUpdate = new Date().toISOString();

    console.log(`✅ Off-chain score set via FDC:`);
    console.log(`   Score: ${offChainScore}`);
    console.log(`   FDC Attestation: ${fdcResult.attestationId}`);

    // Update composite score
    await this.updateCompositeScore(userId);

    return {
      success: true,
      offChainScore,
      fdcAttestation: fdcResult
    };
  }

  /**
   * Calculate composite score (weighted combination)
   */
  async updateCompositeScore(userId) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;

    let compositeScore;
    let weights;

    if (userProfile.offChainScore && userProfile.onChainScore) {
      // Both scores available - weighted combination
      weights = { onChain: 0.3, offChain: 0.7 };
      compositeScore = Math.round(
        (userProfile.onChainScore * weights.onChain) + 
        (userProfile.offChainScore * weights.offChain)
      );
    } else if (userProfile.onChainScore) {
      // Only on-chain score available
      weights = { onChain: 1.0, offChain: 0.0 };
      compositeScore = userProfile.onChainScore;
    } else if (userProfile.offChainScore) {
      // Only off-chain score available
      weights = { onChain: 0.0, offChain: 1.0 };
      compositeScore = userProfile.offChainScore;
    } else {
      // No scores available
      compositeScore = null;
      weights = { onChain: 0.0, offChain: 0.0 };
    }

    userProfile.compositeScore = compositeScore;
    userProfile.lastScoreUpdate = new Date().toISOString();

    console.log(`🎯 Updated composite score:`);
    console.log(`   User: ${userProfile.email}`);
    console.log(`   On-chain: ${userProfile.onChainScore} (${userProfile.linkedWallets.length} wallets)`);
    console.log(`   Off-chain: ${userProfile.offChainScore}`);
    console.log(`   Composite: ${compositeScore}`);
    console.log(`   Weights: ${weights.onChain * 100}% on-chain, ${weights.offChain * 100}% off-chain`);

    return {
      scores: {
        onChain: userProfile.onChainScore,
        offChain: userProfile.offChainScore,
        composite: compositeScore
      },
      weights,
      portfolioWallets: userProfile.linkedWallets.length
    };
  }

  /**
   * Get user by ID
   */
  getUser(userId) {
    return this.userProfiles.get(userId);
  }

  /**
   * Get user by Web3 ID
   */
  getUserByWeb3Id(web3Id) {
    const userId = this.web3IdToUser.get(web3Id);
    return userId ? this.userProfiles.get(userId) : null;
  }

  /**
   * Get user by wallet address
   */
  getUserByWallet(walletAddress) {
    const userId = this.walletToUser.get(walletAddress.toLowerCase());
    return userId ? this.userProfiles.get(userId) : null;
  }

  /**
   * Get user's complete portfolio
   */
  getUserPortfolio(userId) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return null;

    return {
      userId: userProfile.userId,
      web3Id: userProfile.web3Id,
      email: userProfile.email,
      linkedWallets: userProfile.linkedWallets,
      scores: {
        onChain: userProfile.onChainScore,
        offChain: userProfile.offChainScore,
        composite: userProfile.compositeScore
      },
      fdcAttestation: userProfile.fdcAttestation,
      lastScoreUpdate: userProfile.lastScoreUpdate,
      portfolioSummary: {
        totalWallets: userProfile.linkedWallets.length,
        demoWallets: userProfile.linkedWallets.filter(w => w.isDemoWallet).length,
        walletScores: userProfile.linkedWallets.map(w => ({
          address: w.address,
          score: w.onChainScore,
          profile: w.demoProfile
        }))
      }
    };
  }

  /**
   * Reset all user data for demo purposes
   */
  resetAllData() {
    console.log('🧹 Resetting all user data for demo...');
    
    this.userProfiles.clear();
    this.walletToUser.clear();
    
    console.log('✅ All user data cleared successfully');
    
    return {
      success: true,
      message: 'All user data has been reset',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system stats for demo purposes
   */
  getSystemStats() {
    try {
      return {
        totalUsers: this.userProfiles.size,
        totalWallets: this.walletToUser.size,
        usersWithScores: Array.from(this.userProfiles.values()).filter(u => u.compositeScore !== null).length
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalUsers: 0,
        totalWallets: 0,
        usersWithScores: 0
      };
    }
  }
}

module.exports = new UserPortfolioService();
