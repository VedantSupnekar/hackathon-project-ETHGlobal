/**
 * IPFS Service for Decentralized Data Storage
 * Uses modern Helia client for true Web3 decentralization
 */

const { createHelia } = require('helia');
const { unixfs } = require('@helia/unixfs');
const { json } = require('@helia/json');
const { CID } = require('multiformats/cid');

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.jsonStorage = null;
    this.isConnected = false;
    
    this.initializeService();
  }
  
  async initializeService() {
    try {
      // Create Helia node
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
      this.jsonStorage = json(this.helia);
      
      this.isConnected = true;
      console.log('📡 IPFS Service initialized with Helia - using decentralized storage');
    } catch (error) {
      console.log('⚠️  IPFS not available - using fallback storage:', error.message);
      this.isConnected = false;
    }
  }
  
  async ensureInitialized() {
    if (!this.isConnected) {
      await this.initializeService();
    }
    if (!this.isConnected) {
      throw new Error('IPFS service not available');
    }
  }
  
  /**
   * Store data on IPFS
   * @param {Object} data - Data to store
   * @returns {Object} IPFS hash and metadata
   */
  async storeData(data) {
    await this.ensureInitialized();
    
    try {
      console.log(`📤 Storing data on IPFS...`);
      
      // Store as JSON using Helia
      const cid = await this.jsonStorage.add(data);
      const ipfsHash = cid.toString();
      
      console.log(`✅ Data stored on IPFS: ${ipfsHash}`);
      
      return {
        success: true,
        ipfsHash,
        gateway: `https://gateway.ipfs.io/ipfs/${ipfsHash}`,
        timestamp: new Date().toISOString(),
        data: data // Include original data for verification
      };
      
    } catch (error) {
      console.error('IPFS storage error:', error);
      throw new Error(`Failed to store data on IPFS: ${error.message}`);
    }
  }
  
  /**
   * Retrieve data from IPFS
   * @param {string} ipfsHash - IPFS hash to retrieve
   * @returns {Object} Retrieved data
   */
  async retrieveData(ipfsHash) {
    await this.ensureInitialized();
    
    try {
      console.log(`📥 Retrieving data from IPFS: ${ipfsHash}`);
      
      // Parse CID and retrieve JSON data
      const cid = CID.parse(ipfsHash);
      const data = await this.jsonStorage.get(cid);
      
      console.log(`✅ Data retrieved from IPFS`);
      
      return {
        success: true,
        data: data,
        ipfsHash,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error(`Failed to retrieve data from IPFS: ${error.message}`);
    }
  }
  
  /**
   * Store user profile on IPFS
   * @param {Object} userProfile - User profile data
   * @returns {Object} IPFS storage result
   */
  async storeUserProfile(userProfile) {
    const profileData = {
      type: 'user-profile',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        web3Id: userProfile.web3Id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        createdAt: userProfile.createdAt,
        lastUpdated: new Date().toISOString()
      }
    };
    
    return await this.storeData(profileData);
  }
  
  /**
   * Store credit scores on IPFS
   * @param {Object} scoreData - Credit score data
   * @returns {Object} IPFS storage result
   */
  async storeCreditScores(scoreData) {
    const creditData = {
      type: 'credit-scores',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        web3Id: scoreData.web3Id,
        onChainScore: scoreData.onChainScore,
        offChainScore: scoreData.offChainScore,
        compositeScore: scoreData.compositeScore,
        fdcAttestationId: scoreData.fdcAttestationId,
        calculatedAt: scoreData.timestamp,
        breakdown: scoreData.breakdown || {}
      }
    };
    
    return await this.storeData(creditData);
  }
  
  /**
   * Store wallet linking data on IPFS
   * @param {Object} walletData - Wallet linking data
   * @returns {Object} IPFS storage result
   */
  async storeWalletLink(walletData) {
    const linkData = {
      type: 'wallet-link',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        web3Id: walletData.web3Id,
        walletAddress: walletData.walletAddress,
        linkType: walletData.linkType || 'external',
        signature: walletData.signature,
        linkedAt: walletData.timestamp,
        onChainScore: walletData.onChainScore || null
      }
    };
    
    return await this.storeData(linkData);
  }
  
  /**
   * Create a comprehensive user data package for IPFS
   * @param {Object} userData - Complete user data
   * @returns {Object} IPFS storage result
   */
  async storeCompleteUserData(userData) {
    const completeData = {
      type: 'complete-user-data',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        profile: userData.profile,
        creditScores: userData.creditScores,
        linkedWallets: userData.linkedWallets,
        fdcAttestations: userData.fdcAttestations || [],
        metadata: {
          totalWallets: userData.linkedWallets?.length || 0,
          lastScoreUpdate: userData.creditScores?.timestamp,
          dataIntegrity: this.generateDataHash(userData)
        }
      }
    };
    
    return await this.storeData(completeData);
  }
  
  /**
   * Generate a simple hash for data integrity
   * @param {Object} data - Data to hash
   * @returns {string} Simple hash
   */
  generateDataHash(data) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 16);
  }
  
  /**
   * Get IPFS service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      client: 'helia',
      peerId: this.helia?.libp2p?.peerId?.toString() || 'unknown',
      nodeType: 'embedded'
    };
  }
  
  /**
   * Get IPFS gateway URL for a hash
   * @param {string} ipfsHash - IPFS hash
   * @returns {string} Gateway URL
   */
  getGatewayUrl(ipfsHash) {
    return `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
  }
  
  /**
   * Verify data integrity from IPFS
   * @param {string} ipfsHash - IPFS hash
   * @param {Object} expectedData - Expected data for verification
   * @returns {boolean} Whether data matches
   */
  async verifyDataIntegrity(ipfsHash, expectedData) {
    try {
      const retrieved = await this.retrieveData(ipfsHash);
      const expectedHash = this.generateDataHash(expectedData);
      const retrievedHash = this.generateDataHash(retrieved.data);
      
      return expectedHash === retrievedHash;
    } catch (error) {
      console.error('Data integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Cleanup IPFS resources
   */
  async cleanup() {
    if (this.helia) {
      await this.helia.stop();
      console.log('🛑 IPFS Helia node stopped');
    }
  }
}

module.exports = new IPFSService();
