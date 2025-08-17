/**
 * User Authentication Service
 * Handles user signup, login, SSN verification, and wallet management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const demoWalletService = require('./demoWalletService');

class UserAuthService {
  constructor() {
    // In-memory storage for demo (in production, use a database)
    this.users = new Map();
    this.walletMappings = new Map(); // wallet -> userId mapping
    this.userSessions = new Map();
    this.ssnVerifications = new Map();
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Registration result
   */
  async registerUser(userData) {
    try {
      const { email, password, firstName, lastName, ssn, dateOfBirth } = userData;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !ssn) {
        throw new Error('Missing required fields');
      }

      // Check if user already exists
      if (this.findUserByEmail(email)) {
        throw new Error('User already exists with this email');
      }

      // Validate SSN format (basic validation)
      if (!this.validateSSN(ssn)) {
        throw new Error('Invalid SSN format');
      }

      // Check if SSN is already registered
      if (this.findUserBySSN(ssn)) {
        throw new Error('SSN already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user ID
      const userId = uuidv4();

      // Create user object
      const user = {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        ssn,
        dateOfBirth,
        wallets: [], // Array of connected wallets
        primaryWallet: null, // Primary wallet address
        isSSNVerified: false,
        isKYCComplete: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        creditProfile: {
          offChainScore: null,
          onChainScore: null,
          compositeScore: null,
          lastUpdated: null
        }
      };

      // Store user
      this.users.set(userId, user);

      // Generate JWT token
      const token = this.generateJWT(userId);

      console.log(`New user registered: ${email} (ID: ${userId})`);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login user
   * @param {Object} loginData - Login credentials
   * @returns {Object} Login result
   */
  async loginUser(loginData) {
    try {
      const { email, password } = loginData;

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user
      const user = this.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date().toISOString();

      // Generate JWT token
      const token = this.generateJWT(user.id);

      console.log(`User logged in: ${email} (ID: ${user.id})`);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new wallet for user
   * @param {string} userId - User ID
   * @returns {Object} Wallet creation result
   */
  async createWallet(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey, // In production, encrypt this
        publicKey: wallet.publicKey,
        mnemonic: wallet.mnemonic.phrase,
        createdAt: new Date().toISOString(),
        isGenerated: true,
        initialOnChainScore: 300, // Default score for new wallets
        transactions: [],
        defiActivity: {
          totalVolume: 0,
          protocolsUsed: [],
          liquidityProvided: 0,
          stakingHistory: [],
          borrowingHistory: []
        }
      };

      // Add wallet to user
      user.wallets.push(walletData);

      // Set as primary wallet if it's the first one
      if (!user.primaryWallet) {
        user.primaryWallet = wallet.address;
      }

      // Create wallet mapping
      this.walletMappings.set(wallet.address, userId);

      console.log(`New wallet created for user ${userId}: ${wallet.address}`);

      return {
        success: true,
        wallet: {
          address: wallet.address,
          publicKey: wallet.publicKey,
          mnemonic: wallet.mnemonic.phrase,
          isGenerated: true
        },
        message: 'Wallet created successfully'
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Link an existing wallet to user
   * @param {string} userId - User ID
   * @param {string} walletAddress - Wallet address to link
   * @param {string} signature - Signature to verify ownership
   * @returns {Object} Wallet linking result
   */
  async linkWallet(userId, walletAddress, signature) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate wallet address
      if (!ethers.utils.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      // Check if wallet is already linked to another user
      const existingUserId = this.walletMappings.get(walletAddress);
      if (existingUserId && existingUserId !== userId) {
        throw new Error('Wallet already linked to another account');
      }

      // Check if wallet is already linked to this user
      const existingWallet = user.wallets.find(w => w.address === walletAddress);
      if (existingWallet) {
        throw new Error('Wallet already linked to this account');
      }

      // In production, verify signature to prove wallet ownership
      // For now, we'll simulate this verification
      if (!signature || signature.length < 10) {
        throw new Error('Valid signature required to prove wallet ownership');
      }

      // Calculate initial on-chain score for existing wallet
      const onChainScore = await this.calculateOnChainScore(walletAddress);

      const walletData = {
        address: walletAddress,
        privateKey: null, // User controls this wallet
        publicKey: null,
        mnemonic: null,
        createdAt: new Date().toISOString(),
        isGenerated: false,
        initialOnChainScore: onChainScore.score,
        transactions: onChainScore.transactions || [],
        defiActivity: onChainScore.defiActivity || {
          totalVolume: 0,
          protocolsUsed: [],
          liquidityProvided: 0,
          stakingHistory: [],
          borrowingHistory: []
        }
      };

      // Add wallet to user
      user.wallets.push(walletData);

      // Set as primary wallet if it's the first one
      if (!user.primaryWallet) {
        user.primaryWallet = walletAddress;
      }

      // Create wallet mapping
      this.walletMappings.set(walletAddress, userId);

      console.log(`Wallet linked for user ${userId}: ${walletAddress}`);

      return {
        success: true,
        wallet: {
          address: walletAddress,
          isGenerated: false,
          onChainScore: onChainScore.score,
          defiActivity: walletData.defiActivity
        },
        message: 'Wallet linked successfully'
      };
    } catch (error) {
      console.error('Error linking wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate on-chain credit score for a wallet
   * @param {string} walletAddress - Wallet address
   * @returns {Object} On-chain score calculation
   */
  async calculateOnChainScore(walletAddress) {
    try {
      // Check if this is a demo wallet first for hackathon demo
      if (demoWalletService.isDemoWallet(walletAddress)) {
        const demoScore = demoWalletService.calculateDemoOnChainScore(walletAddress);
        console.log(`🎭 Demo wallet on-chain score: ${demoScore} for ${walletAddress}`);
        
        return {
          success: true,
          score: demoScore,
          breakdown: {
            baseScore: 300,
            activityScore: demoScore - 300,
            totalScore: demoScore,
            isDemoWallet: true,
            demoProfile: demoWalletService.getDemoWallet(walletAddress)?.profile
          }
        };
      }

      // Simulate on-chain analysis for regular wallets
      // In production, this would analyze real blockchain data
      
      const mockAnalysis = this.generateMockOnChainData(walletAddress);
      
      let score = 300; // Base score
      
      // Transaction history factor (0-150 points)
      const txCount = mockAnalysis.transactions.length;
      const txScore = Math.min(txCount * 2, 150);
      score += txScore;

      // DeFi activity factor (0-200 points)
      const defiScore = Math.min(mockAnalysis.defiActivity.totalVolume / 1000, 200);
      score += defiScore;

      // Protocol diversity factor (0-100 points)
      const protocolScore = Math.min(mockAnalysis.defiActivity.protocolsUsed.length * 20, 100);
      score += protocolScore;

      // Liquidity provision factor (0-100 points)
      const liquidityScore = Math.min(mockAnalysis.defiActivity.liquidityProvided / 10000, 100);
      score += liquidityScore;

      // Staking factor (0-50 points)
      const stakingScore = Math.min(mockAnalysis.defiActivity.stakingHistory.length * 10, 50);
      score += stakingScore;

      // Cap the score at 850 (same as traditional credit scores)
      score = Math.min(score, 850);

      return {
        success: true,
        score: Math.round(score),
        breakdown: {
          baseScore: 300,
          transactionScore: txScore,
          defiScore: Math.round(defiScore),
          protocolScore: protocolScore,
          liquidityScore: Math.round(liquidityScore),
          stakingScore: stakingScore
        },
        transactions: mockAnalysis.transactions,
        defiActivity: mockAnalysis.defiActivity,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error calculating on-chain score:', error);
      return {
        success: false,
        score: 300, // Default score
        error: error.message
      };
    }
  }

  /**
   * Generate mock on-chain data for demonstration
   * @param {string} walletAddress - Wallet address
   * @returns {Object} Mock on-chain data
   */
  generateMockOnChainData(walletAddress) {
    // Create deterministic but varied data based on wallet address
    const seed = parseInt(walletAddress.slice(-8), 16);
    const random = (seed * 9301 + 49297) % 233280;
    const factor = random / 233280;

    const txCount = Math.floor(factor * 500) + 10;
    const defiVolume = Math.floor(factor * 100000) + 1000;
    const protocolCount = Math.floor(factor * 10) + 1;
    const liquidityAmount = Math.floor(factor * 50000);
    const stakingCount = Math.floor(factor * 5);

    const protocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'Balancer', 'Sushiswap', 'Yearn', 'Maker', 'Synthetix', '1inch'];
    const selectedProtocols = protocols.slice(0, protocolCount);

    return {
      transactions: Array.from({ length: txCount }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now() - (i * 86400000), // One day apart
        value: Math.random() * 10,
        gasUsed: Math.floor(Math.random() * 100000) + 21000
      })),
      defiActivity: {
        totalVolume: defiVolume,
        protocolsUsed: selectedProtocols,
        liquidityProvided: liquidityAmount,
        stakingHistory: Array.from({ length: stakingCount }, (_, i) => ({
          protocol: selectedProtocols[i % selectedProtocols.length],
          amount: Math.random() * 1000,
          duration: Math.floor(Math.random() * 365) + 30,
          timestamp: Date.now() - (i * 86400000 * 30)
        })),
        borrowingHistory: []
      }
    };
  }

  /**
   * Calculate composite credit score (on-chain + off-chain)
   * @param {string} userId - User ID
   * @returns {Object} Composite score calculation
   */
  async calculateCompositeScore(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let onChainScore = 300; // Default
      let offChainScore = null;

      // Calculate aggregated on-chain score from all wallets
      if (user.wallets.length > 0) {
        let totalScore = 0;
        let validWallets = 0;

        for (const wallet of user.wallets) {
          const score = await this.calculateOnChainScore(wallet.address);
          if (score.success) {
            totalScore += score.score;
            validWallets++;
          }
        }

        if (validWallets > 0) {
          onChainScore = Math.round(totalScore / validWallets);
        }
      }

      // Get off-chain score from credit profile
      offChainScore = user.creditProfile.offChainScore;

      let compositeScore;
      let weights;

      if (offChainScore) {
        // Both scores available - use weighted average
        weights = {
          onChain: 0.3,  // 30% weight for on-chain
          offChain: 0.7  // 70% weight for off-chain (traditional credit is more established)
        };
        compositeScore = Math.round(
          (onChainScore * weights.onChain) + (offChainScore * weights.offChain)
        );
      } else {
        // Only on-chain score available
        weights = {
          onChain: 1.0,
          offChain: 0.0
        };
        compositeScore = onChainScore;
      }

      // Update user's credit profile
      user.creditProfile.onChainScore = onChainScore;
      user.creditProfile.compositeScore = compositeScore;
      user.creditProfile.lastUpdated = new Date().toISOString();

      return {
        success: true,
        scores: {
          onChain: onChainScore,
          offChain: offChainScore,
          composite: compositeScore
        },
        weights,
        breakdown: {
          walletsAnalyzed: user.wallets.length,
          hasOffChainData: !!offChainScore
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error calculating composite score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user's off-chain credit score from FDC attestation
   * @param {string} userId - User ID
   * @param {number} offChainScore - Off-chain credit score
   * @param {Object} attestationData - FDC attestation data
   * @returns {Object} Update result
   */
  async updateOffChainScore(userId, offChainScore, attestationData) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update off-chain score
      user.creditProfile.offChainScore = offChainScore;
      user.creditProfile.attestationData = attestationData;

      // Recalculate composite score
      const compositeResult = await this.calculateCompositeScore(userId);

      return {
        success: true,
        offChainScore,
        compositeScore: compositeResult.success ? compositeResult.scores.composite : null,
        message: 'Off-chain score updated successfully'
      };
    } catch (error) {
      console.error('Error updating off-chain score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user profile with all scores
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  async getUserProfile(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate latest composite score
      const compositeResult = await this.calculateCompositeScore(userId);

      return {
        success: true,
        profile: {
          ...this.sanitizeUser(user),
          creditProfile: {
            ...user.creditProfile,
            ...compositeResult.scores
          },
          wallets: user.wallets.map(wallet => ({
            address: wallet.address,
            isGenerated: wallet.isGenerated,
            createdAt: wallet.createdAt,
            onChainScore: wallet.initialOnChainScore
          }))
        }
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  generateJWT(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      config.jwt.secret,
      { expiresIn: '24h' }
    );
  }

  verifyJWT(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  validateSSN(ssn) {
    // Basic SSN validation (XXX-XX-XXXX format)
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    return ssnRegex.test(ssn);
  }

  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  findUserBySSN(ssn) {
    for (const user of this.users.values()) {
      if (user.ssn === ssn) {
        return user;
      }
    }
    return null;
  }

  findUserByWallet(walletAddress) {
    const userId = this.walletMappings.get(walletAddress);
    return userId ? this.users.get(userId) : null;
  }

  // Middleware for JWT authentication
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = this.verifyJWT(token);
    if (!decoded) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    req.userId = decoded.userId;
    next();
  }

  /**
   * Reset all user data for demo purposes
   */
  resetAllData() {
    console.log('🧹 Resetting all authentication data...');
    
    const userCount = this.users.size;
    const walletCount = this.walletMappings.size;
    const sessionCount = this.userSessions.size;
    
    this.users.clear();
    this.walletMappings.clear();
    this.userSessions.clear();
    this.ssnVerifications.clear();
    
    console.log(`✅ Cleared ${userCount} users, ${walletCount} wallet mappings, ${sessionCount} sessions`);
    
    return {
      success: true,
      message: 'All authentication data has been reset',
      cleared: {
        users: userCount,
        walletMappings: walletCount,
        sessions: sessionCount
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get authentication statistics
   */
  getAuthStats() {
    return {
      totalUsers: this.users.size,
      totalWalletMappings: this.walletMappings.size,
      activeSessions: this.userSessions.size,
      ssnVerifications: this.ssnVerifications.size
    };
  }
}

module.exports = new UserAuthService();

