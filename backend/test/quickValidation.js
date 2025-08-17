/**
 * Quick Validation Script
 * Tests all core functionality systematically before frontend development
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateMockAPI() {
  log('cyan', '\n🏦 VALIDATING MOCK EXPERIAN API');
  log('white', '=' * 50);

  try {
    // Test 1: Get mock profiles
    log('blue', '\n📋 Testing available mock profiles...');
    const profilesResponse = await axios.get(`${BASE_URL}/api/credit-score/mock-data`);
    
    if (profilesResponse.data.success && profilesResponse.data.mockProfiles.length >= 3) {
      log('green', '✅ Mock profiles available');
      profilesResponse.data.mockProfiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.ssn}): ${profile.creditScore}`);
      });
    } else {
      log('red', '❌ Mock profiles not properly configured');
      return false;
    }

    // Test 2: Full credit report
    log('blue', '\n📊 Testing full credit report generation...');
    const reportResponse = await axios.post(`${BASE_URL}/api/credit-score/experian/report`, {
      ssn: '123-45-6789',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15'
    });

    if (reportResponse.data.success && reportResponse.data.creditReport) {
      const report = reportResponse.data.creditReport;
      log('green', '✅ Full credit report generated');
      console.log(`   - Credit Score: ${report.creditScore.value} (${report.creditScore.model})`);
      console.log(`   - Payment History: ${report.creditFactors.paymentHistory.score}%`);
      console.log(`   - Credit Utilization: ${report.creditFactors.creditUtilization.utilization}%`);
      console.log(`   - Accounts: ${report.accounts.length} accounts`);
      console.log(`   - Inquiries: ${report.inquiries.length} inquiries`);
    } else {
      log('red', '❌ Full credit report generation failed');
      return false;
    }

    // Test 3: Simplified credit data
    log('blue', '\n🔍 Testing simplified credit data...');
    const simplifiedResponse = await axios.post(`${BASE_URL}/api/credit-score/experian/simplified`, {
      ssn: '123-45-6789'
    });

    if (simplifiedResponse.data.success && simplifiedResponse.data.creditData) {
      const data = simplifiedResponse.data.creditData;
      log('green', '✅ Simplified credit data retrieved');
      console.log(`   - Credit Score: ${data.creditScore}`);
      console.log(`   - Payment History: ${data.paymentHistory}`);
      console.log(`   - Credit Utilization: ${data.creditUtilization}`);
      console.log(`   - Credit History Length: ${data.creditHistoryLength} years`);
      
      // Validate data consistency with full report
      if (data.creditScore === reportResponse.data.creditReport.creditScore.value) {
        log('green', '✅ Data consistency validated between full and simplified reports');
      } else {
        log('red', '❌ Data inconsistency between full and simplified reports');
        return false;
      }
    } else {
      log('red', '❌ Simplified credit data retrieval failed');
      return false;
    }

    return true;
  } catch (error) {
    log('red', `❌ Mock API validation error: ${error.message}`);
    return false;
  }
}

async function validateWeb2ToWeb3Mapping() {
  log('cyan', '\n🔗 VALIDATING WEB2-TO-WEB3 MAPPING');
  log('white', '=' * 50);

  try {
    // Test FDC Web2JSON attestation
    log('blue', '\n🌐 Testing FDC Web2JSON attestation...');
    const fdcResponse = await axios.post(`${BASE_URL}/api/credit-score/fdc/attest`, {
      ssn: '123-45-6789',
      userAddress: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46'
    });

    if (fdcResponse.data.success && fdcResponse.data.attestation) {
      const attestation = fdcResponse.data.attestation;
      log('green', '✅ FDC Web2JSON attestation created');
      console.log(`   - Attestation ID: ${attestation.attestationId}`);
      console.log(`   - Credit Score: ${attestation.attestationData.creditScore}`);
      console.log(`   - Data Hash: ${attestation.proof.dataHash.substring(0, 20)}...`);
      console.log(`   - Merkle Root: ${attestation.proof.merkleRoot.substring(0, 20)}...`);
      console.log(`   - Block Number: ${attestation.proof.blockNumber}`);

      // Validate proof structure
      const proof = attestation.proof;
      const requiredFields = ['requestId', 'sourceId', 'responseHex', 'dataHash', 'merkleProof', 'merkleRoot'];
      const missingFields = requiredFields.filter(field => !proof[field]);
      
      if (missingFields.length === 0) {
        log('green', '✅ All required proof fields present');
      } else {
        log('red', `❌ Missing proof fields: ${missingFields.join(', ')}`);
        return false;
      }

      // Validate responseHex format
      if (proof.responseHex && proof.responseHex.startsWith('0x') && proof.responseHex.length > 10) {
        log('green', '✅ Response hex properly formatted');
        console.log(`   - Response Hex Length: ${proof.responseHex.length} characters`);
      } else {
        log('red', '❌ Response hex not properly formatted');
        return false;
      }

      // Validate hash formats
      const hashFields = ['dataHash', 'merkleRoot'];
      for (const field of hashFields) {
        if (proof[field] && proof[field].startsWith('0x') && proof[field].length === 66) {
          log('green', `✅ ${field} properly formatted (32 bytes)`);
        } else {
          log('red', `❌ ${field} not properly formatted`);
          return false;
        }
      }

      // Validate merkle proof array
      if (Array.isArray(proof.merkleProof) && proof.merkleProof.length > 0) {
        log('green', `✅ Merkle proof array contains ${proof.merkleProof.length} elements`);
      } else {
        log('red', '❌ Merkle proof array invalid');
        return false;
      }

      // Validate smart contract data
      const contractData = attestation.contractData;
      if (contractData && contractData.creditScore === attestation.attestationData.creditScore) {
        log('green', '✅ Smart contract data matches attestation data');
      } else {
        log('red', '❌ Smart contract data mismatch');
        return false;
      }

    } else {
      log('red', '❌ FDC Web2JSON attestation failed');
      console.log('Response:', fdcResponse.data);
      return false;
    }

    return true;
  } catch (error) {
    log('red', `❌ Web2-to-Web3 mapping validation error: ${error.message}`);
    return false;
  }
}

async function validateOnChainScoring() {
  log('cyan', '\n⛓️  VALIDATING ON-CHAIN SCORING');
  log('white', '=' * 50);

  try {
    // Test 1: Register user and create wallet
    log('blue', '\n👤 Creating test user and wallet...');
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: `validation${Date.now()}@example.com`,
      password: 'ValidationTest123!',
      firstName: 'Validation',
      lastName: 'Test',
      ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
      dateOfBirth: '1990-01-01'
    });

    if (!registerResponse.data.success) {
      log('red', '❌ User registration failed');
      return false;
    }

    const token = registerResponse.data.token;
    log('green', '✅ User registered successfully');

    // Create wallet
    const walletResponse = await axios.post(`${BASE_URL}/api/auth/wallet/create`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!walletResponse.data.success) {
      log('red', '❌ Wallet creation failed');
      return false;
    }

    const wallet = walletResponse.data.wallet;
    log('green', '✅ Wallet created successfully');
    console.log(`   - Address: ${wallet.address}`);
    console.log(`   - Is Generated: ${wallet.isGenerated}`);

    // Test 2: Calculate on-chain score
    log('blue', '\n🔍 Testing on-chain score calculation...');
    const scoreResponse = await axios.get(`${BASE_URL}/api/auth/score/onchain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (scoreResponse.data.success) {
      const score = scoreResponse.data.onChainScore;
      log('green', '✅ On-chain score calculated');
      console.log(`   - Score: ${score}`);
      console.log(`   - Wallets Analyzed: ${scoreResponse.data.breakdown.walletsAnalyzed}`);

      // Validate score range
      if (score >= 300 && score <= 850) {
        log('green', '✅ Score within valid range (300-850)');
      } else {
        log('red', `❌ Score outside valid range: ${score}`);
        return false;
      }

      // Test new wallet score (should be around 300-500)
      if (score >= 300 && score <= 500) {
        log('green', '✅ New wallet score in expected range');
      } else {
        log('yellow', `⚠️  New wallet score higher than expected: ${score}`);
      }
    } else {
      log('red', '❌ On-chain score calculation failed');
      return false;
    }

    // Test 3: Link existing wallet (should have higher score)
    log('blue', '\n🔗 Testing existing wallet linking...');
    const linkResponse = await axios.post(`${BASE_URL}/api/auth/wallet/link`, {
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46',
      signature: 'mock_signature_for_verification_12345'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (linkResponse.data.success) {
      const linkedWallet = linkResponse.data.wallet;
      log('green', '✅ Existing wallet linked successfully');
      console.log(`   - Address: ${linkedWallet.address}`);
      console.log(`   - On-Chain Score: ${linkedWallet.onChainScore}`);
      console.log(`   - DeFi Activity: ${JSON.stringify(linkedWallet.defiActivity).substring(0, 50)}...`);

      // Validate linked wallet score is higher
      if (linkedWallet.onChainScore > score) {
        log('green', '✅ Linked wallet has higher score than generated wallet');
      } else {
        log('yellow', '⚠️  Linked wallet score not higher than generated wallet');
      }
    } else {
      log('red', '❌ Wallet linking failed');
      console.log('Error:', linkResponse.data.error);
      return false;
    }

    // Test 4: Multi-wallet aggregated score
    log('blue', '\n📊 Testing multi-wallet score aggregation...');
    const aggregatedResponse = await axios.get(`${BASE_URL}/api/auth/score/onchain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (aggregatedResponse.data.success) {
      const aggregatedScore = aggregatedResponse.data.onChainScore;
      log('green', '✅ Multi-wallet aggregated score calculated');
      console.log(`   - Aggregated Score: ${aggregatedScore}`);
      console.log(`   - Wallets Analyzed: ${aggregatedResponse.data.breakdown.walletsAnalyzed}`);

      // Should now analyze 2 wallets
      if (aggregatedResponse.data.breakdown.walletsAnalyzed === 2) {
        log('green', '✅ Both wallets included in aggregation');
      } else {
        log('red', `❌ Expected 2 wallets, got ${aggregatedResponse.data.breakdown.walletsAnalyzed}`);
        return false;
      }
    } else {
      log('red', '❌ Multi-wallet score aggregation failed');
      return false;
    }

    return true;
  } catch (error) {
    log('red', `❌ On-chain scoring validation error: ${error.message}`);
    return false;
  }
}

async function validateCompositeScoring() {
  log('cyan', '\n🎯 VALIDATING COMPOSITE SCORING');
  log('white', '=' * 50);

  try {
    // Test complete flow with both scores
    log('blue', '\n🚀 Testing complete credit scoring flow...');
    const completeResponse = await axios.post(`${BASE_URL}/api/credit-score/complete-flow`, {
      ssn: '123-45-6789',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      userAddress: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46'
    });

    if (completeResponse.data.success) {
      const data = completeResponse.data.data;
      log('green', '✅ Complete flow executed successfully');
      
      // Extract scores
      const offChainScore = data.simplifiedData.creditScore;
      const onChainScore = data.fdcAttestation.contractData.creditScore; // This should match off-chain
      
      console.log(`   - Off-Chain Score: ${offChainScore}`);
      console.log(`   - Flow Type: ${completeResponse.data.type}`);
      console.log(`   - FDC Attestation ID: ${data.fdcAttestation.attestationId}`);

      // Validate score consistency
      if (onChainScore === offChainScore) {
        log('green', '✅ Off-chain score consistency maintained through FDC');
      } else {
        log('red', `❌ Score inconsistency: off-chain ${offChainScore} vs on-chain ${onChainScore}`);
        return false;
      }
    } else {
      log('red', '❌ Complete flow failed');
      console.log('Error:', completeResponse.data.error);
      return false;
    }

    // Test user composite score calculation
    log('blue', '\n🧮 Testing user composite score calculation...');
    
    // First, create a user and add both types of scores
    const userEmail = `composite${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: userEmail,
      password: 'CompositeTest123!',
      firstName: 'Composite',
      lastName: 'Test',
      ssn: '555-66-7777',
      dateOfBirth: '1990-01-01'
    });

    const token = registerResponse.data.token;

    // Create wallet for on-chain score
    await axios.post(`${BASE_URL}/api/auth/wallet/create`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Add off-chain score
    await axios.post(`${BASE_URL}/api/auth/score/offchain`, {
      ssn: '555-66-7777',
      firstName: 'Composite',
      lastName: 'Test'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Get composite score
    const compositeResponse = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (compositeResponse.data.success) {
      const scores = compositeResponse.data.scores;
      const weights = compositeResponse.data.weights;
      
      log('green', '✅ Composite score calculated');
      console.log(`   - On-Chain Score: ${scores.onChain}`);
      console.log(`   - Off-Chain Score: ${scores.offChain}`);
      console.log(`   - Composite Score: ${scores.composite}`);
      console.log(`   - Weights: ${weights.onChain * 100}% on-chain, ${weights.offChain * 100}% off-chain`);

      // Validate calculation
      const expectedComposite = Math.round((scores.onChain * weights.onChain) + (scores.offChain * weights.offChain));
      if (Math.abs(scores.composite - expectedComposite) <= 1) { // Allow 1 point rounding difference
        log('green', '✅ Composite score calculation verified');
        console.log(`   - Calculation: (${scores.onChain} × ${weights.onChain}) + (${scores.offChain} × ${weights.offChain}) = ${expectedComposite}`);
      } else {
        log('red', `❌ Composite score calculation error: expected ${expectedComposite}, got ${scores.composite}`);
        return false;
      }

      // Validate weights
      if (weights.onChain === 0.3 && weights.offChain === 0.7) {
        log('green', '✅ Correct weighting applied (30% on-chain, 70% off-chain)');
      } else {
        log('red', `❌ Incorrect weighting: expected 0.3/0.7, got ${weights.onChain}/${weights.offChain}`);
        return false;
      }
    } else {
      log('red', '❌ Composite score calculation failed');
      return false;
    }

    return true;
  } catch (error) {
    log('red', `❌ Composite scoring validation error: ${error.message}`);
    return false;
  }
}

async function runQuickValidation() {
  log('magenta', '\n🚀 QUICK VALIDATION - CORE SYSTEM CHECK');
  log('white', '=' * 60);

  // Check server health
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    if (healthResponse.data.success) {
      log('green', '✅ Server is running');
    } else {
      log('red', '❌ Server health check failed');
      return;
    }
  } catch (error) {
    log('red', '❌ Server not accessible. Please start the server first.');
    return;
  }

  const results = {
    mockAPI: false,
    web2ToWeb3: false,
    onChainScoring: false,
    compositeScoring: false
  };

  // Run all validations
  results.mockAPI = await validateMockAPI();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.web2ToWeb3 = await validateWeb2ToWeb3Mapping();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.onChainScoring = await validateOnChainScoring();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.compositeScoring = await validateCompositeScoring();

  // Final summary
  log('magenta', '\n📊 VALIDATION SUMMARY');
  log('white', '=' * 60);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? 'green' : 'red';
    log(color, `${status} - ${test.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('green', '\n🎉 ALL VALIDATIONS PASSED!');
    log('white', '\nYour system is ready for:');
    log('cyan', '• Referral system implementation');
    log('cyan', '• Frontend development');
    log('cyan', '• Production deployment');
  } else {
    log('red', '\n⚠️  SOME VALIDATIONS FAILED');
    log('white', '\nPlease address the issues above before proceeding.');
  }

  log('white', '\n' + '=' * 60);
}

// Run validation if called directly
if (require.main === module) {
  runQuickValidation().catch(console.error);
}

module.exports = {
  validateMockAPI,
  validateWeb2ToWeb3Mapping,
  validateOnChainScoring,
  validateCompositeScoring,
  runQuickValidation
};
