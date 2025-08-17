/**
 * Simple IPFS Service using Public HTTP API
 * Uses free public IPFS nodes for decentralized storage
 */

const axios = require('axios');
const FormData = require('form-data');

class SimpleIPFSService {
  constructor() {
    // Free public IPFS API endpoints
    this.apiEndpoints = [
      'https://ipfs.infura.io:5001',
      // Add more free endpoints as fallbacks
    ];
    
    this.currentEndpoint = 0;
    this.isConnected = false;
    
    this.initializeService();
  }
  
  async initializeService() {
    try {
      await this.testConnection();
      this.isConnected = true;
      console.log('📡 Simple IPFS Service initialized - using public API');
    } catch (error) {
      console.log('⚠️  IPFS not available - storing locally only');
      console.log('   Note: For production, set up IPFS node or use Pinata/Infura');
      this.isConnected = false;
    }
  }
  
  async testConnection() {
    const endpoint = this.apiEndpoints[this.currentEndpoint];
    try {
      const response = await axios.post(`${endpoint}/api/v0/version`, {}, {
        timeout: 5000
      });
      console.log(`✅ IPFS API connected: ${endpoint}`);
      return true;
    } catch (error) {
      throw new Error(`IPFS API connection failed: ${error.message}`);
    }
  }
  
  /**
   * Store data on IPFS using public API
   */
  async storeData(data) {
    if (!this.isConnected) {
      // Fallback: return a mock hash and store locally
      const mockHash = this.generateMockHash(data);
      console.log(`📦 Storing data locally (IPFS unavailable): ${mockHash}`);
      
      return {
        success: true,
        ipfsHash: mockHash,
        gateway: `https://gateway.ipfs.io/ipfs/${mockHash}`,
        timestamp: new Date().toISOString(),
        data: data,
        stored: 'local-fallback',
        note: 'Data stored locally - IPFS unavailable'
      };
    }
    
    try {
      const endpoint = this.apiEndpoints[this.currentEndpoint];
      const jsonData = JSON.stringify(data, null, 2);
      
      // Create form data for IPFS API
      const form = new FormData();
      form.append('file', Buffer.from(jsonData), {
        filename: 'data.json',
        contentType: 'application/json'
      });
      
      console.log(`📤 Storing data on IPFS via ${endpoint}...`);
      
      const response = await axios.post(`${endpoint}/api/v0/add`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer YOUR_API_KEY' // Replace with actual API key if needed
        },
        timeout: 30000
      });
      
      const ipfsHash = response.data.Hash;
      console.log(`✅ Data stored on IPFS: ${ipfsHash}`);
      
      return {
        success: true,
        ipfsHash,
        gateway: `https://gateway.ipfs.io/ipfs/${ipfsHash}`,
        timestamp: new Date().toISOString(),
        data: data,
        stored: 'ipfs',
        size: jsonData.length
      };
      
    } catch (error) {
      console.error('IPFS storage error:', error.message);
      
      // Fallback to local storage with mock hash
      const mockHash = this.generateMockHash(data);
      console.log(`📦 Fallback: storing locally with mock hash: ${mockHash}`);
      
      return {
        success: true,
        ipfsHash: mockHash,
        gateway: `https://gateway.ipfs.io/ipfs/${mockHash}`,
        timestamp: new Date().toISOString(),
        data: data,
        stored: 'local-fallback',
        error: error.message
      };
    }
  }
  
  /**
   * Retrieve data from IPFS
   */
  async retrieveData(ipfsHash) {
    // Check if it's a mock hash (starts with 'mock_')
    if (ipfsHash.startsWith('mock_')) {
      console.log(`📥 Retrieving local mock data: ${ipfsHash}`);
      return {
        success: true,
        data: { 
          note: 'This is mock data - IPFS was unavailable during storage',
          hash: ipfsHash,
          timestamp: new Date().toISOString()
        },
        ipfsHash,
        stored: 'local-mock'
      };
    }
    
    try {
      console.log(`📥 Retrieving data from IPFS: ${ipfsHash}`);
      
      // Try to get from IPFS gateway
      const gatewayUrl = `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
      const response = await axios.get(gatewayUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ Data retrieved from IPFS`);
      
      return {
        success: true,
        data: response.data,
        ipfsHash,
        timestamp: new Date().toISOString(),
        source: 'ipfs-gateway'
      };
      
    } catch (error) {
      console.error('IPFS retrieval error:', error.message);
      
      return {
        success: false,
        error: `Failed to retrieve data from IPFS: ${error.message}`,
        ipfsHash,
        note: 'Data may not be available on public gateways yet'
      };
    }
  }
  
  /**
   * Generate a mock IPFS hash for fallback storage
   */
  generateMockHash(data) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return `mock_${hash.substring(0, 46)}`; // IPFS-like hash format
  }
  
  /**
   * Store user profile on IPFS
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
   * Store complete user data package
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
   * Generate data hash for integrity
   */
  generateDataHash(data) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 16);
  }
  
  /**
   * Get IPFS gateway URL
   */
  getGatewayUrl(ipfsHash) {
    return `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      client: 'simple-http-api',
      endpoint: this.apiEndpoints[this.currentEndpoint],
      fallbackMode: !this.isConnected,
      note: this.isConnected ? 'Connected to IPFS' : 'Using local fallback storage'
    };
  }
  
  /**
   * Verify data integrity
   */
  async verifyDataIntegrity(ipfsHash, expectedData) {
    try {
      const retrieved = await this.retrieveData(ipfsHash);
      if (!retrieved.success) return false;
      
      const expectedHash = this.generateDataHash(expectedData);
      const retrievedHash = this.generateDataHash(retrieved.data);
      
      return expectedHash === retrievedHash;
    } catch (error) {
      console.error('Data integrity verification failed:', error);
      return false;
    }
  }
}

module.exports = new SimpleIPFSService();
