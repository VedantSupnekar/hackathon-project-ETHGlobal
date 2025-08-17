/**
 * Decentralized Storage Service
 * Replaces API-based data storage with IPFS + Smart Contract
 */

const ipfsService = require('./simpleIpfsService');
const { ethers } = require('ethers');

class DecentralizedStorageService {
  constructor() {
    // Connect to local blockchain
    this.provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    this.contract = null;
    this.signer = null;
    this.isReady = false;
    
    // IPFS-based smart contract ABI (simplified)
    this.contractABI = [
      "function registerUser(bytes32 web3Id, string profileIpfsHash) external",
      "function updateCreditScores(bytes32 web3Id, string scoresIpfsHash, uint256 compositeScore) external",
      "function linkWallet(bytes32 web3Id, address wallet, string linkDataHash) external",
      "function updateCompleteUserData(bytes32 web3Id, string completeDataHash, string walletsIpfsHash) external",
      "function getUserRecord(bytes32 web3Id) external view returns (tuple(bytes32 web3Id, string profileIpfsHash, string scoresIpfsHash, string walletsIpfsHash, string completeDataHash, uint256 createdAt, uint256 lastUpdated, bool isActive, uint256 totalWallets, uint256 currentScore))",
      "function isWalletLinked(address wallet) external view returns (bool)",
      "function getLatestUserHashes(bytes32 web3Id) external view returns (string profileHash, string scoresHash, string walletsHash, string completeHash)",
      "function getUserDataHistory(bytes32 web3Id) external view returns (string[] memory)",
      "event UserRegistered(bytes32 indexed web3Id, uint256 indexed userId, string ipfsHash)",
      "event CreditScoreUpdated(bytes32 indexed web3Id, string ipfsHash, uint256 timestamp)",
      "event WalletLinked(bytes32 indexed web3Id, address indexed wallet, string ipfsHash)"
    ];
    
    this.initializeService();
  }
  
