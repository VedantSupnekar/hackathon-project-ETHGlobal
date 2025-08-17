/**
 * Demo Wallet Service for Hackathon Presentation
 * Handles linking demo wallets with different credit profiles
 */

const fs = require('fs');
const path = require('path');

class DemoWalletService {
  constructor() {
    this.demoWallets = {};
    this.loadDemoWallets();
  }

  loadDemoWallets() {
    try {
      const walletsPath = path.join(__dirname, '../config/testWallets.json');
      if (fs.existsSync(walletsPath)) {
        const walletData = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
        this.demoWallets = {};
        
        // Index by address for quick lookup
        walletData.testWallets.forEach(wallet => {
          this.demoWallets[wallet.address.toLowerCase()] = wallet;
        });
        
        console.log('✅ Loaded demo wallets for hackathon');
        console.log(`   Available wallets: ${Object.keys(this.demoWallets).length}`);
      }
    } catch (error) {
      console.log('⚠️  Demo wallets not found');
    }
  }

  /**
   * Get demo wallet by address
   */
  getDemoWallet(address) {
    return this.demoWallets[address.toLowerCase()];
  }

  /**
   * Get all demo wallets
   */
  getAllDemoWallets() {
    return Object.values(this.demoWallets);
  }

  /**
   * Check if address is a demo wallet
   */
  isDemoWallet(address) {
    return !!this.demoWallets[address.toLowerCase()];
  }

  /**
   * Get demo wallet credit data for FDC integration
   */
  getDemoWalletCreditData(address) {
    const wallet = this.getDemoWallet(address);
    if (!wallet) return null;

    return {
      success: true,
      creditData: wallet.creditData,
      profile: wallet.profile,
      name: wallet.name,
      description: wallet.description,
      isDemoWallet: true,
      walletAddress: address
    };
  }

  /**
   * Get SSN mapping for demo wallet (for Experian mock)
   */
  getDemoWalletSSN(address) {
    const wallet = this.getDemoWallet(address);
    if (!wallet) return null;

    // Generate consistent SSN based on wallet ID
    const id = wallet.id.toString();
    return `${id}${id}${id}-${id}${id}-${id}${id}${id}${id}`;
  }

  /**
   * Simulate on-chain score based on demo wallet profile
   */
  calculateDemoOnChainScore(address) {
    const wallet = this.getDemoWallet(address);
    if (!wallet) return 300; // Base score

    // Simulate on-chain scoring based on profile
    const profileScores = {
      'EXCELLENT': 650,
      'PREMIUM': 700,
      'GOOD': 600,
      'BUSINESS': 580,
      'STUDENT': 520,
      'FAIR': 480,
      'RECOVERING': 450,
      'POOR': 400,
      'BAD': 350,
      'NO_CREDIT': 300
    };

    const baseScore = profileScores[wallet.profile] || 300;
    
    // Add some randomness to make it look more realistic
    const variation = Math.floor(Math.random() * 50) - 25; // +/- 25 points
    return Math.max(300, Math.min(850, baseScore + variation));
  }

  /**
   * Get demo wallet for MetaMask import instructions
   */
  getWalletImportData() {
    const wallets = this.getAllDemoWallets();
    return wallets.map(wallet => ({
      name: wallet.name,
      address: wallet.address,
      privateKey: wallet.privateKey,
      creditScore: wallet.creditData.creditScore,
      profile: wallet.profile,
      description: wallet.description
    }));
  }
}

module.exports = new DemoWalletService();
