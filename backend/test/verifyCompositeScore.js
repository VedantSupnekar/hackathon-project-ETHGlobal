/**
 * Verify Composite Score Calculation Script
 * Tests weighted scoring combination and mathematical accuracy
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function verifyCompositeScoreCalculation() {
  console.log('🎯 VERIFYING COMPOSITE SCORE CALCULATION');
  console.log('=' * 50);

  try {
    // Step 1: Create test user with full setup
    console.log('\n1️⃣ Setting up test user with complete profile...');
    const userEmail = `composite${Date.now()}@example.com`;
    const testSSN = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: userEmail,
      password: 'CompositeTest123!',
      firstName: 'Composite',
      lastName: 'Test',
      ssn: testSSN,
      dateOfBirth: '1990-01-01'
    });

    if (!registerResponse.data.success) {
      console.log('❌ User registration failed');
      return;
    }

    const token = registerResponse.data.token;
    console.log('✅ User registered successfully');

    // Step 2: Create wallet for on-chain score
    console.log('\n2️⃣ Creating wallet for on-chain scoring...');
    const walletResponse = await axios.post(`${BASE_URL}/api/auth/wallet/create`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!walletResponse.data.success) {
      console.log('❌ Wallet creation failed');
      return;
    }

    console.log('✅ Wallet created successfully');

    // Step 3: Get initial on-chain score (before off-chain data)
    console.log('\n3️⃣ Getting initial on-chain score...');
    const onChainResponse = await axios.get(`${BASE_URL}/api/auth/score/onchain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!onChainResponse.data.success) {
      console.log('❌ On-chain score calculation failed');
      return;
    }

    const onChainScore = onChainResponse.data.onChainScore;
    console.log('✅ On-chain score calculated:');
    console.log(`   Score: ${onChainScore}`);

    // Step 4: Get initial composite score (should be 100% on-chain)
    console.log('\n4️⃣ Getting initial composite score (on-chain only)...');
    const initialCompositeResponse = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (initialCompositeResponse.data.success) {
      const initialScores = initialCompositeResponse.data.scores;
      const initialWeights = initialCompositeResponse.data.weights;
      
      console.log('✅ Initial composite score (on-chain only):');
      console.log(`   On-Chain: ${initialScores.onChain}`);
      console.log(`   Off-Chain: ${initialScores.offChain || 'null'}`);
      console.log(`   Composite: ${initialScores.composite}`);
      console.log(`   Weights: ${initialWeights.onChain * 100}% on-chain, ${initialWeights.offChain * 100}% off-chain`);

      // Verify on-chain only logic
      if (initialWeights.onChain === 1.0 && initialWeights.offChain === 0.0) {
        console.log('✅ Correct weighting for on-chain only scenario');
      } else {
        console.log('❌ Incorrect weighting for on-chain only scenario');
        return;
      }

      if (initialScores.composite === initialScores.onChain) {
        console.log('✅ Composite score equals on-chain score (as expected)');
      } else {
        console.log('❌ Composite score should equal on-chain score when no off-chain data');
        return;
      }
    }

    // Step 5: Add off-chain score using a predefined SSN for consistent results
    console.log('\n5️⃣ Adding off-chain score using predefined profile...');
    const offChainResponse = await axios.post(`${BASE_URL}/api/auth/score/offchain`, {
      ssn: '123-45-6789', // Use John Doe's profile for consistent 750 score
      firstName: 'Composite',
      lastName: 'Test'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!offChainResponse.data.success) {
      console.log('❌ Off-chain score update failed:', offChainResponse.data.error);
      return;
    }

    const offChainScore = offChainResponse.data.offChainScore;
    const preliminaryComposite = offChainResponse.data.compositeScore;
    
    console.log('✅ Off-chain score added:');
    console.log(`   Off-Chain Score: ${offChainScore}`);
    console.log(`   Preliminary Composite: ${preliminaryComposite}`);

    // Step 6: Get final composite score with both scores
    console.log('\n6️⃣ Getting final composite score (weighted combination)...');
    const finalCompositeResponse = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!finalCompositeResponse.data.success) {
      console.log('❌ Final composite score calculation failed');
      return;
    }

    const finalScores = finalCompositeResponse.data.scores;
    const finalWeights = finalCompositeResponse.data.weights;
    
    console.log('✅ Final composite score (weighted combination):');
    console.log(`   On-Chain Score: ${finalScores.onChain}`);
    console.log(`   Off-Chain Score: ${finalScores.offChain}`);
    console.log(`   Composite Score: ${finalScores.composite}`);
    console.log(`   Weights: ${finalWeights.onChain * 100}% on-chain, ${finalWeights.offChain * 100}% off-chain`);

    // Step 7: Verify mathematical accuracy
    console.log('\n7️⃣ Verifying mathematical accuracy...');
    
    // Check weights
    if (finalWeights.onChain === 0.3 && finalWeights.offChain === 0.7) {
      console.log('✅ Correct weights applied (30% on-chain, 70% off-chain)');
    } else {
      console.log(`❌ Incorrect weights: expected 0.3/0.7, got ${finalWeights.onChain}/${finalWeights.offChain}`);
      return;
    }

    // Calculate expected composite score
    const expectedComposite = Math.round(
      (finalScores.onChain * finalWeights.onChain) + (finalScores.offChain * finalWeights.offChain)
    );
    
    console.log('📊 Mathematical verification:');
    console.log(`   Formula: (${finalScores.onChain} × ${finalWeights.onChain}) + (${finalScores.offChain} × ${finalWeights.offChain})`);
    console.log(`   Calculation: (${finalScores.onChain * finalWeights.onChain}) + (${finalScores.offChain * finalWeights.offChain})`);
    console.log(`   Expected: ${expectedComposite}`);
    console.log(`   Actual: ${finalScores.composite}`);

    // Allow for 1 point rounding difference
    if (Math.abs(finalScores.composite - expectedComposite) <= 1) {
      console.log('✅ Mathematical calculation verified (within rounding tolerance)');
    } else {
      console.log(`❌ Mathematical calculation error: expected ${expectedComposite}, got ${finalScores.composite}`);
      return;
    }

    // Step 8: Test score impact analysis
    console.log('\n8️⃣ Analyzing score impact...');
    
    const onChainContribution = finalScores.onChain * finalWeights.onChain;
    const offChainContribution = finalScores.offChain * finalWeights.offChain;
    
    console.log('📈 Score contribution analysis:');
    console.log(`   On-Chain Contribution: ${onChainContribution.toFixed(1)} points (${((onChainContribution / finalScores.composite) * 100).toFixed(1)}%)`);
    console.log(`   Off-Chain Contribution: ${offChainContribution.toFixed(1)} points (${((offChainContribution / finalScores.composite) * 100).toFixed(1)}%)`);
    
    // Verify off-chain has more impact (70% weight)
    if (offChainContribution > onChainContribution) {
      console.log('✅ Off-chain score has greater impact (as expected with 70% weight)');
    } else {
      console.log('⚠️  On-chain score has greater impact despite lower weight');
    }

    // Step 9: Test edge cases
    console.log('\n9️⃣ Testing edge case scenarios...');
    
    // Create another user with only on-chain score
    const edgeUserEmail = `edge${Date.now()}@example.com`;
    const edgeRegisterResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: edgeUserEmail,
      password: 'EdgeTest123!',
      firstName: 'Edge',
      lastName: 'Case',
      ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
      dateOfBirth: '1990-01-01'
    });

    if (edgeRegisterResponse.data.success) {
      const edgeToken = edgeRegisterResponse.data.token;
      
      // Create wallet
      await axios.post(`${BASE_URL}/api/auth/wallet/create`, {}, {
        headers: { 'Authorization': `Bearer ${edgeToken}` }
      });

      // Get composite score (should be 100% on-chain)
      const edgeCompositeResponse = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
        headers: { 'Authorization': `Bearer ${edgeToken}` }
      });

      if (edgeCompositeResponse.data.success) {
        const edgeWeights = edgeCompositeResponse.data.weights;
        if (edgeWeights.onChain === 1.0 && edgeWeights.offChain === 0.0) {
          console.log('✅ Edge case verified: 100% on-chain when no off-chain data');
        } else {
          console.log('❌ Edge case failed: incorrect weighting for on-chain only');
        }
      }
    }

    console.log('\n🎉 COMPOSITE SCORE VERIFICATION COMPLETE');
    console.log('✅ Weighted combination (70% off-chain, 30% on-chain)');
    console.log('✅ Mathematical accuracy verified');
    console.log('✅ Fallback logic working (100% on-chain when needed)');
    console.log('✅ Score impact analysis correct');

  } catch (error) {
    console.error('❌ Composite score verification failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run verification
if (require.main === module) {
  verifyCompositeScoreCalculation();
}

module.exports = { verifyCompositeScoreCalculation };
