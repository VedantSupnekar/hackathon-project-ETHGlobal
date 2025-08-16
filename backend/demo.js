#!/usr/bin/env node

/**
 * DeFi Lending Platform Demo
 * Interactive demonstration of the credit scoring system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Demo users with different credit profiles
const demoUsers = [
  {
    name: 'John Doe',
    ssn: '123-45-6789',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46',
    description: 'Good credit profile (750 score)'
  },
  {
    name: 'Jane Smith',
    ssn: '987-65-4321',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-05-20',
    userAddress: '0x8ba1f109551bD432803012645Hac136c5e2BD07',
    description: 'Fair credit profile (620 score)'
  },
  {
    name: 'Bob Johnson',
    ssn: '555-12-3456',
    firstName: 'Bob',
    lastName: 'Johnson',
    dateOfBirth: '1992-12-03',
    userAddress: '0x123f109551bD432803012645Hac136c5e2BD99',
    description: 'Excellent credit profile (800 score)'
  }
];

async function displayWelcome() {
  console.log(`
🏦 ====================================================================
   DeFi Lending Platform - Credit Scoring System Demo
   Hackathon Project: Web2 to Web3 Credit Bridge
🏦 ====================================================================

🎯 This demo showcases:
   ✅ Mock Experian API integration
   ✅ Web2JSON FDC attestation system
   ✅ Complete credit scoring pipeline
   ✅ Smart contract ready data output

💡 The system bridges traditional credit scoring with blockchain technology
   using Flare's FDC (Flare Data Connector) for Web2-to-Web3 data mapping.

📊 Available Demo Users:`);

  demoUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} - ${user.description}`);
  });
  
  console.log(`\n🚀 Starting demonstration...\n`);
}

async function demonstrateHealthCheck() {
  console.log('🔍 Step 1: Health Check');
  console.log('=' * 50);
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ API Server Status:', response.data.message);
    console.log('🌐 Environment:', response.data.environment);
    console.log('📋 Available Services:');
    Object.entries(response.data.services).forEach(([service, status]) => {
      console.log(`   - ${service}: ${status}`);
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
  
  return true;
}

async function demonstrateExperianAPI(user) {
  console.log(`\n📊 Step 2: Experian Credit Report for ${user.name}`);
  console.log('=' * 60);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/credit-score/experian/report`, {
      ssn: user.ssn,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth
    });

    if (response.data.success) {
      const report = response.data.creditReport;
      console.log('✅ Credit Report Generated Successfully');
      console.log(`📈 Credit Score: ${report.creditScore.value} (${report.creditScore.model})`);
      console.log('📊 Credit Factors:');
      console.log(`   • Payment History: ${report.creditFactors.paymentHistory.score}% (Weight: ${report.creditFactors.paymentHistory.weight}%)`);
      console.log(`   • Credit Utilization: ${report.creditFactors.creditUtilization.utilization}% (Score: ${report.creditFactors.creditUtilization.score}%)`);
      console.log(`   • Credit History: ${report.creditFactors.creditHistory.lengthInYears} years (Score: ${report.creditFactors.creditHistory.score}%)`);
      console.log(`   • Credit Mix: ${report.creditFactors.creditMix.accountsOpen} accounts (Score: ${report.creditFactors.creditMix.score}%)`);
      console.log(`   • New Credit: ${report.creditFactors.newCredit.recentInquiries} inquiries (Score: ${report.creditFactors.newCredit.score}%)`);
      
      return response.data;
    } else {
      console.error('❌ Credit report failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting credit report:', error.message);
    return null;
  }
}

async function demonstrateWeb2JSON(user) {
  console.log(`\n🔗 Step 3: Web2JSON FDC Attestation for ${user.name}`);
  console.log('=' * 65);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/credit-score/web2json/attest`, {
      ssn: user.ssn,
      userAddress: user.userAddress
    });

    if (response.data.success) {
      const attestation = response.data.attestation;
      console.log('✅ Web2JSON Attestation Created Successfully');
      console.log(`🆔 Attestation ID: ${attestation.attestationId}`);
      console.log(`🔐 Data Hash: ${attestation.contractData.dataHash.substring(0, 20)}...`);
      console.log(`🌳 Merkle Root: ${attestation.contractData.merkleRoot.substring(0, 20)}...`);
      console.log(`📦 Block Number: ${attestation.contractData.blockNumber}`);
      console.log(`⏰ Timestamp: ${new Date(attestation.timestamp * 1000).toISOString()}`);
      console.log(`👤 User Address: ${user.userAddress}`);
      
      return response.data;
    } else {
      console.error('❌ Web2JSON attestation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating attestation:', error.message);
    return null;
  }
}

async function demonstrateCompleteFlow(user) {
  console.log(`\n🚀 Step 4: Complete Credit Scoring Flow for ${user.name}`);
  console.log('=' * 70);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/credit-score/complete-flow`, {
      ssn: user.ssn,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      userAddress: user.userAddress
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Complete Flow Executed Successfully');
      console.log(`⚡ Processing Time: ${duration}ms`);
      console.log(`📈 Final Credit Score: ${data.simplifiedData.creditScore}`);
      console.log(`🆔 Attestation ID: ${data.attestation.attestationId}`);
      
      console.log('\n📋 Smart Contract Data Structure:');
      const contractData = data.smartContractData;
      console.log(`   • creditScore: ${contractData.creditScore}`);
      console.log(`   • paymentHistory: ${contractData.paymentHistory}`);
      console.log(`   • creditUtilization: ${contractData.creditUtilization}`);
      console.log(`   • creditHistoryLength: ${contractData.creditHistoryLength} years`);
      console.log(`   • accountsOpen: ${contractData.accountsOpen}`);
      console.log(`   • recentInquiries: ${contractData.recentInquiries}`);
      console.log(`   • publicRecords: ${contractData.publicRecords}`);
      console.log(`   • delinquencies: ${contractData.delinquencies}`);
      console.log(`   • dataHash: ${contractData.dataHash.substring(0, 30)}...`);
      console.log(`   • merkleRoot: ${contractData.merkleRoot.substring(0, 30)}...`);
      console.log(`   • blockNumber: ${contractData.blockNumber}`);
      
      return response.data;
    } else {
      console.error('❌ Complete flow failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in complete flow:', error.message);
    return null;
  }
}

async function demonstrateUser(user, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 DEMONSTRATING USER ${index + 1}: ${user.name.toUpperCase()}`);
  console.log(`   Address: ${user.userAddress}`);
  console.log(`   Expected: ${user.description}`);
  console.log(`${'='.repeat(80)}`);

  // Step 2: Experian API
  const creditReport = await demonstrateExperianAPI(user);
  if (!creditReport) return false;

  // Small delay for better UX
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Web2JSON Attestation
  const attestation = await demonstrateWeb2JSON(user);
  if (!attestation) return false;

  // Small delay for better UX
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 4: Complete Flow
  const completeFlow = await demonstrateCompleteFlow(user);
  if (!completeFlow) return false;

  return true;
}

async function displaySummary() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 DEMONSTRATION COMPLETED SUCCESSFULLY!');
  console.log(`${'='.repeat(80)}`);
  
  console.log(`
📊 What we demonstrated:

1. 🏦 Mock Experian API Integration
   • Realistic credit report generation
   • Comprehensive credit factors analysis
   • Multiple credit profiles (Good, Fair, Excellent)

2. 🔗 Web2JSON FDC Attestation System
   • Off-chain to on-chain data mapping
   • Cryptographic proof generation
   • Merkle tree verification system
   • Flare Data Connector integration

3. 📝 Smart Contract Ready Data
   • Structured data for blockchain consumption
   • Attestation proofs for verification
   • Complete audit trail

4. ⚡ Performance & Reliability
   • Sub-5 second end-to-end processing
   • Robust error handling
   • Comprehensive test coverage

🔮 Next Development Phase:
   • Deploy smart contracts for on-chain scoring
   • Implement The Graph for referral tracking
   • Build user authentication with Circle
   • Create frontend interfaces
   • Add loan approval automation
   • Implement bank insurance pools

🌐 Technical Architecture:
   • Backend: Node.js + Express
   • Blockchain: Flare Network
   • Data Bridge: Web2JSON FDC
   • Credit Data: Experian API (Mock)
   • Testing: Comprehensive test suite

💡 This foundation enables traditional banks to offer DeFi lending
   with familiar credit scoring while leveraging blockchain benefits.
`);
}

async function runDemo() {
  await displayWelcome();
  
  // Step 1: Health Check
  const healthOk = await demonstrateHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Demo cannot continue. Please ensure the server is running:');
    console.log('   cd backend && npm run dev');
    return;
  }

  // Demonstrate each user
  for (let i = 0; i < demoUsers.length; i++) {
    const success = await demonstrateUser(demoUsers[i], i);
    if (!success) {
      console.log(`\n❌ Demo failed for ${demoUsers[i].name}`);
      return;
    }
    
    // Add delay between users for better readability
    if (i < demoUsers.length - 1) {
      console.log('\n⏳ Preparing next demonstration...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await displaySummary();
}

// Run demo if called directly
if (require.main === module) {
  runDemo().catch(error => {
    console.error('\n💥 Demo failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runDemo };
