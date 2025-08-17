/**
 * Hybrid Storage Service
 * Uses blockchain storage when available, falls back to in-memory storage
 */

const blockchainService = require('./blockchainService');
const userPortfolioService = require('./userPortfolioService');

class HybridStorageService {
  constructor() {
    this.useBlockchain = false;
    this.initializeService();
  }
  
  async initializeService() {
    // Check if blockchain service is available
    setTimeout(() => {
      this.useBlockchain = blockchainService.isAvailable();
      console.log(`💾 Storage Service initialized: ${this.useBlockchain ? 'BLOCKCHAIN' : 'IN-MEMORY'}`);
      
      if (!this.useBlockchain) {
        console.log('⚠️  Blockchain not available - using in-memory storage for demo');
        console.log('🔧 To enable blockchain storage:');
        console.log('   1. Deploy UserCreditRegistry contract');
        console.log('   2. Set contract address in blockchainService');
        console.log('   3. Restart the service');
      }
    }, 2000);
  }
  
  /**
   * Register a new user
   */
  async registerUser(userData) {
    try {
      if (this.useBlockchain) {
        console.log('🔗 Registering user on blockchain...');
        const blockchainResult = await blockchainService.registerUser(
          userData.web3Id,
          userData.email,
          userData.firstName,
          userData.lastName
        );
        
        return {
          success: true,
          storage: 'blockchain',
          transactionHash: blockchainResult.transactionHash,
          ...userData
        };
      } else {
        console.log('💾 Registering user in memory...');
        const result = userPortfolioService.createUser(
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.password
        );
        
        return {
          success: true,
          storage: 'memory',
          ...result
        };
      }
    } catch (error) {
      console.error('User registration failed:', error);
      
      // Fallback to in-memory if blockchain fails
      if (this.useBlockchain) {
        console.log('⚠️  Blockchain registration failed, falling back to memory...');
        try {
          const result = userPortfolioService.createUser(
            userData.email,
            userData.firstName,
            userData.lastName,
            userData.password
          );
          
          return {
            success: true,
            storage: 'memory-fallback',
            warning: 'Blockchain unavailable, using temporary storage',
            ...result
          };
        } catch (fallbackError) {
          throw new Error(`Both blockchain and fallback registration failed: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Link a wallet to a user
   */
  async linkWallet(web3Id, walletAddress, signature) {
    try {
      if (this.useBlockchain) {
        console.log('🔗 Linking wallet on blockchain...');
        
        // First check if wallet is already linked on-chain
        const isLinked = await blockchainService.isWalletLinked(walletAddress);
        if (isLinked) {
          throw new Error('Wallet already linked to another user');
        }
        
        const blockchainResult = await blockchainService.linkWallet(web3Id, walletAddress);
        
        return {
          success: true,
          storage: 'blockchain',
          transactionHash: blockchainResult.transactionHash,
          walletAddress,
          web3Id
        };
      } else {
        console.log('💾 Linking wallet in memory...');
        
        // Find user by web3Id in memory storage
        const users = Array.from(userPortfolioService.userProfiles.values());
        const user = users.find(u => u.web3Id === web3Id);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const result = await userPortfolioService.linkWallet(user.userId, walletAddress, signature);
        
        return {
          success: true,
          storage: 'memory',
          ...result
        };
      }
    } catch (error) {
      console.error('Wallet linking failed:', error);
      
      // Fallback logic similar to registration
      if (this.useBlockchain && error.message.includes('Contract not initialized')) {
        console.log('⚠️  Blockchain wallet linking failed, falling back to memory...');
        try {
          const users = Array.from(userPortfolioService.userProfiles.values());
          const user = users.find(u => u.web3Id === web3Id);
          
          if (!user) {
            throw new Error('User not found');
          }
          
          const result = await userPortfolioService.linkWallet(user.userId, walletAddress, signature);
          
          return {
            success: true,
            storage: 'memory-fallback',
            warning: 'Blockchain unavailable, using temporary storage',
            ...result
          };
        } catch (fallbackError) {
          throw new Error(`Both blockchain and fallback wallet linking failed: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Update off-chain score
   */
  async updateOffChainScore(web3Id, score, attestationId) {
    try {
      if (this.useBlockchain) {
        console.log('🔗 Updating off-chain score on blockchain...');
        const blockchainResult = await blockchainService.updateOffChainScore(web3Id, score, attestationId);
        
        return {
          success: true,
          storage: 'blockchain',
          transactionHash: blockchainResult.transactionHash,
          score,
          attestationId
        };
      } else {
        console.log('💾 Updating off-chain score in memory...');
        
        // Find user by web3Id in memory storage
        const users = Array.from(userPortfolioService.userProfiles.values());
        const user = users.find(u => u.web3Id === web3Id);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const result = await userPortfolioService.setOffChainScore(user.userId, score, attestationId);
        
        return {
          success: true,
          storage: 'memory',
          ...result
        };
      }
    } catch (error) {
      console.error('Off-chain score update failed:', error);
      
      // Fallback logic
      if (this.useBlockchain && error.message.includes('Contract not initialized')) {
        console.log('⚠️  Blockchain score update failed, falling back to memory...');
        try {
          const users = Array.from(userPortfolioService.userProfiles.values());
          const user = users.find(u => u.web3Id === web3Id);
          
          if (!user) {
            throw new Error('User not found');
          }
          
          const result = await userPortfolioService.setOffChainScore(user.userId, score, attestationId);
          
          return {
            success: true,
            storage: 'memory-fallback',
            warning: 'Blockchain unavailable, using temporary storage',
            ...result
          };
        } catch (fallbackError) {
          throw new Error(`Both blockchain and fallback score update failed: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Check if wallet is linked
   */
  async isWalletLinked(walletAddress) {
    try {
      if (this.useBlockchain) {
        return await blockchainService.isWalletLinked(walletAddress);
      } else {
        return userPortfolioService.walletToUser.has(walletAddress.toLowerCase());
      }
    } catch (error) {
      console.error('Error checking wallet link status:', error);
      // Fallback to in-memory check
      return userPortfolioService.walletToUser.has(walletAddress.toLowerCase());
    }
  }
  
  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      if (this.useBlockchain) {
        const stats = await blockchainService.getContractStats();
        return {
          storage: 'blockchain',
          ...stats,
          contractAddress: blockchainService.contractAddress
        };
      } else {
        const stats = userPortfolioService.getSystemStats();
        return {
          storage: 'memory',
          ...stats
        };
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        storage: 'error',
        totalUsers: 0,
        totalLinkedWallets: 0,
        usersWithScores: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Reset all data (for demo purposes)
   */
  async resetAllData() {
    if (this.useBlockchain) {
      console.log('⚠️  Cannot reset blockchain data - this is permanent storage');
      console.log('🔧 For demo reset, switch to in-memory storage or deploy new contract');
      
      return {
        success: false,
        message: 'Cannot reset blockchain data - permanent storage',
        suggestion: 'Deploy new contract or use in-memory storage for demo'
      };
    } else {
      console.log('🧹 Resetting in-memory data...');
      return userPortfolioService.resetAllData();
    }
  }
  
  /**
   * Get service status
   */
  getServiceStatus() {
    const blockchainStatus = blockchainService.getStatus();
    
    return {
      storageType: this.useBlockchain ? 'blockchain' : 'in-memory',
      blockchain: blockchainStatus,
      recommendations: this.useBlockchain ? 
        ['Data is permanently stored on blockchain', 'High security and transparency'] :
        ['Deploy smart contract for permanent storage', 'Current data is temporary', 'Use demo reset for testing']
    };
  }
}

module.exports = new HybridStorageService();
