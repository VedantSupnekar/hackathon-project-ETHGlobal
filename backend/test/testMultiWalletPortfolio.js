/**
 * Test Multi-Wallet Portfolio System
 * Demonstrates User X (mixed portfolio) vs User Y (consistent portfolio)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testMultiWalletPortfolio() {
  console.log('🎭 TESTING MULTI-WALLET PORTFOLIO SYSTEM');
  console.log('=' * 60);
  console.log('Demonstrating User X (mixed) vs User Y (consistent) portfolios');
  console.log('');

  try {
    // ==================== USER X SCENARIO ====================
    console.log('👤 USER X SCENARIO: Mixed Portfolio (2 Excellent + 1 Bad)');
    console.log('-'.repeat(60));

    // Step 1: Register User X
    console.log('1️⃣ Registering User X...');
    const userXResponse = await axios.post(`${BASE_URL}/api/portfolio/register`, {
      email: 'userx@demo.com',
      password: 'DemoX123!',
      firstName: 'User',
      lastName: 'X',
      ssn: '111-11-1111', // Will map to excellent off-chain score
      dateOfBirth: '1990-01-01'
    });

    if (!userXResponse.data.success) {
      throw new Error(`User X registration failed: ${userXResponse.data.error}`);
    }

    const userXToken = userXResponse.data.token;
    const userXWeb3Id = userXResponse.data.user.web3Id;
    
    console.log(`✅ User X registered:`);
    console.log(`   Web3 ID: ${userXWeb3Id}`);
    console.log(`   Email: ${userXResponse.data.user.email}`);
    console.log('');

    // Step 2: Link User X's wallets one by one
    const userXWallets = [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Excellent Alice' },
      { address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', name: 'Premium Henry' },
      { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Bad Eve' }
    ];

    console.log('2️⃣ Linking User X wallets and showing score progression...');
    
    for (let i = 0; i < userXWallets.length; i++) {
      const wallet = userXWallets[i];
      
      console.log(`   Linking wallet ${i + 1}/3: ${wallet.name}`);
      console.log(`   Address: ${wallet.address}`);
      
      // Link wallet
      const linkResponse = await axios.post(`${BASE_URL}/api/portfolio/link-wallet`, {
        walletAddress: wallet.address,
        signature: 'demo_signature'
      }, {
        headers: { 'Authorization': `Bearer ${userXToken}` }
      });

      if (linkResponse.data.success) {
        console.log(`   ✅ Linked successfully`);
        console.log(`   📊 Portfolio: ${linkResponse.data.portfolioSummary.totalWallets} wallets`);
        console.log(`   🔗 Aggregated on-chain score: ${linkResponse.data.portfolioSummary.aggregatedOnChainScore}`);
      } else {
        console.log(`   ❌ Link failed: ${linkResponse.data.error}`);
      }
      console.log('');
    }

    // Step 3: Set User X off-chain score
    console.log('3️⃣ Setting User X off-chain score via FDC Web2JSON...');
    const userXOffChainResponse = await axios.post(`${BASE_URL}/api/portfolio/set-offchain-score`, {
      ssn: '111-11-1111',
      firstName: 'User',
      lastName: 'X'
    }, {
      headers: { 'Authorization': `Bearer ${userXToken}` }
    });

    if (userXOffChainResponse.data.success) {
      console.log(`✅ Off-chain score set: ${userXOffChainResponse.data.offChainScore}`);
      console.log(`🔗 FDC Attestation: ${userXOffChainResponse.data.fdcAttestation.attestationId}`);
    }
    console.log('');

    // Step 4: Get User X final scores
    console.log('4️⃣ User X Final Portfolio Analysis...');
    const userXScoresResponse = await axios.get(`${BASE_URL}/api/portfolio/scores`, {
      headers: { 'Authorization': `Bearer ${userXToken}` }
    });

    if (userXScoresResponse.data.success) {
      const scores = userXScoresResponse.data.scores;
      const weights = userXScoresResponse.data.weights;
      const portfolio = userXScoresResponse.data.portfolioSummary;

      console.log(`📊 USER X FINAL SCORES:`);
      console.log(`   On-Chain Score: ${scores.onChain} (${portfolio.totalWallets} wallets aggregated)`);
      console.log(`   Off-Chain Score: ${scores.offChain} (via FDC Web2JSON)`);
      console.log(`   🎯 Composite Score: ${scores.composite}`);
      console.log(`   Weights: ${weights.onChain * 100}% on-chain + ${weights.offChain * 100}% off-chain`);
      console.log('');
      console.log(`   Wallet Breakdown:`);
      portfolio.walletBreakdown.forEach((wallet, index) => {
        console.log(`     ${index + 1}. ${wallet.address} - Score: ${wallet.score} (${wallet.profile || 'Regular'})`);
      });
    }
    console.log('');
    console.log('');

    // ==================== USER Y SCENARIO ====================
    console.log('👤 USER Y SCENARIO: Consistent Portfolio (2 Good Wallets)');
    console.log('-'.repeat(60));

    // Step 1: Register User Y
    console.log('1️⃣ Registering User Y...');
    const userYResponse = await axios.post(`${BASE_URL}/api/portfolio/register`, {
      email: 'usery@demo.com',
      password: 'DemoY123!',
      firstName: 'User',
      lastName: 'Y',
      ssn: '222-22-2222', // Will map to good off-chain score
      dateOfBirth: '1990-01-01'
    });

    if (!userYResponse.data.success) {
      throw new Error(`User Y registration failed: ${userYResponse.data.error}`);
    }

    const userYToken = userYResponse.data.token;
    const userYWeb3Id = userYResponse.data.user.web3Id;
    
    console.log(`✅ User Y registered:`);
    console.log(`   Web3 ID: ${userYWeb3Id}`);
    console.log(`   Email: ${userYResponse.data.user.email}`);
    console.log('');

    // Step 2: Link User Y's wallets
    const userYWallets = [
      { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Good Bob' },
      { address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', name: 'Student Ivy' }
    ];

    console.log('2️⃣ Linking User Y wallets...');
    
    for (let i = 0; i < userYWallets.length; i++) {
      const wallet = userYWallets[i];
      
      console.log(`   Linking wallet ${i + 1}/2: ${wallet.name}`);
      console.log(`   Address: ${wallet.address}`);
      
      const linkResponse = await axios.post(`${BASE_URL}/api/portfolio/link-wallet`, {
        walletAddress: wallet.address,
        signature: 'demo_signature'
      }, {
        headers: { 'Authorization': `Bearer ${userYToken}` }
      });

      if (linkResponse.data.success) {
        console.log(`   ✅ Linked successfully`);
        console.log(`   📊 Portfolio: ${linkResponse.data.portfolioSummary.totalWallets} wallets`);
        console.log(`   🔗 Aggregated on-chain score: ${linkResponse.data.portfolioSummary.aggregatedOnChainScore}`);
      }
      console.log('');
    }

    // Step 3: Set User Y off-chain score
    console.log('3️⃣ Setting User Y off-chain score via FDC Web2JSON...');
    const userYOffChainResponse = await axios.post(`${BASE_URL}/api/portfolio/set-offchain-score`, {
      ssn: '222-22-2222',
      firstName: 'User',
      lastName: 'Y'
    }, {
      headers: { 'Authorization': `Bearer ${userYToken}` }
    });

    if (userYOffChainResponse.data.success) {
      console.log(`✅ Off-chain score set: ${userYOffChainResponse.data.offChainScore}`);
      console.log(`🔗 FDC Attestation: ${userYOffChainResponse.data.fdcAttestation.attestationId}`);
    }
    console.log('');

    // Step 4: Get User Y final scores
    console.log('4️⃣ User Y Final Portfolio Analysis...');
    const userYScoresResponse = await axios.get(`${BASE_URL}/api/portfolio/scores`, {
      headers: { 'Authorization': `Bearer ${userYToken}` }
    });

    let userYScores;
    if (userYScoresResponse.data.success) {
      const scores = userYScoresResponse.data.scores;
      const weights = userYScoresResponse.data.weights;
      const portfolio = userYScoresResponse.data.portfolioSummary;
      userYScores = scores;

      console.log(`📊 USER Y FINAL SCORES:`);
      console.log(`   On-Chain Score: ${scores.onChain} (${portfolio.totalWallets} wallets aggregated)`);
      console.log(`   Off-Chain Score: ${scores.offChain} (via FDC Web2JSON)`);
      console.log(`   🎯 Composite Score: ${scores.composite}`);
      console.log(`   Weights: ${weights.onChain * 100}% on-chain + ${weights.offChain * 100}% off-chain`);
      console.log('');
      console.log(`   Wallet Breakdown:`);
      portfolio.walletBreakdown.forEach((wallet, index) => {
        console.log(`     ${index + 1}. ${wallet.address} - Score: ${wallet.score} (${wallet.profile || 'Regular'})`);
      });
    }
    console.log('');
    console.log('');

    // ==================== COMPARISON ====================
    console.log('⚖️  PORTFOLIO COMPARISON');
    console.log('-'.repeat(60));
    
    if (userXScoresResponse.data.success && userYScoresResponse.data.success) {
      const userXFinal = userXScoresResponse.data.scores;
      const userYFinal = userYScoresResponse.data.scores;
      const userXPortfolio = userXScoresResponse.data.portfolioSummary;
      const userYPortfolio = userYScoresResponse.data.portfolioSummary;

      console.log(`📊 COMPARISON SUMMARY:`);
      console.log('');
      console.log(`   USER X (Mixed Portfolio):`);
      console.log(`     Wallets: ${userXPortfolio.totalWallets} (2 excellent + 1 bad)`);
      console.log(`     On-Chain: ${userXFinal.onChain}`);
      console.log(`     Off-Chain: ${userXFinal.offChain}`);
      console.log(`     Composite: ${userXFinal.composite}`);
      console.log('');
      console.log(`   USER Y (Consistent Portfolio):`);
      console.log(`     Wallets: ${userYPortfolio.totalWallets} (2 good wallets)`);
      console.log(`     On-Chain: ${userYFinal.onChain}`);
      console.log(`     Off-Chain: ${userYFinal.offChain}`);
      console.log(`     Composite: ${userYFinal.composite}`);
      console.log('');
      
      // Analysis
      const scoreDiff = userYFinal.composite - userXFinal.composite;
      console.log(`📈 PORTFOLIO ANALYSIS:`);
      if (scoreDiff > 0) {
        console.log(`   ✅ User Y's consistent portfolio scores ${scoreDiff} points higher`);
        console.log(`   💡 Consistent good wallets > mixed excellent/bad wallets`);
      } else if (scoreDiff < 0) {
        console.log(`   ✅ User X's mixed portfolio scores ${Math.abs(scoreDiff)} points higher`);
        console.log(`   💡 Excellent wallets offset bad wallet impact`);
      } else {
        console.log(`   ⚖️  Both portfolios achieve same composite score`);
        console.log(`   💡 Different strategies, same risk level`);
      }
    }

    console.log('');
    console.log('🎉 MULTI-WALLET PORTFOLIO TEST COMPLETE');
    console.log('');
    console.log('🎬 HACKATHON DEMO READY:');
    console.log('1. Show User X linking 3 wallets with score progression');
    console.log('2. Demonstrate FDC Web2JSON integration for off-chain score');
    console.log('3. Show User Y with consistent 2-wallet portfolio');
    console.log('4. Compare portfolio strategies and risk assessment');
    console.log('5. Highlight real-time aggregated scoring');
    console.log('');
    console.log('🏆 Judges will see live multi-wallet portfolio analysis!');

  } catch (error) {
    console.error('❌ Multi-wallet portfolio test failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run test
if (require.main === module) {
  testMultiWalletPortfolio();
}

module.exports = { testMultiWalletPortfolio };
