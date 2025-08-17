/**
 * Credit Score API Routes
 * Handles Experian mock calls and Web2JSON attestation
 */

const express = require('express');
const router = express.Router();
const experianMock = require('../services/experianMock');
const fdcWeb2JsonService = require('../services/fdcWeb2JsonService');

/**
 * GET /api/credit-score/test
 * Test endpoint to verify API is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Credit Score API is working',
    timestamp: new Date().toISOString(),
    services: {
      experianMock: 'Available',
      web2JsonFDC: 'Available'
    }
  });
});

/**
 * POST /api/credit-score/experian/report
 * Get full credit report from Experian (mock)
 */
router.post('/experian/report', async (req, res) => {
  try {
    const { ssn, firstName, lastName, dateOfBirth, address } = req.body;

    // Validate required fields
    if (!ssn || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ssn, firstName, lastName'
      });
    }

    // Call Experian mock service
    const creditReport = await experianMock.getCreditReport({
      ssn,
      firstName,
      lastName,
      dateOfBirth,
      address
    });

    res.json(creditReport);
  } catch (error) {
    console.error('Error getting Experian credit report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching credit report'
    });
  }
});

/**
 * POST /api/credit-score/experian/simplified
 * Get simplified credit data for blockchain mapping
 */
router.post('/experian/simplified', async (req, res) => {
  try {
    const { ssn } = req.body;

    if (!ssn) {
      return res.status(400).json({
        success: false,
        error: 'SSN is required'
      });
    }

    const creditData = await experianMock.getSimplifiedCreditData(ssn);

    if (!creditData) {
      return res.status(404).json({
        success: false,
        error: 'No credit data found for provided SSN'
      });
    }

    res.json({
      success: true,
      creditData
    });
  } catch (error) {
    console.error('Error getting simplified credit data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching credit data'
    });
  }
});

/**
 * POST /api/credit-score/web2json/attest
 * Create Web2JSON attestation using real Flare FDC (Updated from legacy mock)
 */
router.post('/web2json/attest', async (req, res) => {
  try {
    const { ssn, userAddress } = req.body;

    if (!ssn || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'SSN and userAddress are required'
      });
    }

    // Get credit data from Experian mock
    const creditData = await experianMock.getSimplifiedCreditData(ssn);

    if (!creditData) {
      return res.status(404).json({
        success: false,
        error: 'No credit data found for provided SSN'
      });
    }

    // Add SSN to credit data for FDC processing
    creditData.ssn = ssn;

    // Process FDC Web2JSON attestation (using real FDC implementation)
    const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
      creditData,
      userAddress
    );

    if (!fdcResult.success) {
      return res.status(500).json({
        success: false,
        error: `FDC attestation failed: ${fdcResult.error}`
      });
    }

    res.json({
      success: true,
      type: 'FDC_WEB2JSON',
      attestation: fdcResult,
      originalCreditData: creditData
    });
  } catch (error) {
    console.error('Error processing FDC Web2JSON attestation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing FDC attestation'
    });
  }
});

/**
 * POST /api/credit-score/fdc/attest
 * Create FDC Web2JSON attestation for credit score data (Real FDC implementation)
 */
router.post('/fdc/attest', async (req, res) => {
  try {
    const { ssn, userAddress } = req.body;

    if (!ssn || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'SSN and userAddress are required'
      });
    }

    // Get credit data from Experian mock
    const creditData = await experianMock.getSimplifiedCreditData(ssn);

    if (!creditData) {
      return res.status(404).json({
        success: false,
        error: 'No credit data found for provided SSN'
      });
    }

    // Add SSN to credit data for FDC processing
    creditData.ssn = ssn;

    // Process FDC Web2JSON attestation
    const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
      creditData,
      userAddress
    );

    if (!fdcResult.success) {
      return res.status(500).json({
        success: false,
        error: `FDC attestation failed: ${fdcResult.error}`
      });
    }

    res.json({
      success: true,
      type: 'FDC_WEB2JSON',
      attestation: fdcResult,
      originalCreditData: creditData
    });
  } catch (error) {
    console.error('Error processing FDC Web2JSON attestation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing FDC attestation'
    });
  }
});

/**
 * POST /api/credit-score/complete-flow
 * Complete flow: Experian -> Web2JSON -> Smart Contract Ready Data
 */
router.post('/complete-flow', async (req, res) => {
  try {
    const { ssn, firstName, lastName, dateOfBirth, userAddress } = req.body;

    if (!ssn || !firstName || !lastName || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ssn, firstName, lastName, userAddress'
      });
    }

    console.log(`Starting complete credit score flow for user: ${userAddress}`);

    // Step 1: Get full Experian credit report
    const fullCreditReport = await experianMock.getCreditReport({
      ssn,
      firstName,
      lastName,
      dateOfBirth
    });

    if (!fullCreditReport.success) {
      return res.status(400).json(fullCreditReport);
    }

    // Step 2: Get simplified data for blockchain
    const simplifiedData = await experianMock.getSimplifiedCreditData(ssn);

    // Step 3: Process FDC Web2JSON attestation
    simplifiedData.ssn = ssn; // Add SSN for FDC processing
    const fdcResult = await fdcWeb2JsonService.processCreditScoreAttestation(
      simplifiedData,
      userAddress
    );

    if (!fdcResult.success) {
      return res.status(500).json({
        success: false,
        error: `FDC attestation failed: ${fdcResult.error}`
      });
    }

    // Step 4: Return complete result
    res.json({
      success: true,
      flow: 'complete',
      type: 'FDC_WEB2JSON',
      data: {
        fullCreditReport,
        simplifiedData,
        fdcAttestation: fdcResult,
        smartContractData: fdcResult.contractData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in complete credit score flow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error in complete flow'
    });
  }
});

/**
 * GET /api/credit-score/mock-data
 * Get available mock SSNs for testing
 */
router.get('/mock-data', (req, res) => {
  res.json({
    success: true,
    message: 'Available mock SSNs for testing',
    mockProfiles: [
      {
        ssn: '123-45-6789',
        name: 'John Doe',
        creditScore: 750,
        description: 'Good credit profile'
      },
      {
        ssn: '987-65-4321',
        name: 'Jane Smith',
        creditScore: 620,
        description: 'Fair credit profile'
      },
      {
        ssn: '555-12-3456',
        name: 'Bob Johnson',
        creditScore: 800,
        description: 'Excellent credit profile'
      }
    ],
    note: 'Use any other SSN to generate random credit profile'
  });
});

module.exports = router;
