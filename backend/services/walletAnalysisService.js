/**
 * Wallet Analysis Service
 * Analyzes real wallet data to calculate on-chain credit scores
 */

const { ethers } = require('ethers');
const demoWalletService = require('./demoWalletService');

class WalletAnalysisService {
  constructor() {
    // Connect to Hardhat local network
    this.provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    this.isConnected = false;
    this.initializeProvider();
  }

  async initializeProvider() {
    try {
      const network = await this.provider.getNetwork();
      console.log(`🔗 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      if (network.chainId === 31337 || network.chainId === 1337) {
        this.isConnected = true;
        console.log('✅ Local blockchain detected - real wallet analysis enabled');
      } else {
        this.isConnected = false;
        console.log('⚠️  Non-local network, using simulated analysis');
      }
    } catch (error) {
      console.log('⚠️  Local blockchain not available, using simulated analysis');
      this.isConnected = false;
    }
  }

  /**
   * Calculate comprehensive on-chain credit score for a wallet
   */
  async calculateWalletCreditScore(walletAddress) {
    try {
      console.log(`🔍 Analyzing wallet: ${walletAddress}`);

      // Check if this is a demo wallet first
      if (demoWalletService.isDemoWallet(walletAddress)) {
        const demoScore = demoWalletService.calculateDemoOnChainScore(walletAddress);
        console.log(`🎭 Demo wallet detected - using predefined score: ${demoScore}`);
        return {
          success: true,
          score: demoScore,
          breakdown: {
            baseScore: 300,
            balanceScore: Math.floor((demoScore - 300) * 0.3),
            transactionScore: Math.floor((demoScore - 300) * 0.4),
            ageScore: Math.floor((demoScore - 300) * 0.2),
            activityScore: Math.floor((demoScore - 300) * 0.1),
            totalScore: demoScore,
            isDemoWallet: true,
            analysis: `Demo wallet with ${demoWalletService.getDemoWallet(walletAddress)?.profile} credit profile`
          }
        };
      }

      // Analyze real wallet if connected to Hardhat
      if (this.isConnected) {
        return await this.analyzeRealWallet(walletAddress);
      } else {
        return await this.simulateWalletAnalysis(walletAddress);
      }
    } catch (error) {
      console.error('Error calculating wallet credit score:', error);
      return {
        success: false,
        error: error.message,
        score: 300 // Default base score
      };
    }
  }

  /**
   * Analyze real wallet data from Hardhat network
   */
  async analyzeRealWallet(walletAddress) {
    try {
      // Get current balance
      const balance = await this.provider.getBalance(walletAddress);
      const balanceInEth = parseFloat(ethers.utils.formatEther(balance));

      // Get transaction count (nonce)
      const transactionCount = await this.provider.getTransactionCount(walletAddress);

      // Get recent transaction history (limited by RPC)
      const recentTransactions = await this.getRecentTransactions(walletAddress);

      // Calculate score components
      const balanceScore = this.calculateBalanceScore(balanceInEth);
      const transactionScore = this.calculateTransactionScore(transactionCount, recentTransactions);
      const activityScore = this.calculateActivityScore(recentTransactions);
      const riskScore = this.calculateRiskScore(recentTransactions);

      // Base score
      const baseScore = 300;

      // Calculate final score
      const totalScore = Math.min(850, Math.max(300, 
        baseScore + balanceScore + transactionScore + activityScore - riskScore
      ));

      console.log(`📊 Real wallet analysis complete:`);
      console.log(`   Address: ${walletAddress}`);
      console.log(`   Balance: ${balanceInEth.toFixed(4)} ETH`);
      console.log(`   Transactions: ${transactionCount}`);
      console.log(`   Final Score: ${Math.round(totalScore)}`);

      return {
        success: true,
        score: Math.round(totalScore),
        breakdown: {
          baseScore,
          balanceScore: Math.round(balanceScore),
          transactionScore: Math.round(transactionScore),
          activityScore: Math.round(activityScore),
          riskScore: Math.round(riskScore),
          totalScore: Math.round(totalScore),
          walletData: {
            balance: balanceInEth,
            transactionCount,
            recentTransactions: recentTransactions.length
          },
          analysis: `Real wallet analysis: ${balanceInEth.toFixed(4)} ETH, ${transactionCount} transactions`
        }
      };
    } catch (error) {
      console.error('Error analyzing real wallet:', error);
      return await this.simulateWalletAnalysis(walletAddress);
    }
  }

  /**
   * Get recent transactions for a wallet (limited by what Hardhat provides)
   */
  async getRecentTransactions(walletAddress) {
    try {
      // Note: Hardhat has limited transaction history capabilities
      // In production, you'd use services like Etherscan API, Alchemy, etc.
      const transactions = [];
      
      // Try to get the latest block and scan backwards
      const latestBlock = await this.provider.getBlockNumber();
      const scanBlocks = Math.min(100, latestBlock); // Scan last 100 blocks

      for (let i = 0; i < scanBlocks; i++) {
        try {
          const blockNumber = latestBlock - i;
          const block = await this.provider.getBlockWithTransactions(blockNumber);
          
          for (const tx of block.transactions) {
            if (tx.from?.toLowerCase() === walletAddress.toLowerCase() ||
                tx.to?.toLowerCase() === walletAddress.toLowerCase()) {
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.utils.formatEther(tx.value || '0'),
                blockNumber: tx.blockNumber,
                timestamp: block.timestamp
              });
            }
          }
        } catch (blockError) {
          // Skip blocks that can't be fetched
          continue;
        }
      }

      return transactions.slice(0, 50); // Return up to 50 recent transactions
    } catch (error) {
      console.log('⚠️  Could not fetch transaction history, using transaction count only');
      return [];
    }
  }

  /**
   * Calculate score based on wallet balance
   */
  calculateBalanceScore(balanceInEth) {
    if (balanceInEth >= 100) return 150; // Very high balance
    if (balanceInEth >= 10) return 100;  // High balance
    if (balanceInEth >= 1) return 75;    // Good balance
    if (balanceInEth >= 0.1) return 50;  // Moderate balance
    if (balanceInEth >= 0.01) return 25; // Low balance
    return 0; // Very low balance
  }

  /**
   * Calculate score based on transaction history
   */
  calculateTransactionScore(transactionCount, recentTransactions) {
    let score = 0;

    // Transaction count score
    if (transactionCount >= 1000) score += 100;
    else if (transactionCount >= 100) score += 80;
    else if (transactionCount >= 50) score += 60;
    else if (transactionCount >= 10) score += 40;
    else if (transactionCount >= 1) score += 20;

    // Transaction variety score (if we have transaction data)
    if (recentTransactions.length > 0) {
      const uniqueAddresses = new Set();
      recentTransactions.forEach(tx => {
        uniqueAddresses.add(tx.from);
        uniqueAddresses.add(tx.to);
      });
      
      if (uniqueAddresses.size >= 10) score += 25;
      else if (uniqueAddresses.size >= 5) score += 15;
      else if (uniqueAddresses.size >= 2) score += 10;
    }

    return score;
  }

  /**
   * Calculate score based on wallet activity patterns
   */
  calculateActivityScore(recentTransactions) {
    if (recentTransactions.length === 0) return 0;

    let score = 0;
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    // Recent activity score
    const recentTxs = recentTransactions.filter(tx => tx.timestamp > thirtyDaysAgo);
    if (recentTxs.length >= 10) score += 30;
    else if (recentTxs.length >= 5) score += 20;
    else if (recentTxs.length >= 1) score += 10;

    // Consistent activity score
    if (recentTransactions.length >= 5) {
      const timeSpread = recentTransactions[0].timestamp - recentTransactions[recentTransactions.length - 1].timestamp;
      if (timeSpread > (7 * 24 * 60 * 60)) score += 20; // Activity over a week
    }

    return score;
  }

  /**
   * Calculate risk factors that reduce the score
   */
  calculateRiskScore(recentTransactions) {
    let riskScore = 0;

    if (recentTransactions.length === 0) return 0;

    // Check for suspicious patterns
    const values = recentTransactions.map(tx => parseFloat(tx.value));
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

    // High-value transactions might indicate higher risk
    const highValueTxs = values.filter(v => v > avgValue * 10);
    if (highValueTxs.length > recentTransactions.length * 0.5) {
      riskScore += 20; // Many high-value transactions
    }

    // Very low activity might indicate inactive wallet
    if (recentTransactions.length < 3) {
      riskScore += 10;
    }

    return riskScore;
  }

  /**
   * Simulate wallet analysis when Hardhat is not available
   */
  async simulateWalletAnalysis(walletAddress) {
    // Create deterministic but varied scores based on wallet address
    const addressBytes = ethers.utils.arrayify(ethers.utils.keccak256(walletAddress));
    
    let score = 300; // Base score
    
    // Simulate different scoring factors
    const balanceScore = (addressBytes[0] % 100) + 20; // 20-120 points
    const transactionScore = (addressBytes[1] % 80) + 30; // 30-110 points
    const ageScore = (addressBytes[2] % 60) + 10; // 10-70 points
    const activityScore = (addressBytes[3] % 40) + 5; // 5-45 points
    const riskPenalty = addressBytes[4] % 30; // 0-30 penalty
    
    score += balanceScore + transactionScore + ageScore + activityScore - riskPenalty;
    score = Math.max(300, Math.min(850, Math.round(score)));

    console.log(`🎲 Simulated wallet analysis:`);
    console.log(`   Address: ${walletAddress}`);
    console.log(`   Simulated Score: ${score}`);

    return {
      success: true,
      score,
      breakdown: {
        baseScore: 300,
        balanceScore,
        transactionScore,
        ageScore,
        activityScore,
        riskPenalty,
        totalScore: score,
        isSimulated: true,
        analysis: `Simulated analysis (Hardhat not available)`
      }
    };
  }

  /**
   * Analyze multiple wallets for portfolio scoring
   */
  async analyzeWalletPortfolio(walletAddresses) {
    console.log(`📊 Analyzing portfolio of ${walletAddresses.length} wallets`);
    
    const walletAnalyses = [];
    let totalScore = 0;
    
    for (const address of walletAddresses) {
      const analysis = await this.calculateWalletCreditScore(address);
      if (analysis.success) {
        walletAnalyses.push({
          address,
          score: analysis.score,
          breakdown: analysis.breakdown
        });
        totalScore += analysis.score;
      }
    }

    const averageScore = walletAnalyses.length > 0 ? Math.round(totalScore / walletAnalyses.length) : 300;

    console.log(`📈 Portfolio analysis complete:`);
    console.log(`   Wallets analyzed: ${walletAnalyses.length}`);
    console.log(`   Average score: ${averageScore}`);
    console.log(`   Individual scores: ${walletAnalyses.map(w => w.score).join(', ')}`);

    return {
      success: true,
      portfolioScore: averageScore,
      walletCount: walletAnalyses.length,
      wallets: walletAnalyses,
      analysis: `Portfolio of ${walletAnalyses.length} wallets with average score ${averageScore}`
    };
  }
}

module.exports = new WalletAnalysisService();
