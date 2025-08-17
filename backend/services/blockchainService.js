/**
 * Blockchain Service for On-Chain User Data Storage
 * Interacts with UserCreditRegistry smart contract
 */

const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    // Connect to local Ganache/Hardhat network
    this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    this.isConnected = false;
    this.contract = null;
    this.signer = null;
    
    // Contract details (will be set after deployment)
    this.contractAddress = null;
    this.contractABI = [
      // User Management
      "function registerUser(bytes32 web3Id, string email, string firstName, string lastName) external",
      "function getUserProfile(bytes32 web3Id) external view returns (tuple(bytes32 web3Id, string email, string firstName, string lastName, uint256 onChainScore, uint256 offChainScore, uint256 compositeScore, uint256 createdAt, uint256 lastUpdated, bool isActive, address[] linkedWallets, string fdcAttestationId))",
      "function getUserByEmail(string email) external view returns (tuple(bytes32 web3Id, string email, string firstName, string lastName, uint256 onChainScore, uint256 offChainScore, uint256 compositeScore, uint256 createdAt, uint256 lastUpdated, bool isActive, address[] linkedWallets, string fdcAttestationId))",
      
      // Wallet Management
      "function linkWallet(bytes32 web3Id, address wallet) external",
      "function unlinkWallet(bytes32 web3Id, address wallet) external",
      "function isWalletLinked(address wallet) external view returns (bool)",
      "function getWalletInfo(address wallet) external view returns (tuple(bytes32 ownerWeb3Id, uint256 onChainScore, uint256 linkedAt, bool isActive))",
      "function getUserWallets(bytes32 web3Id) external view returns (address[])",
      
      // Score Management
      "function updateOnChainScore(bytes32 web3Id, uint256 newScore) external",
      "function updateOffChainScore(bytes32 web3Id, uint256 newScore, string attestationId) external",
      "function updateCompositeScore(bytes32 web3Id, uint256 newScore) external",
      
      // Admin Functions
      "function addAuthorizedUpdater(address updater) external",
      "function removeAuthorizedUpdater(address updater) external",
      "function getTotalUsers() external view returns (uint256)",
      "function getContractStats() external view returns (uint256 totalUsers, uint256 totalLinkedWallets, uint256 usersWithScores)",
      
      // Events
      "event UserRegistered(bytes32 indexed web3Id, uint256 indexed userId, string email)",
      "event WalletLinked(bytes32 indexed web3Id, address indexed wallet, uint256 timestamp)",
      "event WalletUnlinked(bytes32 indexed web3Id, address indexed wallet, uint256 timestamp)",
      "event OnChainScoreUpdated(bytes32 indexed web3Id, uint256 newScore, uint256 timestamp)",
      "event OffChainScoreUpdated(bytes32 indexed web3Id, uint256 newScore, string attestationId, uint256 timestamp)",
      "event CompositeScoreUpdated(bytes32 indexed web3Id, uint256 newScore, uint256 timestamp)"
    ];
    
    this.initializeService();
  }
  
  async initializeService() {
    try {
      const network = await this.provider.getNetwork();
      console.log(`🔗 Blockchain Service connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      if (network.chainId === 31337 || network.chainId === 1337) {
        this.isConnected = true;
        
        // Use first account as the service account
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.signer = await this.provider.getSigner();
          console.log(`📝 Using service account: ${accounts[0]}`);
          
          // In a real deployment, you'd load the contract address from config
          // For now, we'll deploy it dynamically or use a known address
          console.log('⚠️  Contract deployment needed - use deployContract() method');
        }
      } else {
        console.log('⚠️  Not connected to local network - blockchain features disabled');
      }
    } catch (error) {
      console.log('⚠️  Blockchain not available - using fallback storage');
      this.isConnected = false;
    }
  }
  
  /**
   * Deploy the UserCreditRegistry contract
   */
  async deployContract() {
    if (!this.isConnected || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }
    
    try {
      // Note: In a real deployment, you'd compile the contract first
      // For now, this is a placeholder for the deployment process
      console.log('🚀 Deploying UserCreditRegistry contract...');
      
      // This would be replaced with actual contract deployment
      // const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
      // const contract = await factory.deploy();
      // await contract.deployed();
      
      // For demo, we'll simulate a deployed contract
      // You would need to actually compile and deploy the Solidity contract
      console.log('⚠️  Contract deployment simulation - implement actual deployment');
      
      return {
        success: false,
        message: 'Contract deployment not implemented - use Hardhat for deployment'
      };
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw error;
    }
  }
  
  /**
   * Set contract address after deployment
   */
  setContractAddress(address) {
    this.contractAddress = address;
    if (this.isConnected && this.signer) {
      this.contract = new ethers.Contract(address, this.contractABI, this.signer);
      console.log(`📄 Contract connected at: ${address}`);
    }
  }
  
  /**
   * Register a new user on-chain
   */
  async registerUser(web3Id, email, firstName, lastName) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const tx = await this.contract.registerUser(web3IdBytes, email, firstName, lastName);
      const receipt = await tx.wait();
      
      console.log(`✅ User registered on-chain: ${email} (Web3 ID: ${web3Id})`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        web3IdBytes,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('On-chain user registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Link a wallet to a user on-chain
   */
  async linkWallet(web3Id, walletAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const tx = await this.contract.linkWallet(web3IdBytes, walletAddress);
      const receipt = await tx.wait();
      
      console.log(`🔗 Wallet linked on-chain: ${walletAddress} → ${web3Id}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('On-chain wallet linking failed:', error);
      throw error;
    }
  }
  
  /**
   * Update on-chain score
   */
  async updateOnChainScore(web3Id, score) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const tx = await this.contract.updateOnChainScore(web3IdBytes, score);
      const receipt = await tx.wait();
      
      console.log(`📊 On-chain score updated: ${web3Id} → ${score}`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('On-chain score update failed:', error);
      throw error;
    }
  }
  
  /**
   * Update off-chain score with FDC attestation
   */
  async updateOffChainScore(web3Id, score, attestationId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const tx = await this.contract.updateOffChainScore(web3IdBytes, score, attestationId);
      const receipt = await tx.wait();
      
      console.log(`📊 Off-chain score updated: ${web3Id} → ${score} (FDC: ${attestationId})`);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('On-chain off-chain score update failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if wallet is already linked
   */
  async isWalletLinked(walletAddress) {
    if (!this.contract) {
      return false; // Fallback to false if contract not available
    }
    
    try {
      return await this.contract.isWalletLinked(walletAddress);
    } catch (error) {
      console.error('Error checking wallet link status:', error);
      return false;
    }
  }
  
  /**
   * Get user profile from blockchain
   */
  async getUserProfile(web3Id) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const profile = await this.contract.getUserProfile(web3IdBytes);
      
      return {
        web3Id: profile.web3Id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        onChainScore: profile.onChainScore.toNumber(),
        offChainScore: profile.offChainScore.toNumber(),
        compositeScore: profile.compositeScore.toNumber(),
        createdAt: profile.createdAt.toNumber(),
        lastUpdated: profile.lastUpdated.toNumber(),
        isActive: profile.isActive,
        linkedWallets: profile.linkedWallets,
        fdcAttestationId: profile.fdcAttestationId
      };
    } catch (error) {
      console.error('Error getting user profile from blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Get contract statistics
   */
  async getContractStats() {
    if (!this.contract) {
      return { totalUsers: 0, totalLinkedWallets: 0, usersWithScores: 0 };
    }
    
    try {
      const stats = await this.contract.getContractStats();
      return {
        totalUsers: stats.totalUsers.toNumber(),
        totalLinkedWallets: stats.totalLinkedWallets.toNumber(),
        usersWithScores: stats.usersWithScores.toNumber()
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      return { totalUsers: 0, totalLinkedWallets: 0, usersWithScores: 0 };
    }
  }
  
  /**
   * Check if blockchain service is available
   */
  isAvailable() {
    return this.isConnected && this.contract !== null;
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      contractDeployed: this.contract !== null,
      contractAddress: this.contractAddress,
      signerAddress: this.signer ? this.signer.address : null
    };
  }
}

module.exports = new BlockchainService();
