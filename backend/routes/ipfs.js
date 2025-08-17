/**
 * IPFS Routes - Decentralized Data Storage
 * Replaces traditional API endpoints with IPFS-based storage
 */

const express = require('express');
const router = express.Router();
const decentralizedStorageService = require('../services/decentralizedStorageService');
const ipfsService = require('../services/simpleIpfsService');
const userPortfolioService = require('../services/userPortfolioService');

/**
 * GET /api/ipfs/status
 * Get IPFS service status
 */
router.get('/status', (req, res) => {
  try {
    const status = decentralizedStorageService.getStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IPFS status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IPFS status'
    });
  }
});

/**
 * POST /api/ipfs/store-user
 * Store user data on IPFS (replaces traditional user creation)
 */
router.post('/store-user', async (req, res) => {
  try {
    const { userData } = req.body;
    
    if (!userData || !userData.email || !userData.web3Id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user data (email, web3Id)'
      });
    }
    
    console.log(`📤 Storing user data on IPFS for: ${userData.email}`);
    
    const result = await decentralizedStorageService.registerUser(userData);
    
    res.json({
      success: true,
      message: 'User data stored on decentralized network',
      result,
      verification: {
        ipfsHash: result.ipfsHash,
        gatewayUrl: result.gatewayUrl,
        storageType: result.storage
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('IPFS user storage error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to store user data: ${error.message}`
    });
  }
});

/**
 * POST /api/ipfs/store-scores
 * Store credit scores on IPFS (replaces traditional score APIs)
 */
router.post('/store-scores', async (req, res) => {
  try {
    const { web3Id, onChainScore, offChainScore, compositeScore, fdcAttestationId } = req.body;
    
    if (!web3Id || compositeScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required score data (web3Id, compositeScore)'
      });
    }
    
    console.log(`📤 Storing credit scores on IPFS for Web3 ID: ${web3Id}`);
    
    const scoreData = {
      web3Id,
      onChainScore: onChainScore || 0,
      offChainScore: offChainScore || 0,
      compositeScore,
      fdcAttestationId: fdcAttestationId || null,
      timestamp: new Date().toISOString(),
      breakdown: {
        onChainWeight: 0.6,
        offChainWeight: 0.4,
        calculation: `(${onChainScore} * 0.6) + (${offChainScore} * 0.4) = ${compositeScore}`
      }
    };
    
    const result = await decentralizedStorageService.storeCreditScores(scoreData);
    
    res.json({
      success: true,
      message: 'Credit scores stored on decentralized network',
      result,
      verification: {
        ipfsHash: result.ipfsHash,
        gatewayUrl: result.gatewayUrl,
        storageType: result.storage,
        scoreBreakdown: scoreData.breakdown
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('IPFS score storage error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to store scores: ${error.message}`
    });
  }
});

/**
 * POST /api/ipfs/link-wallet
 * Store wallet link on IPFS (replaces traditional wallet linking)
 */
router.post('/link-wallet', async (req, res) => {
  try {
    const { web3Id, walletAddress, signature, onChainScore } = req.body;
    
    if (!web3Id || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required wallet data (web3Id, walletAddress)'
      });
    }
    
    console.log(`📤 Storing wallet link on IPFS: ${walletAddress} -> ${web3Id}`);
    
    const linkData = {
      signature: signature || 'demo-signature',
      onChainScore: onChainScore || 0,
      timestamp: new Date().toISOString()
    };
    
    const result = await decentralizedStorageService.linkWallet(web3Id, walletAddress, linkData);
    
    res.json({
      success: true,
      message: 'Wallet link stored on decentralized network',
      result,
      verification: {
        ipfsHash: result.ipfsHash,
        gatewayUrl: result.gatewayUrl,
        storageType: result.storage,
        walletAddress: result.walletAddress
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('IPFS wallet linking error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to link wallet: ${error.message}`
    });
  }
});

/**
 * GET /api/ipfs/retrieve/:ipfsHash
 * Retrieve data from IPFS by hash
 */