  async initializeService() {
    try {
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.signer = await this.provider.getSigner();
        console.log('🔗 Decentralized Storage Service initialized');
        
        // Note: In production, you'd deploy the contract and set the address
        console.log('⚠️  Deploy IPFSCreditRegistry contract to enable full decentralization');
      }
    } catch (error) {
      console.log('⚠️  Blockchain not available - IPFS-only mode');
    }
  }
  
  /**
   * Set contract address after deployment
   */
  setContractAddress(address) {
    if (this.signer) {
      this.contract = new ethers.Contract(address, this.contractABI, this.signer);
      this.isReady = true;
      console.log(`📄 IPFS Registry Contract connected: ${address}`);
    }
  }
  
  /**
   * Register user with decentralized storage
   */
  async registerUser(userData) {
    try {
      console.log('🌐 Registering user with decentralized storage...');
      
      // 1. Store user profile on IPFS
      const profileResult = await ipfsService.storeUserProfile(userData);
      
      if (!profileResult.success) {
        throw new Error('Failed to store user profile on IPFS');
      }
      
      // 2. Store on blockchain if available
      if (this.isReady && this.contract) {
        const web3IdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userData.web3Id));
        const tx = await this.contract.registerUser(web3IdBytes, profileResult.ipfsHash);
        const receipt = await tx.wait();
        
        console.log(`✅ User registered on blockchain: ${receipt.transactionHash}`);
        
        return {
          success: true,
          storage: 'ipfs+blockchain',
          ipfsHash: profileResult.ipfsHash,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gatewayUrl: profileResult.gateway,
          userData
        };
      } else {
        // IPFS-only mode
        return {
          success: true,
          storage: 'ipfs-only',
          ipfsHash: profileResult.ipfsHash,
          gatewayUrl: profileResult.gateway,
          userData,
          note: 'Deploy smart contract for full blockchain integration'
        };
      }
      
    } catch (error) {
      console.error('Decentralized registration failed:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
  
  /**
   * Store credit scores on IPFS + blockchain
   */
  async storeCreditScores(scoreData) {
    try {
      console.log('🌐 Storing credit scores with decentralized storage...');
      
      // 1. Store scores on IPFS
      const scoresResult = await ipfsService.storeCreditScores(scoreData);
      
      if (!scoresResult.success) {
        throw new Error('Failed to store credit scores on IPFS');
      }
      
      // 2. Update blockchain if available
      if (this.isReady && this.contract) {
        const web3IdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(scoreData.web3Id));
        const tx = await this.contract.updateCreditScores(
          web3IdBytes, 
          scoresResult.ipfsHash, 
          scoreData.compositeScore
        );
        const receipt = await tx.wait();
        
        console.log(`✅ Credit scores updated on blockchain: ${receipt.transactionHash}`);
        
        return {
          success: true,
          storage: 'ipfs+blockchain',
          ipfsHash: scoresResult.ipfsHash,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gatewayUrl: scoresResult.gateway,
          scoreData
        };
      } else {
        return {
          success: true,
          storage: 'ipfs-only',
          ipfsHash: scoresResult.ipfsHash,
          gatewayUrl: scoresResult.gateway,
          scoreData
        };
      }
      
    } catch (error) {
      console.error('Decentralized score storage failed:', error);
      throw new Error(`Score storage failed: ${error.message}`);
    }
  }
  
  /**
   * Link wallet with decentralized storage
   */
  async linkWallet(web3Id, walletAddress, linkData) {
    try {
      console.log('🌐 Linking wallet with decentralized storage...');
      
      // 1. Store wallet link data on IPFS
      const walletLinkData = {
        web3Id,
        walletAddress,
        linkType: 'external',
        signature: linkData.signature,
        timestamp: new Date().toISOString(),
        onChainScore: linkData.onChainScore || null
      };
      
      const linkResult = await ipfsService.storeWalletLink(walletLinkData);
      
      if (!linkResult.success) {
        throw new Error('Failed to store wallet link on IPFS');
      }
      
      // 2. Update blockchain if available
      if (this.isReady && this.contract) {
        const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
        const tx = await this.contract.linkWallet(
          web3IdBytes, 
          walletAddress, 
          linkResult.ipfsHash
        );
        const receipt = await tx.wait();
        
        console.log(`✅ Wallet linked on blockchain: ${receipt.transactionHash}`);
        
        return {
          success: true,
          storage: 'ipfs+blockchain',
          ipfsHash: linkResult.ipfsHash,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gatewayUrl: linkResult.gateway,
          walletAddress,
          web3Id
        };
      } else {
        return {
          success: true,
          storage: 'ipfs-only',
          ipfsHash: linkResult.ipfsHash,
          gatewayUrl: linkResult.gateway,
          walletAddress,
          web3Id
        };
      }
      
    } catch (error) {
      console.error('Decentralized wallet linking failed:', error);
      throw new Error(`Wallet linking failed: ${error.message}`);
    }
  }
  
  /**
   * Store complete user dataset
   */
  async storeCompleteUserData(userData) {
    try {
      console.log('🌐 Storing complete user dataset...');
      
      // Store comprehensive user data on IPFS
      const completeResult = await ipfsService.storeCompleteUserData(userData);
      
      if (!completeResult.success) {
        throw new Error('Failed to store complete user data on IPFS');
      }
      
      // Update blockchain if available
      if (this.isReady && this.contract) {
        const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(userData.profile.web3Id));
        const tx = await this.contract.updateCompleteUserData(
          web3IdBytes,
          completeResult.ipfsHash,
          '' // Wallets hash can be separate if needed
        );
        const receipt = await tx.wait();
        
        return {
          success: true,
          storage: 'ipfs+blockchain',
          ipfsHash: completeResult.ipfsHash,
          transactionHash: receipt.transactionHash,
          gatewayUrl: completeResult.gateway
        };
      } else {
        return {
          success: true,
          storage: 'ipfs-only',
          ipfsHash: completeResult.ipfsHash,
          gatewayUrl: completeResult.gateway
        };
      }
      
    } catch (error) {
      console.error('Complete user data storage failed:', error);
      throw new Error(`Complete data storage failed: ${error.message}`);
    }
  }
  
  /**
   * Retrieve user data from IPFS
   */
  async retrieveUserData(web3Id) {
    try {
      console.log('🌐 Retrieving user data from decentralized storage...');
      
      if (this.isReady && this.contract) {
        // Get IPFS hashes from blockchain
        const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
        const hashes = await this.contract.getLatestUserHashes(web3IdBytes);
        
        // Retrieve data from IPFS using the hashes
        const userData = {};
        
        if (hashes.profileHash) {
          const profileData = await ipfsService.retrieveData(hashes.profileHash);
          userData.profile = profileData.data;
        }
        
        if (hashes.scoresHash) {
          const scoresData = await ipfsService.retrieveData(hashes.scoresHash);
          userData.creditScores = scoresData.data;
        }
        
        if (hashes.completeHash) {
          const completeData = await ipfsService.retrieveData(hashes.completeHash);
          userData.completeData = completeData.data;
        }
        
        return {
          success: true,
          storage: 'ipfs+blockchain',
          data: userData,
          ipfsHashes: {
            profile: hashes.profileHash,
            scores: hashes.scoresHash,
            wallets: hashes.walletsHash,
            complete: hashes.completeHash
          }
        };
      } else {
        throw new Error('Blockchain not available for hash retrieval');
      }
      
    } catch (error) {
      console.error('Data retrieval failed:', error);
      throw new Error(`Data retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Check if wallet is linked (blockchain query)
   */
  async isWalletLinked(walletAddress) {
    if (this.isReady && this.contract) {
      return await this.contract.isWalletLinked(walletAddress);
    }
    return false;
  }
  
  /**
   * Get all IPFS hashes for a user (full data history)
   */
  async getUserDataHistory(web3Id) {
    if (this.isReady && this.contract) {
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const history = await this.contract.getUserDataHistory(web3IdBytes);
      
      return {
        success: true,
        web3Id,
        totalRecords: history.length,
        ipfsHashes: history,
        gatewayUrls: history.map(hash => `https://gateway.ipfs.io/ipfs/${hash}`)
      };
    }
    
    throw new Error('Blockchain not available for history retrieval');
  }
  
  /**
   * Verify data integrity across IPFS and blockchain
   */
  async verifyDataIntegrity(web3Id) {
    try {
      if (!this.isReady || !this.contract) {
        throw new Error('Blockchain not available for verification');
      }
      
      const web3IdBytes = ethers.keccak256(ethers.toUtf8Bytes(web3Id));
      const userRecord = await this.contract.getUserRecord(web3IdBytes);
      const hashes = await this.contract.getLatestUserHashes(web3IdBytes);
      
      const verification = {
        web3Id,
        blockchainRecord: {
          exists: userRecord.isActive,
          totalWallets: userRecord.totalWallets.toString(),
          currentScore: userRecord.currentScore.toString(),
          lastUpdated: new Date(userRecord.lastUpdated.toNumber() * 1000).toISOString()
        },
        ipfsHashes: {
          profile: hashes.profileHash,
          scores: hashes.scoresHash,
          wallets: hashes.walletsHash,
          complete: hashes.completeHash
        },
        gatewayUrls: {},
        dataAccessible: {}
      };
      
      // Test IPFS data accessibility
      for (const [type, hash] of Object.entries(verification.ipfsHashes)) {
        if (hash) {
          verification.gatewayUrls[type] = `https://gateway.ipfs.io/ipfs/${hash}`;
          try {
            await ipfsService.retrieveData(hash);
            verification.dataAccessible[type] = true;
          } catch (error) {
            verification.dataAccessible[type] = false;
          }
        }
      }
      
      return {
        success: true,
        verification,
        allDataAccessible: Object.values(verification.dataAccessible).every(accessible => accessible)
      };
      
    } catch (error) {
      console.error('Data integrity verification failed:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
  
  /**
   * Get service status
   */
  getStatus() {
    const ipfsStatus = ipfsService.getStatus();
    
    return {
      ipfs: ipfsStatus,
      blockchain: {
        connected: this.signer !== null,
        contractDeployed: this.contract !== null,
        ready: this.isReady
      },
      storageType: this.isReady ? 'ipfs+blockchain' : 'ipfs-only',
      decentralized: true,
      apiDependency: false
    };
  }
}

module.exports = new DecentralizedStorageService();
