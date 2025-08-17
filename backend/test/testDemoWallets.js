/**
 * Test Demo Wallets Integration
 * Verifies that demo wallets work correctly with the credit scoring system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Demo wallet addresses from generated wallets
const DEMO_WALLETS = {
  EXCELLENT: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Alice - 820 score
  GOOD: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',      // Bob - 750 score  
  FAIR: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',      // Charlie - 650 score
  POOR: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',      // Dave - 550 score
  BAD: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',       // Eve - 450 score
  NO_CREDIT: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',  // Frank - 350 score
};

async function testDemoWalletIntegration() {
  console.log('🎭 TESTING DEMO WALLET INTEGRATION');
  console.log('=' * 60);
  console.log('');

  try {
    // Step 1: Create test user
    console.log('1️⃣ Creating test user for demo...');
    const userEmail = `demo${Date.now()}@hackathon.test`;
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: userEmail,
      password: 'DemoTest123!',
      firstName: 'Demo',
      lastName: 'User',
      ssn: '999-99-9999',
      dateOfBirth: '1990-01-01'
    });

    if (!registerResponse.data.success) {
      throw new Error(`Registration failed: ${registerResponse.data.error}`);
    }

    const token = registerResponse.data.token;
    console.log(`✅ User created: ${userEmail}`);
    console.log('');

    // Step 2: Test each demo wallet
    console.log('2️⃣ Testing demo wallets with different credit profiles...');
    console.log('');

    const results = [];

    for (const [profile, address] of Object.entries(DEMO_WALLETS)) {
      console.log(`Testing ${profile} wallet: ${address}`);
      
      try {
        // Test FDC off-chain score with demo wallet SSN
        const ssnMap = {
          'EXCELLENT': '111-11-1111',
          'GOOD': '222-22-2222', 
          'FAIR': '333-33-3333',
          'POOR': '444-44-4444',
          'BAD': '555-55-5555',
          'NO_CREDIT': '666-66-6666'
        };

        const ssn = ssnMap[profile];
        
        // Get off-chain score via FDC
        const offChainResponse = await axios.post(`${BASE_URL}/api/auth/score/offchain`, {
          ssn: ssn,
          firstName: 'Demo',
          lastName: 'User'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let offChainScore = null;
        if (offChainResponse.data.success) {
          offChainScore = offChainResponse.data.offChainScore;
          console.log(`   ✅ Off-chain score: ${offChainScore} (via FDC Web2JSON)`);
        }

        // Link demo wallet (simulate)
        console.log(`   🔗 Simulating wallet link for on-chain analysis...`);
        
        // Get on-chain score by calling the scoring endpoint directly
        // (In real demo, user would connect via MetaMask)
        const onChainTest = await axios.post(`${BASE_URL}/api/credit-score/fdc/attest`, {
          ssn: ssn,
          userAddress: address
        });

        if (onChainTest.data.success) {
          console.log(`   ✅ FDC attestation created: ${onChainTest.data.attestation.attestationId}`);
        }

        // Get composite score
        const compositeResponse = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let compositeScore = null;
        if (compositeResponse.data.success) {
          const scores = compositeResponse.data.scores;
          compositeScore = scores.composite;
          console.log(`   🎯 Composite score: ${compositeScore} (${scores.onChain} + ${scores.offChain})`);
        }

        results.push({
          profile,
          address,
          offChainScore,
          compositeScore,
          success: true
        });

        console.log(`   ✅ ${profile} wallet test completed`);

      } catch (error) {
        console.log(`   ❌ ${profile} wallet test failed: ${error.message}`);
        results.push({
          profile,
          address,
          success: false,
          error: error.message
        });
      }
      
      console.log('');
    }

    // Step 3: Summary
    console.log('3️⃣ DEMO WALLET TEST SUMMARY');
    console.log('-'.repeat(40));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
    console.log('');

    if (successful.length > 0) {
      console.log('📊 CREDIT SCORE PROGRESSION:');
      successful
        .sort((a, b) => (a.offChainScore || 0) - (b.offChainScore || 0))
        .forEach(result => {
          console.log(`   ${result.profile.padEnd(12)} | Off-chain: ${(result.offChainScore || 'N/A').toString().padEnd(3)} | Composite: ${result.compositeScore || 'N/A'}`);
        });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('❌ FAILED TESTS:');
      failed.forEach(result => {
        console.log(`   ${result.profile}: ${result.error}`);
      });
      console.log('');
    }

    console.log('🎉 DEMO WALLET INTEGRATION TEST COMPLETE');
    console.log('');
    console.log('🎬 READY FOR HACKATHON DEMO:');
    console.log('1. Import demo wallet addresses into MetaMask');
    console.log('2. Connect wallets one by one to show score progression');
    console.log('3. Demonstrate real FDC Web2JSON integration');
    console.log('4. Show composite scoring with multiple wallets');
    console.log('');
    console.log('🏆 Judges will see live credit score changes!');

  } catch (error) {
    console.error('❌ Demo wallet integration test failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run test
if (require.main === module) {
  testDemoWalletIntegration();
}

module.exports = { testDemoWalletIntegration };
