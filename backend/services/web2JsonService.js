/**
 * Web2JSON FDC Service
 * Maps off-chain credit data to on-chain format using Flare's FDC
 */

const axios = require('axios');
const { ethers } = require('ethers');
const config = require('../config');

class Web2JsonService {
  constructor() {
    this.fdcClient = null;
    this.initializeFDC();
  }

  async initializeFDC() {
    try {
      // Initialize Flare FDC client
      // Note: In production, you would use the actual FDC client library
      this.fdcClient = {
        baseUrl: config.fdc.attestationUrl,
        apiKey: config.fdc.apiKey
      };
      
      console.log('Web2JSON FDC Service initialized');
    } catch (error) {
      console.error('Failed to initialize FDC client:', error);
    }
  }

  /**
   * Create attestation request for credit score data
   * @param {Object} creditData - Off-chain credit data from Experian
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Attestation request object
   */
  createAttestationRequest(creditData, userAddress) {
    const attestationRequest = {
      attestationType: 'Web2JSON',
      sourceId: 'EXPERIAN_CREDIT_SCORE',
      requestId: this.generateRequestId(),
      timestamp: Math.floor(Date.now() / 1000),
      requestData: {
        url: 'https://api.experian.com/credit-score', // Mock URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          ssn: creditData.ssn || 'masked',
          requestType: 'credit_score'
        })
      },
      responseMapping: {
        creditScore: '$.creditReport.creditScore.value',
        paymentHistory: '$.creditReport.creditFactors.paymentHistory.score',
        creditUtilization: '$.creditReport.creditFactors.creditUtilization.utilization',
        creditHistoryLength: '$.creditReport.creditFactors.creditHistory.lengthInYears',
        accountsOpen: '$.creditReport.creditFactors.creditMix.accountsOpen',
        recentInquiries: '$.creditReport.creditFactors.newCredit.recentInquiries',
        publicRecords: '$.creditReport.publicRecords.bankruptcies',
        delinquencies: '$.creditReport.delinquencies.thirtyDaysLate'
      },
      expectedResponse: this.formatCreditDataForAttestation(creditData),
      userAddress: userAddress
    };

    return attestationRequest;
  }

  /**
   * Format credit data for blockchain attestation
   * @param {Object} creditData - Raw credit data from Experian mock
   * @returns {Object} Formatted data for attestation
   */
  formatCreditDataForAttestation(creditData) {
    return {
      creditScore: creditData.creditScore,
      paymentHistory: creditData.paymentHistory,
      creditUtilization: creditData.creditUtilization,
      creditHistoryLength: creditData.creditHistoryLength || creditData.creditHistory,
      accountsOpen: creditData.accountsOpen,
      recentInquiries: creditData.recentInquiries,
      publicRecords: creditData.publicRecords,
      delinquencies: creditData.delinquencies,
      timestamp: creditData.timestamp || Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Submit attestation request to Flare FDC
   * @param {Object} attestationRequest - Formatted attestation request
   * @returns {Object} Attestation response with proof
   */
  async submitAttestationRequest(attestationRequest) {
    try {
      // Mock FDC API call - in production this would call actual Flare FDC
      const mockFDCResponse = await this.mockFDCCall(attestationRequest);
      
      // Generate attestation proof
      const attestationProof = await this.generateAttestationProof(
        attestationRequest,
        mockFDCResponse
      );

      return {
        success: true,
        requestId: attestationRequest.requestId,
        attestationProof,
        attestationData: mockFDCResponse.attestationData,
        merkleProof: mockFDCResponse.merkleProof,
        timestamp: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error('Error submitting attestation request:', error);
      return {
        success: false,
        error: error.message,
        requestId: attestationRequest.requestId
      };
    }
  }

  /**
   * Mock FDC API call for development
   * @param {Object} attestationRequest - Attestation request
   * @returns {Object} Mock FDC response
   */
  async mockFDCCall(attestationRequest) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const attestationData = {
      sourceId: attestationRequest.sourceId,
      timestamp: attestationRequest.timestamp,
      responseData: attestationRequest.expectedResponse,
      dataHash: ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(JSON.stringify(attestationRequest.expectedResponse))
      ),
      requestId: attestationRequest.requestId
    };

    // Generate mock Merkle proof
    const merkleProof = this.generateMockMerkleProof(attestationData);

    return {
      success: true,
      attestationData,
      merkleProof,
      blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
      transactionHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(attestationRequest.requestId))
    };
  }

  /**
   * Generate attestation proof for smart contract verification
   * @param {Object} attestationRequest - Original request
   * @param {Object} fdcResponse - FDC response
   * @returns {Object} Attestation proof
   */
  async generateAttestationProof(attestationRequest, fdcResponse) {
    const proofData = {
      requestId: attestationRequest.requestId,
      sourceId: attestationRequest.sourceId,
      timestamp: fdcResponse.attestationData.timestamp,
      dataHash: fdcResponse.attestationData.dataHash,
      merkleRoot: fdcResponse.merkleProof.root,
      blockNumber: fdcResponse.blockNumber,
      transactionHash: fdcResponse.transactionHash
    };

    // Create proof hash
    const proofHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['bytes32', 'string', 'uint256', 'bytes32', 'bytes32', 'uint256', 'bytes32'],
        [
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proofData.requestId)),
          proofData.sourceId,
          proofData.timestamp,
          proofData.dataHash,
          proofData.merkleRoot,
          proofData.blockNumber,
          proofData.transactionHash
        ]
      )
    );

    return {
      ...proofData,
      proofHash,
      merkleProof: fdcResponse.merkleProof.proof
    };
  }

  /**
   * Generate mock Merkle proof for development
   * @param {Object} attestationData - Attestation data
   * @returns {Object} Mock Merkle proof
   */
  generateMockMerkleProof(attestationData) {
    const leaves = [
      attestationData.dataHash,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('mock_leaf_1')),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('mock_leaf_2')),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('mock_leaf_3'))
    ];

    // Create simple mock Merkle tree
    const level1 = [
      ethers.utils.keccak256(ethers.utils.solidityPack(['bytes32', 'bytes32'], [leaves[0], leaves[1]])),
      ethers.utils.keccak256(ethers.utils.solidityPack(['bytes32', 'bytes32'], [leaves[2], leaves[3]]))
    ];

    const root = ethers.utils.keccak256(
      ethers.utils.solidityPack(['bytes32', 'bytes32'], [level1[0], level1[1]])
    );

    return {
      root,
      proof: [leaves[1], level1[1]],
      leaf: attestationData.dataHash,
      index: 0
    };
  }

  /**
   * Process complete credit score attestation workflow
   * @param {Object} creditData - Credit data from Experian
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Complete attestation result
   */
  async processCreditScoreAttestation(creditData, userAddress) {
    try {
      console.log(`Processing credit score attestation for user: ${userAddress}`);

      // Step 1: Create attestation request
      const attestationRequest = this.createAttestationRequest(creditData, userAddress);
      
      // Step 2: Submit to FDC
      const attestationResponse = await this.submitAttestationRequest(attestationRequest);

      if (!attestationResponse.success) {
        throw new Error(`Attestation failed: ${attestationResponse.error}`);
      }

      // Step 3: Format for smart contract
      const contractData = this.formatForSmartContract(
        creditData,
        attestationResponse
      );

      return {
        success: true,
        attestationId: attestationResponse.requestId,
        contractData,
        attestationProof: attestationResponse.attestationProof,
        timestamp: attestationResponse.timestamp
      };
    } catch (error) {
      console.error('Error processing credit score attestation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format attestation data for smart contract consumption
   * @param {Object} creditData - Original credit data
   * @param {Object} attestationResponse - FDC attestation response
   * @returns {Object} Smart contract formatted data
   */
  formatForSmartContract(creditData, attestationResponse) {
    return {
      creditScore: creditData.creditScore,
      paymentHistory: creditData.paymentHistory,
      creditUtilization: creditData.creditUtilization,
      creditHistoryLength: creditData.creditHistoryLength || creditData.creditHistory,
      accountsOpen: creditData.accountsOpen,
      recentInquiries: creditData.recentInquiries,
      publicRecords: creditData.publicRecords,
      delinquencies: creditData.delinquencies,
      attestationId: attestationResponse.requestId,
      dataHash: attestationResponse.attestationProof.dataHash,
      merkleRoot: attestationResponse.attestationProof.merkleRoot,
      blockNumber: attestationResponse.attestationProof.blockNumber,
      timestamp: attestationResponse.timestamp
    };
  }

  generateRequestId() {
    return `web2json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new Web2JsonService();