router.get('/retrieve/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    
    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'IPFS hash required'
      });
    }
    
    console.log(`📥 Retrieving data from IPFS: ${ipfsHash}`);
    
    const result = await ipfsService.retrieveData(ipfsHash);
    
    res.json({
      success: true,
      message: 'Data retrieved from IPFS',
      ipfsHash,
      data: result.data,
      metadata: {
        size: result.size,
        retrievedAt: result.timestamp,
        gatewayUrl: `https://gateway.ipfs.io/ipfs/${ipfsHash}`
      }
    });
    
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to retrieve data: ${error.message}`
    });
  }
});

/**
 * GET /api/ipfs/user/:web3Id
 * Get all IPFS data for a user (from blockchain)
 */
router.get('/user/:web3Id', async (req, res) => {
  try {
    const { web3Id } = req.params;
    
    if (!web3Id) {
      return res.status(400).json({
        success: false,
        error: 'Web3 ID required'
      });
    }
    
    console.log(`📥 Retrieving user data from decentralized storage: ${web3Id}`);
    
    const result = await decentralizedStorageService.retrieveUserData(web3Id);
    
    res.json({
      success: true,
      message: 'User data retrieved from decentralized network',
      web3Id,
      data: result.data,
      metadata: {
        storageType: result.storage,
        ipfsHashes: result.ipfsHashes,
        retrievedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('User data retrieval error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to retrieve user data: ${error.message}`
    });
  }
});

/**
 * GET /api/ipfs/verify/:web3Id
 * Verify data integrity across IPFS and blockchain
 */
router.get('/verify/:web3Id', async (req, res) => {
  try {
    const { web3Id } = req.params;
    
    if (!web3Id) {
      return res.status(400).json({
        success: false,
        error: 'Web3 ID required'
      });
    }
    
    console.log(`🔍 Verifying data integrity for: ${web3Id}`);
    
    const verification = await decentralizedStorageService.verifyDataIntegrity(web3Id);
    
    res.json({
      success: true,
      message: 'Data integrity verification completed',
      verification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Data verification error:', error);
    res.status(500).json({
      success: false,
      error: `Verification failed: ${error.message}`
    });
  }
});

/**
 * GET /api/ipfs/history/:web3Id
 * Get complete data history for a user (all IPFS hashes)
 */
router.get('/history/:web3Id', async (req, res) => {
  try {
    const { web3Id } = req.params;
    
    if (!web3Id) {
      return res.status(400).json({
        success: false,
        error: 'Web3 ID required'
      });
    }
    
    console.log(`📜 Retrieving data history for: ${web3Id}`);
    
    const history = await decentralizedStorageService.getUserDataHistory(web3Id);
    
    res.json({
      success: true,
      message: 'Data history retrieved from blockchain',
      history,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Data history error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to retrieve history: ${error.message}`
    });
  }
});

/**
 * POST /api/ipfs/store-complete
 * Store complete user dataset (comprehensive backup)
 */
router.post('/store-complete', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }
    
    // Get complete user data from portfolio service
    const userProfile = userPortfolioService.getUserProfile(userId);
    if (!userProfile.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log(`📦 Storing complete user dataset on IPFS: ${userProfile.profile.web3Id}`);
    
    const completeUserData = {
      profile: userProfile.profile,
      creditScores: {
        onChainScore: userProfile.profile.onChainScore,
        offChainScore: userProfile.profile.offChainScore,
        compositeScore: userProfile.profile.compositeScore,
        lastUpdated: userProfile.profile.lastScoreUpdate
      },
      linkedWallets: userProfile.profile.linkedWallets,
      fdcAttestations: userProfile.profile.fdcAttestation ? [userProfile.profile.fdcAttestation] : []
    };
    
    const result = await decentralizedStorageService.storeCompleteUserData(completeUserData);
    
    res.json({
      success: true,
      message: 'Complete user dataset stored on decentralized network',
      result,
      verification: {
        ipfsHash: result.ipfsHash,
        gatewayUrl: result.gatewayUrl,
        storageType: result.storage,
        dataSize: JSON.stringify(completeUserData).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Complete data storage error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to store complete data: ${error.message}`
    });
  }
});

/**
 * GET /api/ipfs/gateway/:ipfsHash
 * Get IPFS gateway URL for direct access
 */
router.get('/gateway/:ipfsHash', (req, res) => {
  try {
    const { ipfsHash } = req.params;
    
    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'IPFS hash required'
      });
    }
    
    const gatewayUrl = ipfsService.getGatewayUrl(ipfsHash);
    
    res.json({
      success: true,
      ipfsHash,
      gatewayUrl,
      directAccess: `curl -s ${gatewayUrl}`,
      browserAccess: gatewayUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Gateway URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate gateway URL'
    });
  }
});

module.exports = router;
