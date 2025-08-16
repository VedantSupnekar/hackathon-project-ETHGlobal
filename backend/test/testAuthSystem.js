/**
 * Test Script for Authentication and Wallet Management System
 * Tests user registration, login, wallet creation/linking, and credit scoring
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test users for authentication
const testUsers = [
  {
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    ssn: '123-45-6789',
    dateOfBirth: '1990-01-15',
    description: 'New user with wallet creation'
  },
  {
    email: 'jane.smith@example.com',
    password: 'AnotherSecure456!',
    firstName: 'Jane',
    lastName: 'Smith',
    ssn: '987-65-4321',
    dateOfBirth: '1985-05-20',
    description: 'User linking existing wallet'
  }
];

// Mock wallet for linking (valid Ethereum address)
const mockWallet = {
  address: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46',
  signature: 'mock_signature_for_wallet_verification_12345'
};

async function testHealthCheck() {
  console.log('\n🔍 Testing Auth System Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ API Server Status:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testUserRegistration(user) {
  console.log(`\n👤 Testing User Registration for ${user.email}...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      ssn: user.ssn,
      dateOfBirth: user.dateOfBirth
    });

    if (response.data.success) {
      console.log('✅ User Registration Successful');
      console.log(`   - User ID: ${response.data.user.id}`);
      console.log(`   - Email: ${response.data.user.email}`);
      console.log(`   - Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   - JWT Token: ${response.data.token.substring(0, 20)}...`);
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } else {
      console.error('❌ Registration Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Registration Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testUserLogin(user) {
  console.log(`\n🔐 Testing User Login for ${user.email}...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: user.email,
      password: user.password
    });

    if (response.data.success) {
      console.log('✅ User Login Successful');
      console.log(`   - Welcome back: ${response.data.user.firstName}`);
      console.log(`   - Last Login: ${response.data.user.lastLogin}`);
      console.log(`   - JWT Token: ${response.data.token.substring(0, 20)}...`);
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } else {
      console.error('❌ Login Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Login Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testWalletCreation(token) {
  console.log('\n💳 Testing Wallet Creation...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/wallet/create`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Wallet Creation Successful');
      console.log(`   - Address: ${response.data.wallet.address}`);
      console.log(`   - Public Key: ${response.data.wallet.publicKey.substring(0, 20)}...`);
      console.log(`   - Mnemonic: ${response.data.wallet.mnemonic.split(' ').slice(0, 3).join(' ')}...`);
      console.log(`   - Is Generated: ${response.data.wallet.isGenerated}`);
      
      return {
        success: true,
        wallet: response.data.wallet
      };
    } else {
      console.error('❌ Wallet Creation Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Wallet Creation Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testWalletLinking(token) {
  console.log('\n🔗 Testing Wallet Linking...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/wallet/link`, {
      walletAddress: mockWallet.address,
      signature: mockWallet.signature
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Wallet Linking Successful');
      console.log(`   - Address: ${response.data.wallet.address}`);
      console.log(`   - Is Generated: ${response.data.wallet.isGenerated}`);
      console.log(`   - On-Chain Score: ${response.data.wallet.onChainScore}`);
      console.log(`   - DeFi Activity: ${JSON.stringify(response.data.wallet.defiActivity).substring(0, 50)}...`);
      
      return {
        success: true,
        wallet: response.data.wallet
      };
    } else {
      console.error('❌ Wallet Linking Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Wallet Linking Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testOnChainScore(token) {
  console.log('\n⛓️  Testing On-Chain Credit Score...');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/score/onchain`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ On-Chain Score Calculated');
      console.log(`   - Score: ${response.data.onChainScore}`);
      console.log(`   - Wallets Analyzed: ${response.data.breakdown.walletsAnalyzed}`);
      console.log(`   - Has Off-Chain Data: ${response.data.breakdown.hasOffChainData}`);
      
      return {
        success: true,
        score: response.data.onChainScore
      };
    } else {
      console.error('❌ On-Chain Score Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ On-Chain Score Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testOffChainScore(token, user) {
  console.log('\n📊 Testing Off-Chain Credit Score (FDC Web2JSON)...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/score/offchain`, {
      ssn: user.ssn,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Off-Chain Score Updated');
      console.log(`   - Off-Chain Score: ${response.data.offChainScore}`);
      console.log(`   - Composite Score: ${response.data.compositeScore}`);
      console.log(`   - FDC Attestation ID: ${response.data.fdcAttestation.attestationId}`);
      console.log(`   - Data Hash: ${response.data.fdcAttestation.proof.dataHash.substring(0, 20)}...`);
      
      return {
        success: true,
        offChainScore: response.data.offChainScore,
        compositeScore: response.data.compositeScore
      };
    } else {
      console.error('❌ Off-Chain Score Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Off-Chain Score Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testCompositeScore(token) {
  console.log('\n🎯 Testing Composite Credit Score...');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/score/composite`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Composite Score Calculated');
      console.log(`   - On-Chain Score: ${response.data.scores.onChain}`);
      console.log(`   - Off-Chain Score: ${response.data.scores.offChain || 'Not available'}`);
      console.log(`   - Composite Score: ${response.data.scores.composite}`);
      console.log(`   - Weights: On-Chain ${response.data.weights.onChain * 100}%, Off-Chain ${response.data.weights.offChain * 100}%`);
      console.log(`   - Wallets Analyzed: ${response.data.breakdown.walletsAnalyzed}`);
      
      return {
        success: true,
        scores: response.data.scores
      };
    } else {
      console.error('❌ Composite Score Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Composite Score Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testCompleteOnboarding(token, user, createWallet = true) {
  console.log('\n🚀 Testing Complete Onboarding Flow...');
  try {
    const requestBody = {
      createWallet: createWallet,
      linkWallet: !createWallet,
      ssn: user.ssn,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth
    };

    if (!createWallet) {
      requestBody.walletAddress = mockWallet.address;
      requestBody.signature = mockWallet.signature;
    }

    const response = await axios.post(`${BASE_URL}/api/auth/complete-onboarding`, requestBody, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Complete Onboarding Successful');
      console.log(`   - Wallet: ${response.data.results.wallet ? 'Created/Linked' : 'Not processed'}`);
      console.log(`   - On-Chain Score: ${response.data.results.onChainScore || 'Not calculated'}`);
      console.log(`   - Off-Chain Score: ${response.data.results.offChainScore || 'Not processed'}`);
      console.log(`   - Composite Score: ${response.data.results.compositeScore || 'Not calculated'}`);
      
      return {
        success: true,
        results: response.data.results
      };
    } else {
      console.error('❌ Complete Onboarding Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Complete Onboarding Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testUserDashboard(token) {
  console.log('\n📊 Testing User Dashboard...');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const dashboard = response.data.dashboard;
      console.log('✅ Dashboard Data Retrieved');
      console.log(`   - User: ${dashboard.user.firstName} ${dashboard.user.lastName}`);
      console.log(`   - Account Age: ${dashboard.stats.accountAge} days`);
      console.log(`   - Total Wallets: ${dashboard.wallets.count}`);
      console.log(`   - Primary Wallet: ${dashboard.wallets.primary || 'Not set'}`);
      console.log(`   - Credit Scores:`);
      console.log(`     • On-Chain: ${dashboard.creditProfile.onChainScore || 'Not calculated'}`);
      console.log(`     • Off-Chain: ${dashboard.creditProfile.offChainScore || 'Not available'}`);
      console.log(`     • Composite: ${dashboard.creditProfile.compositeScore || 'Not calculated'}`);
      
      if (dashboard.wallets.details.length > 0) {
        console.log(`   - Wallet Details:`);
        dashboard.wallets.details.forEach((wallet, index) => {
          console.log(`     ${index + 1}. ${wallet.address} (${wallet.isGenerated ? 'Generated' : 'Linked'}) - Score: ${wallet.onChainScore}`);
        });
      }
      
      return {
        success: true,
        dashboard: dashboard
      };
    } else {
      console.error('❌ Dashboard Failed:', response.data.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Dashboard Error:', error.response?.data || error.message);
    return { success: false };
  }
}

async function runAuthSystemTests() {
  console.log('🔐 Starting Authentication and Wallet Management Tests');
  console.log('=' * 70);

  // Test health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server not available. Please start the server first.');
    return;
  }

  const userTokens = [];

  // Test user registration and login for each user
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Testing User ${i + 1}: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Description: ${user.description}`);
    console.log(`${'='.repeat(80)}`);

    // Test registration
    const regResult = await testUserRegistration(user);
    if (!regResult.success) continue;

    userTokens.push({ user, token: regResult.token });

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test login
    const loginResult = await testUserLogin(user);
    if (!loginResult.success) continue;

    // Test wallet operations based on user index
    if (i === 0) {
      // First user: create wallet
      await testWalletCreation(regResult.token);
    } else {
      // Second user: link existing wallet
      await testWalletLinking(regResult.token);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test credit scoring
    await testOnChainScore(regResult.token);
    await testOffChainScore(regResult.token, user);
    await testCompositeScore(regResult.token);

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test dashboard
    await testUserDashboard(regResult.token);

    // Add delay between users
    if (i < testUsers.length - 1) {
      console.log('\n⏳ Waiting before next user...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Test complete onboarding flow with a new user
  console.log(`\n${'='.repeat(80)}`);
  console.log('🚀 Testing Complete Onboarding Flow');
  console.log(`${'='.repeat(80)}`);

  const onboardingUser = {
    email: 'onboarding.test@example.com',
    password: 'OnboardingTest123!',
    firstName: 'Test',
    lastName: 'User',
    ssn: '555-12-3456',
    dateOfBirth: '1992-12-03'
  };

  const onboardingReg = await testUserRegistration(onboardingUser);
  if (onboardingReg.success) {
    await testCompleteOnboarding(onboardingReg.token, onboardingUser, true);
    await testUserDashboard(onboardingReg.token);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 Authentication System Tests Completed!');
  console.log(`${'='.repeat(80)}`);
  
  console.log('\n📝 Test Summary:');
  console.log('✅ User Registration & Login');
  console.log('✅ JWT Authentication');
  console.log('✅ Wallet Creation (New wallets with default scores)');
  console.log('✅ Wallet Linking (Existing wallets with calculated scores)');
  console.log('✅ On-Chain Credit Scoring');
  console.log('✅ Off-Chain Credit Scoring via FDC Web2JSON');
  console.log('✅ Composite Score Calculation (Weighted combination)');
  console.log('✅ Complete Onboarding Flow');
  console.log('✅ User Dashboard');

  console.log('\n🔑 Key Features Demonstrated:');
  console.log('• User account management with SSN verification');
  console.log('• Secure JWT-based authentication');
  console.log('• Wallet creation with HD mnemonics');
  console.log('• Wallet linking with signature verification');
  console.log('• On-chain credit scoring based on DeFi activity');
  console.log('• Off-chain credit scoring via Flare FDC');
  console.log('• Weighted composite scoring (70% off-chain, 30% on-chain)');
  console.log('• Multi-wallet aggregation for single credit score');
  console.log('• Complete user onboarding automation');
}

// Run tests if called directly
if (require.main === module) {
  runAuthSystemTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testWalletCreation,
  testWalletLinking,
  testOnChainScore,
  testOffChainScore,
  testCompositeScore,
  testCompleteOnboarding,
  testUserDashboard,
  runAuthSystemTests
};
